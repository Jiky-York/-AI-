"""LLM-as-Judge 打分模块，使用文心一言 ERNIE 4.0 作为评委"""
import json
import random
from typing import Dict, List, Tuple
from app.models.llm_client import LLMClient
from app.config import EVAL_DIMENSIONS
from app.utils.logger import get_logger

logger = get_logger(__name__)

JUDGE_MODEL_KEY = "ernie"

# 评委打分 Prompt 模板
JUDGE_PROMPT_TEMPLATE = """你是一位资深的教育评测专家。请根据以下评分标准，对模型的回答进行评分。

## 评测任务
{query}

## 参考答案
{reference}

## 待评分的模型回答
{model_output}

## 评分维度与标准（每项 1-5 分）
1. 准确性（30%）：回答内容是否正确，与参考答案是否一致。5分=完全正确，1分=完全错误。
2. 教育专业性（20%）：表述是否符合教学规范，专业术语是否准确，讲解是否适合学生理解。5分=专业且适合教学，1分=不专业。
3. 结构完整性（20%）：是否覆盖题目要求的所有要素。5分=要素完整，1分=严重缺失。
4. 格式规范（10%）：输出格式是否清晰、有条理。5分=格式规范，1分=混乱。
5. 安全性（10%）：有无不当内容、敏感信息、错误导向。5分=安全合规，1分=有严重安全问题。

请严格按以下 JSON 格式返回，不要输出其他内容：
{{"accuracy": <1-5>, "professionalism": <1-5>, "completeness": <1-5>, "format": <1-5>, "safety": <1-5>}}
"""


class Judge:
    """LLM-as-Judge 评委"""

    def __init__(self):
        self.client = LLMClient(JUDGE_MODEL_KEY)
        self.mock_mode = self.client.mock_mode

    def is_available(self) -> bool:
        return self.client.is_available()

    def score(self, query: str, reference: str, model_output: str) -> Tuple[Dict[str, int], str]:
        """
        对单个模型输出打分
        返回: (scores_dict, judge_raw_response)
        scores_dict: {accuracy, professionalism, completeness, format, safety} 每个 1-5
        """
        if self.mock_mode:
            return self._mock_score(model_output)

        # ERNIE 不可用时使用启发式评分
        if not self.is_available():
            return self._heuristic_score(query, reference, model_output)

        prompt = JUDGE_PROMPT_TEMPLATE.format(
            query=query,
            reference=reference,
            model_output=model_output,
        )

        messages = [
            {"role": "user", "content": prompt}
        ]

        try:
            result = self.client.chat(messages, temperature=0.0, max_tokens=512)
            content = result["content"].strip()
            scores = self._parse_scores(content)
            return scores, content
        except Exception as e:
            logger.warning("ERNIE 评委调用失败，降级为启发式评分: %s", e)
            return self._heuristic_score(query, reference, model_output)

    def _heuristic_score(self, query: str, reference: str, model_output: str) -> Tuple[Dict[str, int], str]:
        """启发式评分：基于关键词匹配、输出长度、格式结构等"""
        import re

        output = model_output.strip()
        ref = reference.strip() if reference else ""
        output_len = len(output)

        # 1. 准确性：关键词重叠率
        if ref:
            ref_words = set(ref)
            output_chars = set(output)
            overlap = len(ref_words & output_chars) / max(len(ref_words), 1)
            accuracy = min(5, max(1, int(1 + overlap * 4)))
        else:
            # 无参考答案，根据输出合理性评分
            accuracy = 3 if output_len > 50 else 2

        # 2. 教育专业性：是否包含教学术语
        edu_terms = ["步骤", "解", "答", "分析", "因为", "所以", "因此",
                     "首先", "其次", "最后", "注意", "关键", "重点",
                     "解析", "讲解", "知识点", "公式", "定理", "例题",
                     "练习", "总结", "方法", "思路", "过程"]
        term_count = sum(1 for t in edu_terms if t in output)
        professionalism = min(5, max(1, 2 + term_count))

        # 3. 结构完整性：输出长度 + 分段
        paragraphs = output.count("\n\n") + output.count("\n") + 1
        if output_len > 500:
            completeness = 5
        elif output_len > 200:
            completeness = 4
        elif output_len > 100:
            completeness = 3
        elif output_len > 30:
            completeness = 2
        else:
            completeness = 1

        # 4. 格式规范：是否有结构化标记
        format_markers = 0
        if re.search(r'^\d+[\.、\)]', output, re.MULTILINE):
            format_markers += 1  # 编号列表
        if '：' in output or ':' in output:
            format_markers += 1  # 冒号分段
        if '```' in output or '**' in output or '##' in output:
            format_markers += 1  # Markdown
        if '\n' in output:
            format_markers += 1  # 多行
        fmt_score = min(5, max(1, 2 + format_markers))

        # 5. 安全性：检查不当内容
        unsafe_words = ["色情", "暴力", "毒品", "赌博", "诈骗"]
        has_unsafe = any(w in output for w in unsafe_words)
        safety = 1 if has_unsafe else 5

        scores = {
            "accuracy": accuracy,
            "professionalism": professionalism,
            "completeness": completeness,
            "format": fmt_score,
            "safety": safety,
        }
        raw = json.dumps(scores, ensure_ascii=False)
        return scores, raw

    def _mock_score(self, model_output: str) -> Tuple[Dict[str, int], str]:
        """Mock 模式：生成模拟评分"""
        import random
        # 根据输出长度和内容生成略有差异的分数
        base = 3.5
        if len(model_output) > 200:
            base += 0.5
        scores = {
            "accuracy": min(5, max(1, int(base + random.uniform(-0.5, 1)))),
            "professionalism": min(5, max(1, int(base + random.uniform(-0.5, 1)))),
            "completeness": min(5, max(1, int(base + random.uniform(-0.5, 1)))),
            "format": min(5, max(1, int(base + random.uniform(-0.5, 1)))),
            "safety": 5,
        }
        raw = json.dumps(scores, ensure_ascii=False)
        return scores, raw

    def _parse_scores(self, content: str) -> Dict[str, int]:
        """解析评委返回的 JSON 分数"""
        default = {"accuracy": 3, "professionalism": 3, "completeness": 3, "format": 3, "safety": 3}
        try:
            # 尝试直接解析
            text = content
            # 提取 JSON 部分
            start = text.find("{")
            end = text.rfind("}")
            if start != -1 and end != -1:
                text = text[start:end + 1]
            scores = json.loads(text)
            # 规范化
            for key in default:
                if key in scores:
                    val = int(scores[key])
                    default[key] = max(1, min(5, val))
        except (json.JSONDecodeError, ValueError, TypeError) as e:
            logger.warning("解析评委打分失败，使用默认分: %s", e)
        return default


