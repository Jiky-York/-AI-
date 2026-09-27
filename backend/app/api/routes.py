"""API 路由"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
from app.services.evaluation import EvaluationEngine
from app.services.benchmark import get_benchmark_stats, load_benchmark
from app.services.report import generate_report, get_task_progress
from app.db.database import list_tasks, get_task
from app.models.llm_client import get_available_models
from app.config import SCENARIOS, EVAL_DIMENSIONS

router = APIRouter(prefix="/api", tags=["evaluation"])

engine = EvaluationEngine()


class CreateTaskRequest(BaseModel):
    task_name: str
    scenarios: List[str]
    models: List[str]
    dimensions: Optional[List[str]] = None
    weights: Optional[Dict[str, float]] = None
    concurrency: int = 5
    limit_per_scenario: Optional[int] = None


@router.get("/models")
def list_models():
    """获取可用模型列表"""
    models = get_available_models()
    return {"models": models}


@router.get("/scenarios")
def list_scenarios():
    """获取场景列表及统计"""
    stats = get_benchmark_stats()
    return {"scenarios": stats}


@router.get("/dimensions")
def list_dimensions():
    """获取评测维度"""
    return {"dimensions": EVAL_DIMENSIONS}


@router.get("/benchmark")
def get_benchmark(scenario: Optional[str] = None, limit: int = 0):
    """查看 Benchmark 数据"""
    scenarios = [scenario] if scenario else None
    queries = load_benchmark(scenarios, limit if limit > 0 else None)
    return {"total": len(queries), "queries": queries}


@router.get("/tasks")
def get_tasks():
    """获取任务列表"""
    tasks = list_tasks()
    return {"tasks": tasks}


@router.get("/tasks/{task_id}")
def get_task_detail(task_id: int):
    """获取任务详情"""
    task = get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="任务不存在")
    return task


@router.post("/tasks")
def create_task(req: CreateTaskRequest):
    """创建评测任务"""
    try:
        task_id = engine.create_task(
            task_name=req.task_name,
            scenarios=req.scenarios,
            models=req.models,
            dimensions=req.dimensions,
            weights=req.weights,
            concurrency=req.concurrency,
            limit_per_scenario=req.limit_per_scenario,
        )
        engine.run_task_async(task_id)
        return {"task_id": task_id, "status": "running"}
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/tasks/{task_id}/progress")
def task_progress(task_id: int):
    """获取任务进度"""
    progress = get_task_progress(task_id)
    if not progress:
        raise HTTPException(status_code=404, detail="任务不存在")
    return progress


@router.get("/tasks/{task_id}/report")
def task_report(task_id: int):
    """获取评测报告"""
    task = get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="任务不存在")
    report = generate_report(task_id)
    return report
