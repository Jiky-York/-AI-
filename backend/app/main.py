"""FastAPI 主应用"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.config import CORS_ORIGINS
from app.db.database import init_db
from app.api.routes import router
from app.utils.logger import get_logger

logger = get_logger(__name__)

app = FastAPI(title="教育大模型评测中台", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.on_event("startup")
def startup():
    init_db()
    logger.info("应用启动完成")


@app.get("/api/health")
def health():
    return {"status": "ok"}


# 挂载前端静态文件（生产环境）
import os
frontend_dist = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend_dist")
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")