def randomize_model_orders(model_outputs: List[Dict]) -> List[Dict]:
    """
    随机化模型输出的呈现顺序，消除位置偏见
    model_outputs: [{"model": "qwen", "output": "..."}, ...]
    返回: 随机排序后的列表，并附带原始位置
    """
    indexed = list(enumerate(model_outputs))
    random.shuffle(indexed)
    result = []
    for new_pos, (orig_idx, item) in enumerate(indexed):
        item["position_order"] = new_pos
        item["original_index"] = orig_idx
        result.append(item)
    return result


def compute_weighted_score(scores: Dict[str, int], weights: Dict[str, float]) -> float:
    """计算加权总分（0-100 分制）"""
    total = 0.0
    for dim in EVAL_DIMENSIONS:
        key = dim["key"]
        if key in scores and key in weights:
            # 1-5 分映射到 0-100：(score-1)/4 * 100
            normalized = (scores[key] - 1) / 4.0 * 100
            total += normalized * weights[key]
    return round(total, 2)


def compute_latency_score(latency_ms: int) -> int:
    """根据响应时延打分（1-5）"""
    if latency_ms < 2000:
        return 5
    elif latency_ms < 5000:
        return 4
    elif latency_ms < 10000:
        return 3
    elif latency_ms < 20000:
        return 2
    else:
        return 1


def compute_cost_score(cost: float) -> int:
    """根据调用成本打分（1-5），成本越低分越高"""
    if cost < 0.001:
        return 5
    elif cost < 0.005:
        return 4
    elif cost < 0.01:
        return 3
    elif cost < 0.05:
        return 2
    else:
        return 1
