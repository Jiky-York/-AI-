import os
from typing import Dict, List

# 项目路径
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
BENCHMARK_DIR = os.path.join(DATA_DIR, "benchmark")
DB_PATH = os.path.join(DATA_DIR, "eval.db")

# 模型配置
MODELS_CONFIG: Dict = {
    "qwen": {
        "name": "通义千问",
        "vendor": "阿里",
        "model": "qwen-turbo",
        "api_type": "dashscope",
        "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1",
        "env_key": "QWEN_API_KEY",
        "price_input": 0.0008,   # 元/千token
        "price_output": 0.002,
        "temperature": 0.0,
    },
    "kimi": {
        "name": "Kimi",
        "vendor": "Moonshot",
        "model": "kimi-k3",
        "api_type": "openai_compatible",
        "base_url": "https://api.moonshot.cn/v1",
        "env_key": "KIMI_API_KEY",
        "price_input": 0.0002,
        "price_output": 0.0016,
        "temperature": 1.0,
        "max_concurrency": 1,
        "min_interval_ms": 2000,
    },
    "deepseek": {
        "name": "DeepSeek",
        "vendor": "DeepSeek",
        "model": "deepseek-chat",
        "api_type": "openai_compatible",
        "base_url": "https://api.deepseek.com/v1",
        "env_key": "DEEPSEEK_API_KEY",
        "price_input": 0.0005,
        "price_output": 0.001,
        "temperature": 0.0,
    },
    "ernie": {
        "name": "文心一言",
        "vendor": "百度",
        "model": "ernie-4.5-turbo-128k",
        "api_type": "openai_compatible",
        "base_url": "https://qianfan.baidubce.com/v2",
        "env_key": "ERNIE_API_KEY",
        "app_id_env": "ERNIE_APP_ID",
        "price_input": 0.0012,
        "price_output": 0.0012,
        "role": "judge",
        "temperature": 0.0,
        "max_concurrency": 5,
        "min_interval_ms": 200,
    },
}

# 评测维度及默认权重
EVAL_DIMENSIONS: List[Dict] = [
    {"key": "accuracy", "name": "准确性", "weight": 0.30},
    {"key": "professionalism", "name": "教育专业性", "weight": 0.20},
    {"key": "completeness", "name": "结构完整性", "weight": 0.20},
    {"key": "format", "name": "格式规范", "weight": 0.10},
    {"key": "safety", "name": "安全性", "weight": 0.10},
    {"key": "latency", "name": "响应时延", "weight": 0.05},
    {"key": "cost", "name": "调用成本", "weight": 0.05},
]

# 评测场景
SCENARIOS = ["作业批改", "课件生成", "教案写作"]

# 默认并发数
DEFAULT_CONCURRENCY = 5

# 重试配置
MAX_RETRIES = 3
RETRY_BACKOFF = [2, 4, 8]  # 指数退避（秒）

# 预算上限（元）
BUDGET_LIMIT = 100.0

# CORS
CORS_ORIGINS = ["*"]
