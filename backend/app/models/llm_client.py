"""统一 LLM API 适配层，支持通义千问、Kimi、DeepSeek、文心一言"""
import os
import time
import json
import threading
import urllib.request
import urllib.error
from typing import Dict, Any
from app.config import MODELS_CONFIG
from app.utils.logger import get_logger

logger = get_logger(__name__)

# 模型级别的并发信号量（防止触发 API 限流）
_model_semaphores: Dict[str, threading.Semaphore] = {}
# 模型上次请求时间（用于最小间隔控制）
_last_request_time: Dict[str, float] = {}
_last_request_lock = threading.Lock()


def _get_semaphore(model_key: str) -> threading.Semaphore:
    """获取模型的并发信号量"""
    if model_key not in _model_semaphores:
        max_conc = MODELS_CONFIG[model_key].get("max_concurrency", 20)
        _model_semaphores[model_key] = threading.Semaphore(max_conc)
    return _model_semaphores[model_key]


def _wait_for_interval(model_key: str):
    """确保两次请求之间的最小间隔"""
    min_interval = MODELS_CONFIG[model_key].get("min_interval_ms", 0) / 1000.0
    if min_interval <= 0:
        return
    with _last_request_lock:
        now = time.time()
        last = _last_request_time.get(model_key, 0)
        wait = min_interval - (now - last)
        if wait > 0:
            time.sleep(wait)
        _last_request_time[model_key] = time.time()


class LLMClient:
    """统一大模型调用客户端"""

    def __init__(self, model_key: str):
        if model_key not in MODELS_CONFIG:
            raise ValueError(f"Unknown model: {model_key}")
        self.model_key = model_key
        self.cfg = MODELS_CONFIG[model_key]
        self.api_key = os.environ.get(self.cfg.get("env_key", ""), "")
        # 千帆 v2 需要 appid 请求头（应用身份 ID，形如 app-XXXX）
        self.app_id = os.environ.get(self.cfg.get("app_id_env", ""), "")
        self.mock_mode = os.environ.get("MOCK_MODE", "").lower() in ("1", "true", "yes")

    def is_available(self) -> bool:
        """检查 API Key 是否配置（Mock 模式下始终可用）"""
        return bool(self.api_key) or self.mock_mode

    def chat(self, messages, temperature=0.0, max_tokens=2048) -> Dict[str, Any]:
        """
        调用大模型对话接口
        返回: {"content": str, "input_tokens": int, "output_tokens": int, "latency_ms": int}
        """
        if self.mock_mode:
            return self._mock_chat(messages, max_tokens)

        if not self.api_key:
            raise RuntimeError(
                f"模型 {self.cfg['name']} 未配置 API Key（环境变量 {self.cfg['env_key']}）"
            )

        semaphore = _get_semaphore(self.model_key)
        with semaphore:
            _wait_for_interval(self.model_key)
            start = time.time()
            try:
                result = self._call_openai_compatible(messages, temperature, max_tokens)
                result["latency_ms"] = int((time.time() - start) * 1000)
                return result
            except Exception as e:
                logger.error("调用模型 %s 失败: %s", self.model_key, e)
                raise

    def _mock_chat(self, messages, max_tokens) -> Dict:
        """Mock 模式：生成模拟响应"""
        import random
        time.sleep(random.uniform(0.3, 1.2))  # 模拟网络延迟
        user_msg = messages[-1]["content"] if messages else ""
        model_name = self.cfg["name"]
        responses = {
            "通义千问": f"【通义千问】已处理您的请求。\n\n{user_msg[:100]}...\n\n这是一个详细的回答，涵盖了问题的各个方面，给出了清晰的步骤和建议。",
            "Kimi": f"【Kimi】您好！关于您的问题，我的回答如下：\n\n{user_msg[:100]}...\n\n经过分析，我认为需要从以下几个方面来处理这个问题，确保结果准确且符合教育规范。",
            "DeepSeek": f"【DeepSeek】收到您的请求。\n\n针对「{user_msg[:80]}...」这一问题，我将分步骤进行解答，确保每个环节都清晰准确，符合教学要求。",
            "文心一言": f"【文心一言评测】\n\n该回答内容较为完整，准确性较好，教育专业性强，结构清晰，格式规范，无安全问题。",
        }
        content = responses.get(model_name, f"【{model_name}】模拟响应内容")
        return {
            "content": content,
            "input_tokens": len(user_msg) // 2,
            "output_tokens": len(content) // 2,
            "latency_ms": int(random.uniform(300, 1500)),
        }

    def _call_openai_compatible(self, messages, temperature, max_tokens) -> Dict:
        """调用 OpenAI 兼容接口（通义千问 / Kimi / DeepSeek / 文心一言千帆v2）"""
        base_url = self.cfg["base_url"]
        url = f"{base_url}/chat/completions"

        # 若模型配置了固定 temperature（如 Kimi 仅允许 1.0），则使用配置值
        effective_temp = self.cfg.get("temperature", temperature)

        payload = json.dumps({
            "model": self.cfg["model"],
            "messages": messages,
            "temperature": effective_temp,
            "max_tokens": max_tokens,
        }).encode("utf-8")

        req = urllib.request.Request(url, data=payload, method="POST")
        req.add_header("Content-Type", "application/json")
        req.add_header("Authorization", f"Bearer {self.api_key}")
        # 千帆 v2 兼容接口需要额外携带 appid 请求头
        if self.app_id:
            req.add_header("appid", self.app_id)

        with urllib.request.urlopen(req, timeout=120) as resp:
            data = json.loads(resp.read().decode("utf-8"))

        choice = data["choices"][0]
        usage = data.get("usage", {})
        return {
            "content": choice["message"]["content"],
            "input_tokens": usage.get("prompt_tokens", 0),
            "output_tokens": usage.get("completion_tokens", 0),
        }


def get_available_models() -> list:
    """获取所有已配置 API Key 的模型"""
    available = []
    for key, cfg in MODELS_CONFIG.items():
        client = LLMClient(key)
        if client.is_available():
            available.append({
                "key": key,
                "name": cfg["name"],
                "vendor": cfg["vendor"],
                "model": cfg["model"],
                "role": cfg.get("role", "eval"),
            })
    return available


def estimate_cost(model_key: str, input_tokens: int, output_tokens: int) -> float:
    """估算调用费用（元）"""
    cfg = MODELS_CONFIG.get(model_key, {})
    cost = (input_tokens / 1000) * cfg.get("price_input", 0) + \
           (output_tokens / 1000) * cfg.get("price_output", 0)
    return round(cost, 6)
