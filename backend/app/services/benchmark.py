"""Benchmark 数据加载服务"""
import os
import json
from app.config import BENCHMARK_DIR, SCENARIOS
from app.utils.logger import get_logger

logger = get_logger(__name__)

# 场景与文件名映射
SCENARIO_FILES = {
    "作业批改": "homework.json",
    "课件生成": "courseware.json",
    "教案写作": "lesson_plan.json",
}


def load_benchmark(scenarios=None, limit_per_scenario=None):
    """
    加载 Benchmark 数据
    scenarios: 要加载的场景列表，None 表示全部
    limit_per_scenario: 每个场景加载的条数限制，None 表示全部
    返回: 合并后的 Query 列表
    """
    if scenarios is None:
        scenarios = SCENARIOS

    all_queries = []
    for scenario in scenarios:
        filename = SCENARIO_FILES.get(scenario)
        if not filename:
            logger.warning("未知场景: %s", scenario)
            continue
        filepath = os.path.join(BENCHMARK_DIR, filename)
        if not os.path.exists(filepath):
            logger.warning("Benchmark 文件不存在: %s", filepath)
            continue
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
        if limit_per_scenario:
            data = data[:limit_per_scenario]
        all_queries.extend(data)
        logger.info("加载场景 %s: %d 条 Query", scenario, len(data))

    return all_queries


def get_benchmark_stats():
    """获取各场景统计信息"""
    stats = {}
    for scenario, filename in SCENARIO_FILES.items():
        filepath = os.path.join(BENCHMARK_DIR, filename)
        if not os.path.exists(filepath):
            stats[scenario] = {"count": 0, "subjects": [], "difficulties": []}
            continue
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
        subjects = list(set(item.get("subject", "") for item in data))
        difficulties = list(set(item.get("difficulty", "") for item in data))
        stats[scenario] = {
            "count": len(data),
            "subjects": subjects,
            "difficulties": difficulties,
        }
    return stats
