"""评测引擎：批量推理 + LLM-as-Judge 打分 + 偏见缓解"""
import threading
import time
import json
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Dict, List
from app.models.llm_client import LLMClient, estimate_cost
from app.models.judge import (
    Judge, randomize_model_orders, compute_weighted_score,
    compute_latency_score, compute_cost_score,
)
from app.services.benchmark import load_benchmark
from app.db.database import (
    insert_task, update_task, insert_result, get_task,
)
from app.config import (
    MODELS_CONFIG, EVAL_DIMENSIONS, DEFAULT_CONCURRENCY,
    MAX_RETRIES, RETRY_BACKOFF, BUDGET_LIMIT,
)
from app.utils.logger import get_logger

logger = get_logger(__name__)


def call_model_with_retry(client: LLMClient, messages, temperature=0.0, max_tokens=2048):
    """带重试的模型调用"""
    last_error = None
    for attempt in range(MAX_RETRIES):
        try:
            return client.chat(messages, temperature=temperature, max_tokens=max_tokens)
        except Exception as e:
            last_error = e
            if attempt < MAX_RETRIES - 1:
                # 429 限流时使用更长的等待时间
                err_str = str(e)
                if "429" in err_str or "Too Many Requests" in err_str:
                    wait = RETRY_BACKOFF[attempt] * 3
                else:
                    wait = RETRY_BACKOFF[attempt]
                logger.warning("模型调用失败，%ds 后重试（第 %d 次）: %s", wait, attempt + 1, e)
                time.sleep(wait)
    raise last_error


class EvaluationEngine:
    """评测引擎"""

    def __init__(self):
        self.judge = Judge()
        self._running_tasks = {}  # task_id -> thread

    def create_task(self, task_name, scenarios, models, dimensions=None,
                    weights=None, concurrency=DEFAULT_CONCURRENCY,
                    limit_per_scenario=None):
        """创建评测任务"""
        # 默认维度和权重
        if dimensions is None:
            dimensions = [d["key"] for d in EVAL_DIMENSIONS]
        if weights is None:
            weights = {d["key"]: d["weight"] for d in EVAL_DIMENSIONS}

        # 校验模型可用性
        for m in models:
            client = LLMClient(m)
            if not client.is_available():
                raise RuntimeError(f"模型 {MODELS_CONFIG[m]['name']} 未配置 API Key")

        # 校验评委可用性
        if not self.judge.is_available():
            raise RuntimeError("评委模型（文心一言）未配置 API Key")

        task_id = insert_task(task_name, scenarios, models, dimensions, weights, concurrency)
        # 存储 limit_per_scenario 到任务元数据（用 error_msg 字段暂存，或新增字段）
        # 这里通过 update_task 的额外参数传递
        if limit_per_scenario:
            update_task(task_id, error_msg=f"limit_per_scenario={limit_per_scenario}")
        return task_id

    def run_task_async(self, task_id):
        """异步启动评测任务"""
        t = threading.Thread(target=self._run_task, args=(task_id,), daemon=True)
        t.start()
        self._running_tasks[task_id] = t

    def _run_task(self, task_id):
        """执行评测任务：每个 (query, model) 对独立执行，模型间互不阻塞"""
        try:
            task = get_task(task_id)
            if not task:
                return

            scenarios = json.loads(task["scenarios"])
            models = json.loads(task["models"])
            weights = json.loads(task["weights"])
            concurrency = task["concurrency"]

            update_task(task_id, status="running")

            # 解析 limit_per_scenario（存储在 error_msg 字段中）
            limit_per_scenario = None
            if task.get("error_msg") and task["error_msg"].startswith("limit_per_scenario="):
                limit_per_scenario = int(task["error_msg"].split("=")[1])
                update_task(task_id, error_msg=None)

            # 加载 Benchmark
            queries = load_benchmark(scenarios, limit_per_scenario=limit_per_scenario)
            total_queries = len(queries)
            total_tasks = total_queries * len(models)
            update_task(task_id, total_queries=total_queries)
            logger.info("任务 %d 开始: %d 条 Query, %d 个模型, 共 %d 个子任务",
                        task_id, total_queries, len(models), total_tasks)

            # 初始化客户端
            model_clients = {m: LLMClient(m) for m in models}
            judge = self.judge

            completed = 0
            total_cost = 0.0
            lock = threading.Lock()

            def process_single(query, model_key):
                """处理单个 (query, model) 对：调用模型 → 评委打分 → 入库"""
                nonlocal completed, total_cost
                client = model_clients[model_key]
                msgs = [{"role": "user", "content": query["query"]}]

                # 1. 调用模型
                try:
                    result = call_model_with_retry(client, msgs, 0.0, 2048)
                    output = result["content"]
                    latency_ms = result["latency_ms"]
                    input_tokens = result["input_tokens"]
                    output_tokens = result["output_tokens"]
                    cost = estimate_cost(model_key, input_tokens, output_tokens)
                except Exception as e:
                    logger.error("模型 %s 调用失败: %s", model_key, e)
                    output = f"[ERROR] {str(e)}"
                    latency_ms = 0
                    input_tokens = 0
                    output_tokens = 0
                    cost = 0

                # 2. Judge 打分
                if output.startswith("[ERROR]"):
                    scores = {"accuracy": 1, "professionalism": 1,
                              "completeness": 1, "format": 1, "safety": 1}
                else:
                    try:
                        scores, _ = judge.score(
                            query["query"],
                            query.get("reference_answer", ""),
                            output,
                        )
                    except Exception as e:
                        logger.error("Judge 打分失败: %s", e)
                        scores = {"accuracy": 3, "professionalism": 3,
                                  "completeness": 3, "format": 3, "safety": 3}

                scores["latency"] = compute_latency_score(latency_ms)
                scores["cost"] = compute_cost_score(cost)
                weighted = compute_weighted_score(scores, weights)

                # 3. 入库
                position_order = models.index(model_key)
                insert_result(
                    task_id=task_id,
                    query_id=query["id"],
                    scenario=query["scenario"],
                    subject=query["subject"],
                    difficulty=query["difficulty"],
                    model=model_key,
                    model_output=output,
                    reference_answer=query.get("reference_answer", ""),
                    scores=scores,
                    weighted_score=weighted,
                    latency_ms=latency_ms,
                    input_tokens=input_tokens,
                    output_tokens=output_tokens,
                    cost=cost,
                    position_order=position_order,
                )

                with lock:
                    completed += 1
                    total_cost += cost
                    if completed % 10 == 0 or completed == total_tasks:
                        update_task(task_id, progress=completed, cost_estimate=round(total_cost, 4))
                        logger.info("任务 %d 进度: %d/%d, 费用: %.4f 元",
                                    task_id, completed, total_tasks, total_cost)

            # 生成所有 (query, model) 任务并并发执行
            all_tasks = [(q, m) for q in queries for m in models]
            with ThreadPoolExecutor(max_workers=concurrency * len(models)) as executor:
                futures = [executor.submit(process_single, q, m) for q, m in all_tasks]
                for fut in as_completed(futures):
                    try:
                        fut.result()
                    except Exception as e:
                        logger.error("子任务执行失败: %s", e)

            update_task(task_id, progress=total_tasks, cost_estimate=round(total_cost, 4))
            update_task(task_id, status="completed",
                        finished_at=__import__("datetime").datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
            logger.info("任务 %d 完成，总费用: %.4f 元", task_id, total_cost)

        except Exception as e:
            logger.error("任务 %d 执行失败: %s", task_id, e)
            update_task(task_id, status="failed", error_msg=str(e))
