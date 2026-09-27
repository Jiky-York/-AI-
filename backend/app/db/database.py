import sqlite3
import json
from contextlib import contextmanager
from app.config import DB_PATH
from app.utils.logger import get_logger

logger = get_logger(__name__)


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


@contextmanager
def db_session():
    conn = get_db()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db():
    """初始化数据库表结构"""
    with db_session() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS eval_tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task_name TEXT NOT NULL,
                scenarios TEXT NOT NULL,          -- JSON array
                models TEXT NOT NULL,             -- JSON array
                dimensions TEXT NOT NULL,         -- JSON array
                weights TEXT NOT NULL,            -- JSON object
                concurrency INTEGER DEFAULT 5,
                status TEXT DEFAULT 'pending',    -- pending/running/completed/failed
                total_queries INTEGER DEFAULT 0,
                progress INTEGER DEFAULT 0,
                cost_estimate REAL DEFAULT 0,
                created_at TEXT DEFAULT (datetime('now','localtime')),
                finished_at TEXT,
                error_msg TEXT
            );

            CREATE TABLE IF NOT EXISTS eval_results (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id INTEGER NOT NULL,
                query_id TEXT NOT NULL,
                scenario TEXT NOT NULL,
                subject TEXT NOT NULL,
                difficulty TEXT NOT NULL,
                model TEXT NOT NULL,
                model_output TEXT,
                reference_answer TEXT,
                scores TEXT,                      -- JSON object {dimension: score}
                weighted_score REAL,
                latency_ms INTEGER,
                input_tokens INTEGER,
                output_tokens INTEGER,
                cost REAL,
                position_order INTEGER,           -- 随机化呈现顺序
                review_status TEXT DEFAULT 'pending', -- pending/reviewed
                review_note TEXT,
                FOREIGN KEY (task_id) REFERENCES eval_tasks(id)
            );

            CREATE TABLE IF NOT EXISTS judge_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                result_id INTEGER NOT NULL,
                judge_model TEXT,
                judge_prompt TEXT,
                judge_response TEXT,
                scores TEXT,
                created_at TEXT DEFAULT (datetime('now','localtime')),
                FOREIGN KEY (result_id) REFERENCES eval_results(id)
            );

            CREATE INDEX IF NOT EXISTS idx_results_task ON eval_results(task_id);
            CREATE INDEX IF NOT EXISTS idx_results_query ON eval_results(query_id);
        """)
    logger.info("Database initialized at %s", DB_PATH)


def insert_task(task_name, scenarios, models, dimensions, weights, concurrency):
    with db_session() as conn:
        cur = conn.execute(
            """INSERT INTO eval_tasks (task_name, scenarios, models, dimensions, weights, concurrency)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (task_name, json.dumps(scenarios, ensure_ascii=False),
             json.dumps(models, ensure_ascii=False),
             json.dumps(dimensions, ensure_ascii=False),
             json.dumps(weights, ensure_ascii=False), concurrency)
        )
        return cur.lastrowid


def update_task(task_id, **kwargs):
    fields = ", ".join(f"{k}=?" for k in kwargs)
    values = list(kwargs.values()) + [task_id]
    with db_session() as conn:
        conn.execute(f"UPDATE eval_tasks SET {fields} WHERE id=?", values)


def get_task(task_id):
    with db_session() as conn:
        row = conn.execute("SELECT * FROM eval_tasks WHERE id=?", (task_id,)).fetchone()
        return dict(row) if row else None


def list_tasks(limit=50):
    with db_session() as conn:
        rows = conn.execute(
            "SELECT * FROM eval_tasks ORDER BY id DESC LIMIT ?", (limit,)
        ).fetchall()
        return [dict(r) for r in rows]


def insert_result(task_id, query_id, scenario, subject, difficulty, model,
                  model_output, reference_answer, scores, weighted_score,
                  latency_ms, input_tokens, output_tokens, cost, position_order):
    with db_session() as conn:
        cur = conn.execute(
            """INSERT INTO eval_results
               (task_id, query_id, scenario, subject, difficulty, model, model_output,
                reference_answer, scores, weighted_score, latency_ms, input_tokens,
                output_tokens, cost, position_order)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (task_id, query_id, scenario, subject, difficulty, model, model_output,
             reference_answer, json.dumps(scores, ensure_ascii=False), weighted_score,
             latency_ms, input_tokens, output_tokens, cost, position_order)
        )
        return cur.lastrowid


def get_results_by_task(task_id):
    with db_session() as conn:
        rows = conn.execute(
            "SELECT * FROM eval_results WHERE task_id=? ORDER BY query_id, model", (task_id,)
        ).fetchall()
        return [dict(r) for r in rows]


def get_results_by_query(task_id, query_id):
    with db_session() as conn:
        rows = conn.execute(
            "SELECT * FROM eval_results WHERE task_id=? AND query_id=? ORDER BY position_order",
            (task_id, query_id)
        ).fetchall()
        return [dict(r) for r in rows]
