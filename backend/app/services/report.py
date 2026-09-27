"""评测报告生成与统计服务"""
import json
from collections import defaultdict
from typing import Dict, List
from app.db.database import get_task, get_results_by_task
from app.config import EVAL_DIMENSIONS, MODELS_CONFIG
from app.utils.logger import get_logger

logger = get_logger(__name__)


def generate_report(task_id: int) -> Dict:
    """生成评测报告"""
    task = get_task(task_id)
    if not task:
        return None

    results = get_results_by_task(task_id)
    if not results:
        return {"task": task, "summary": {}, "by_model": {}, "by_scenario": {}, "details": []}

    # 解析分数
    for r in results:
        r["scores"] = json.loads(r["scores"]) if isinstance(r["scores"], str) else r["scores"]

    # 按模型聚合
    by_model = defaultdict(lambda: {"scores": defaultdict(list), "weighted": [], "cost": 0, "latency": []})
    for r in results:
        m = r["model"]
        by_model[m]["cost"] += r["cost"] or 0
        by_model[m]["latency"].append(r["latency_ms"] or 0)
        by_model[m]["weighted"].append(r["weighted_score"] or 0)
        for dim in EVAL_DIMENSIONS:
            key = dim["key"]
            if key in r["scores"]:
                by_model[m]["scores"][key].append(r["scores"][key])

    # 计算每个模型的平均得分
    model_summary = {}
    for m, data in by_model.items():
        avg_scores = {}
        for dim in EVAL_DIMENSIONS:
            key = dim["key"]
            vals = data["scores"].get(key, [])
            avg_scores[key] = round(sum(vals) / len(vals), 2) if vals else 0
        avg_weighted = round(sum(data["weighted"]) / len(data["weighted"]), 2) if data["weighted"] else 0
        avg_latency = round(sum(data["latency"]) / len(data["latency"]), 0) if data["latency"] else 0
        model_summary[MODELS_CONFIG[m]["name"]] = {
            "scores": avg_scores,
            "weighted_score": avg_weighted,
            "total_cost": round(data["cost"], 4),
            "avg_latency_ms": avg_latency,
            "sample_count": len(data["weighted"]),
        }

    # 按场景+模型聚合
    by_scenario_model = defaultdict(lambda: defaultdict(list))
    for r in results:
        by_scenario_model[r["scenario"]][r["model"]].append(r["weighted_score"] or 0)

    scenario_summary = {}
    for scenario, models in by_scenario_model.items():
        scenario_summary[scenario] = {}
        for m, scores in models.items():
            scenario_summary[scenario][MODELS_CONFIG[m]["name"]] = round(
                sum(scores) / len(scores), 2
            ) if scores else 0

    # 按难度+模型聚合
    by_diff_model = defaultdict(lambda: defaultdict(list))
    for r in results:
        by_diff_model[r["difficulty"]][r["model"]].append(r["weighted_score"] or 0)

    difficulty_summary = {}
    for diff, models in by_diff_model.items():
        difficulty_summary[diff] = {}
        for m, scores in models.items():
            difficulty_summary[diff][MODELS_CONFIG[m]["name"]] = round(
                sum(scores) / len(scores), 2
            ) if scores else 0

    # 总体统计
    all_weighted = [r["weighted_score"] or 0 for r in results]
    summary = {
        "total_queries": len(set(r["query_id"] for r in results)),
        "total_evaluations": len(results),
        "avg_weighted_score": round(sum(all_weighted) / len(all_weighted), 2) if all_weighted else 0,
        "total_cost": round(sum(r["cost"] or 0 for r in results), 4),
        "avg_latency_ms": round(sum(r["latency_ms"] or 0 for r in results) / len(results), 0) if results else 0,
        "dimensions": [d["name"] for d in EVAL_DIMENSIONS],
    }

    # 明细（按 Query 分组的多模型对比）
    details = []
    query_groups = defaultdict(list)
    for r in results:
        query_groups[r["query_id"]].append(r)
    for qid, group in query_groups.items():
        details.append({
            "query_id": qid,
            "scenario": group[0]["scenario"],
            "subject": group[0]["subject"],
            "difficulty": group[0]["difficulty"],
            "reference_answer": group[0]["reference_answer"],
            "outputs": [
                {
                    "model": MODELS_CONFIG[g["model"]]["name"],
                    "output": g["model_output"],
                    "scores": g["scores"],
                    "weighted_score": g["weighted_score"],
                    "latency_ms": g["latency_ms"],
                    "cost": g["cost"],
                }
                for g in group
            ],
        })

    return {
        "task": {
            "id": task["id"],
            "name": task["task_name"],
            "status": task["status"],
            "created_at": task["created_at"],
            "finished_at": task["finished_at"],
        },
        "summary": summary,
        "model_summary": model_summary,
        "scenario_summary": scenario_summary,
        "difficulty_summary": difficulty_summary,
        "details": details,
    }


def get_task_progress(task_id: int) -> Dict:
    """获取任务进度"""
    task = get_task(task_id)
    if not task:
        return None
    import json
    models = json.loads(task["models"]) if task.get("models") else []
    total_queries = task["total_queries"] or 0
    total_subtasks = total_queries * len(models) if models else total_queries
    return {
        "id": task["id"],
        "name": task["task_name"],
        "status": task["status"],
        "progress": task["progress"],
        "total": total_subtasks,
        "cost_estimate": task["cost_estimate"],
        "error_msg": task["error_msg"],
    }
