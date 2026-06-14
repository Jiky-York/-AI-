"""
项目管理与经营分析AI助手 - 零依赖HTTP服务器
=============================================

仅使用Python 3标准库，无需安装任何第三方包。
启动方法：
    cd project-management-ai
    python3 server.py

访问地址：
    http://localhost:3000
"""
import json
import csv
import io
import os
import random
import sys
import urllib.parse
from http.server import BaseHTTPRequestHandler, HTTPServer
from datetime import datetime

# ------------------------------------------------------------------
# 项目数据（内置，与OPC复赛样例数据一致）
# ------------------------------------------------------------------
PROJECTS = [
    {"id": "P001", "name": "智能办公系统实施",    "type": "科技服务", "stage": "验收前", "budget": 42, "cost": 36, "planDays": 60, "usedDays": 55, "riskLevel": "中", "qualityIssues": 2, "satisfaction": 4.2},
    {"id": "P002", "name": "企业数字化转型咨询",  "type": "咨询交付", "stage": "执行中", "budget": 28, "cost": 31, "planDays": 45, "usedDays": 42, "riskLevel": "高", "qualityIssues": 5, "satisfaction": 3.1},
    {"id": "P003", "name": "食品安全检测项目",    "type": "检测服务", "stage": "执行中", "budget": 35, "cost": 18, "planDays": 50, "usedDays": 22, "riskLevel": "低", "qualityIssues": 1, "satisfaction": 4.5},
    {"id": "P004", "name": "展馆设计方案",        "type": "展览策划", "stage": "启动",   "budget": 20, "cost": 5,  "planDays": 35, "usedDays": 8,  "riskLevel": "低", "qualityIssues": 0, "satisfaction": 4.4},
    {"id": "P005", "name": "智慧园区平台实施",    "type": "科技服务", "stage": "执行中", "budget": 55, "cost": 49, "planDays": 75, "usedDays": 70, "riskLevel": "高", "qualityIssues": 4, "satisfaction": 3.4},
    {"id": "P006", "name": "数据治理项目",        "type": "咨询交付", "stage": "验收前", "budget": 31, "cost": 25, "planDays": 40, "usedDays": 39, "riskLevel": "中", "qualityIssues": 3, "satisfaction": 3.8},
    {"id": "P007", "name": "环境评估报告",        "type": "检测服务", "stage": "启动",   "budget": 18, "cost": 4,  "planDays": 30, "usedDays": 6,  "riskLevel": "低", "qualityIssues": 0, "satisfaction": 4.6},
    {"id": "P008", "name": "客户关系管理系统",    "type": "科技服务", "stage": "执行中", "budget": 48, "cost": 33, "planDays": 65, "usedDays": 40, "riskLevel": "中", "qualityIssues": 2, "satisfaction": 4.0},
]

# 人工复核记录
REVIEW_ITEMS = [
    {"id": 1, "projectId": "P002", "projectName": "企业数字化转型咨询", "type": "成本确认", "content": "成本超预算31万元的具体原因分析", "reason": "成本使用率110.7%，需要确认是合同变更、付款节点还是返工导致", "status": "pending", "priority": "P0", "assignee": "项目经理", "dueDate": "2026-06-20"},
    {"id": 2, "projectId": "P002", "projectName": "企业数字化转型咨询", "type": "质量确认", "content": "质量问题5个的具体分类", "reason": "需要了解质量问题的性质和影响程度", "status": "pending", "priority": "P1", "assignee": "项目经理", "dueDate": "2026-06-22"},
    {"id": 3, "projectId": "P005", "projectName": "智慧园区平台实施", "type": "进度确认", "content": "关键节点延期的具体原因", "reason": "需要了解延期是内部原因还是客户原因", "status": "in_progress", "priority": "P1", "assignee": "项目经理", "dueDate": "2026-06-21"},
    {"id": 4, "projectId": "P006", "projectName": "数据治理项目", "type": "规则确认", "content": "验收材料版本不一致的具体情况", "reason": "需要确认哪些材料版本冲突，影响范围多大", "status": "in_progress", "priority": "P1", "assignee": "审核人", "dueDate": "2026-06-23"},
    {"id": 5, "projectId": "P002", "projectName": "企业数字化转型咨询", "type": "满意度确认", "content": "客户满意度3.1的具体原因", "reason": "需要了解客户不满的具体事项", "status": "completed", "priority": "P2", "assignee": "项目经理", "dueDate": "2026-06-18"},
]

# ------------------------------------------------------------------
# 辅助函数
# ------------------------------------------------------------------
def enrich_project(p):
    """计算风险指标并返回带指标的项目对象"""
    cost_usage = round(p["cost"] / p["budget"] * 100, 1)
    cycle_usage = round(p["usedDays"] / p["planDays"] * 100, 1)
    quality_risk = p["qualityIssues"] >= 3 or p["satisfaction"] < 3.8
    cost_risk = cost_usage > 90
    cycle_risk = cycle_usage > 90
    risk_count = sum([cost_risk, cycle_risk, quality_risk])
    return {
        **p,
        "costUsage": cost_usage,
        "cycleUsage": cycle_usage,
        "qualityRisk": quality_risk,
        "riskCount": risk_count,
    }


def build_report(project_ids=None):
    """基于项目数据生成Markdown诊断报告"""
    if not project_ids:
        project_ids = [p["id"] for p in PROJECTS]

    projects = [enrich_project(p) for p in PROJECTS if p["id"] in project_ids]
    total = len(projects)
    high_risk = [p for p in projects if p["riskCount"] >= 2]
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    lines = []
    lines.append("# 项目管理诊断报告\n")
    lines.append("## 一、客户问题概述\n")
    lines.append(
        "本次诊断聚焦项目制科技服务公司的项目风险识别与月度经营分析。"
        "客户当前的主要问题不是缺少单点工具，而是项目资料、成本数据、验收材料和客户反馈分散，"
        "导致经营分析依赖人工整理，风险发现较晚。\n"
    )
    lines.append("## 二、输入材料与证据\n")
    lines.append("| 材料类别 | 具体材料 |\n|----------|----------|\n")
    lines.append("| 项目数据 | 项目经营样例数据（8个项目） |\n")
    lines.append("| 规则清单 | 报告规则、风险标签、审核清单 |\n")
    lines.append("| 客户访谈 | 8条访谈摘录与需求关键词 |\n")
    lines.append("| 历史案例 | 6个历史案例 + SOP摘要 |\n\n")
    lines.append("## 三、需求边界\n")
    lines.append("| 字段 | 内容 |\n|------|------|\n")
    lines.append("| **目标用户** | 项目经理、业务顾问、审核人 |\n")
    lines.append("| **输入** | 客户原始需求、项目经营样例数据 |\n")
    lines.append("| **输出** | 项目风险判断、诊断报告初稿、人工复核记录 |\n")
    lines.append("| **不做范围** | 不接入真实企业系统，不替代财务和验收最终判断 |\n\n")
    lines.append("### 最小验证路径（2-6周）\n")
    lines.append("| 周次 | 任务内容 | 产出 |\n|------|----------|------|\n")
    lines.append("| 第1周 | 统一项目编号和资料清单 | 项目台账标准化方案 |\n")
    lines.append("| 第2-3周 | 验证风险识别准确性和月报初稿效果 | 风险项目清单 + 报告模板 |\n")
    lines.append("| 第4-6周 | 在真实项目会上复核效果，收集指标 | 效果评估报告 |\n\n")
    lines.append("## 四、数据与规则判断\n")
    lines.append(f"本次共分析 **{total}** 个项目，其中 **{len(high_risk)}** 个为高风险项目。\n\n")
    lines.append("| 项目编号 | 项目名称 | 成本使用率 | 周期使用率 | 质量问题数 | 客户满意度 | 风险项数 | 优先级 |\n")
    lines.append("|----------|----------|-----------|-----------|----------|----------|---------|--------|\n")
    for p in sorted(projects, key=lambda x: -x["riskCount"]):
        priority = "最高" if p["riskCount"] >= 3 else "高" if p["riskCount"] >= 2 else "中" if p["riskCount"] >= 1 else "低"
        lines.append(
            f"| {p['id']} | {p['name']} | {p['costUsage']}% | "
            f"{p['cycleUsage']}% | {p['qualityIssues']} | {p['satisfaction']} | "
            f"{p['riskCount']} | {priority} |"
        )
    lines.append("")
    lines.append("## 五、人工复核与风险控制\n")
    lines.append("| 复核项 | 触发条件 | 复核人 | 复核内容 |\n|--------|----------|--------|----------|\n")
    lines.append("| 成本超预算 | 成本使用率>90%且未验收 | 项目经理 | 合同变更、付款节点、实际人天 |\n")
    lines.append("| 验收风险 | 验收风险等级为高 | 审核人 | 材料版本、对外提交口径 |\n")
    lines.append("| 客户满意度偏低 | 满意度<3.8 | 业务顾问 | 客户沟通、问题定位 |\n\n")
    lines.append("## 六、下一步建议\n")
    lines.append("| 优先级 | 行动项 | 责任人 | 截止时间 |\n|--------|--------|--------|----------|\n")
    lines.append("| P0 | P002成本超支原因分析会议 | 项目经理 | 本周内 |\n")
    lines.append("| P1 | P006验收材料版本核对 | 审核人 | 验收前 |\n")
    lines.append("| P1 | P005延期原因确认 | 项目经理 | 3天内 |\n\n")
    lines.append("---\n")
    lines.append(f"*本报告由项目管理与经营分析AI助手自动生成*  \n")
    lines.append(f"*生成时间：{now}*  \n")
    lines.append(f"*作者：吉承宇 · 北京师范大学 · OPC复赛271号*  \n")
    return "".join(lines)


AI_RESPONSES = {
    "p002": """P002项目存在以下风险：

**成本风险** 🔴
- 成本使用率已达110.7%（超预算3万元）
- 已发生成本31万，预算仅28万

**质量风险** 🟡
- 质量问题数：5个（超过阈值3）
- 客户满意度：3.1（低于阈值3.8）

**进度风险** 🟡
- 周期使用率：93.3%（剩余3天）

**验收风险** 🔴
- 验收风险等级：高

**建议：** 需立即进行人工复核，确认成本超支原因是合同变更、付款节点还是返工。""",

    "priority": """根据综合风险评估，建议优先处理以下项目：

1. **P002（最高优先级）** — 成本+周期+质量+验收，共4项风险
2. **P005（高优先级）** — 周期+质量+验收，共3项风险
3. **P006（中优先级）** — 周期+质量+验收，共3项风险

**风险计算口径：**
- 成本使用率 >90% 且未验收 → 成本风险
- 周期使用率 >90% 且未验收 → 进度风险
- 质量问题 ≥3 或 满意度 <3.8 → 质量风险
- 风险项越多，优先级越高""",

    "default": """您好！我可以帮您分析项目风险、生成诊断报告、回答经营分析相关问题。

您可以问：
- "P002的风险是什么？"
- "哪些项目需要优先处理？"
- "如何降低成本超支风险？"
- "生成诊断报告"

如需详细报告，请前往"月报生成"页面。""",
}


def ai_reply(message):
    """简单关键词匹配的AI回复（零依赖方案）"""
    m = message.lower()
    if any(k in m for k in ["p002", "p002项目", "p002风险"]):
        return AI_RESPONSES["p002"]
    if any(k in m for k in ["优先级", "优先", "风险项目", "哪些项目"]):
        return AI_RESPONSES["priority"]
    return AI_RESPONSES["default"]


# ------------------------------------------------------------------
# HTTP 处理
# ------------------------------------------------------------------
class Handler(BaseHTTPRequestHandler):
    server_version = "ProjectManagementAI/1.0"

    def log_message(self, fmt, *args):
        sys.stderr.write("[%s] %s\n" % (self.log_date_time_string(), fmt % args))

    def _send_json(self, data, code=200):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _send_text(self, text, content_type="text/plain; charset=utf-8", code=200):
        body = text.encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _send_file(self, rel_path, content_type="text/html; charset=utf-8"):
        """从当前脚本所在目录读取静态文件"""
        base_dir = os.path.dirname(os.path.abspath(__file__))
        full = os.path.normpath(os.path.join(base_dir, rel_path))
        # 防目录穿越
        if not full.startswith(base_dir):
            self.send_error(403, "Forbidden")
            return
        if not os.path.isfile(full):
            self.send_error(404, "Not Found")
            return
        with open(full, "rb") as f:
            body = f.read()
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "public, max-age=60")
        self.end_headers()
        self.wfile.write(body)

    # -------------------------- 路由 --------------------------
    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        # 静态资源
        if path in ("/", "/index.html"):
            self._send_file("static/index.html", "text/html; charset=utf-8")
            return
        if path == "/static/app.js":
            self._send_file("static/app.js", "application/javascript; charset=utf-8")
            return
        if path == "/static/app.css":
            self._send_file("static/app.css", "text/css; charset=utf-8")
            return
        if path == "/favicon.ico":
            self.send_response(204)
            self.end_headers()
            return

        # API
        if path == "/api/health":
            self._send_json({"status": "ok", "timestamp": datetime.now().isoformat()})
            return
        if path == "/api/projects":
            self._send_json([enrich_project(p) for p in PROJECTS])
            return
        if path.startswith("/api/projects/"):
            pid = path.split("/")[-1].upper()
            found = next((p for p in PROJECTS if p["id"] == pid), None)
            if found:
                self._send_json(enrich_project(found))
            else:
                self._send_json({"error": "项目不存在"}, 404)
            return
        if path == "/api/projects/stats/summary":
            enriched = [enrich_project(p) for p in PROJECTS]
            self._send_json({
                "total": len(enriched),
                "highRisk": sum(1 for p in enriched if p["riskCount"] >= 2),
                "lowRisk": sum(1 for p in enriched if p["riskCount"] == 0),
            })
            return
        if path == "/api/review":
            self._send_json(REVIEW_ITEMS)
            return
        if path == "/api/report/download":
            md = build_report()
            self._send_text(
                md,
                "text/markdown; charset=utf-8",
                200,
            )
            return

        self.send_error(404, "Not Found")

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length) if length > 0 else b""
        data = {}
        if raw:
            try:
                data = json.loads(raw.decode("utf-8"))
            except json.JSONDecodeError:
                self._send_json({"error": "JSON解析失败"}, 400)
                return

        if path == "/api/ai/chat":
            msg = (data.get("message") or "").strip()
            if not msg:
                self._send_json({"error": "消息不能为空"}, 400)
                return
            self._send_json({
                "response": ai_reply(msg),
                "timestamp": datetime.now().isoformat(),
            })
            return

        if path == "/api/report/generate":
            ids = data.get("projectIds") or []
            md = build_report(ids)
            self._send_json({
                "content": md,
                "projectCount": len(ids) or len(PROJECTS),
                "generatedAt": datetime.now().isoformat(),
            })
            return

        if path == "/api/projects/import":
            projects = data.get("projects") or []
            imported = []
            for p in projects:
                if "id" not in p or not p["id"]:
                    p["id"] = f"P{len(PROJECTS) + len(imported) + 1:03d}"
                # 简单字段补齐
                for key, default in [
                    ("budget", 0), ("cost", 0), ("planDays", 0),
                    ("usedDays", 0), ("qualityIssues", 0), ("satisfaction", 4.0),
                    ("name", "未命名项目"), ("type", "其他"), ("stage", "启动"),
                    ("riskLevel", "低"),
                ]:
                    p.setdefault(key, default)
                imported.append(p)
            PROJECTS.extend(imported)
            self._send_json({"count": len(imported), "projects": imported})
            return

        if path == "/api/review/toggle":
            rid = data.get("id")
            if rid is None:
                self._send_json({"error": "缺少id"}, 400)
                return
            for r in REVIEW_ITEMS:
                if r["id"] == rid:
                    r["status"] = "completed" if r["status"] != "completed" else "pending"
                    self._send_json(r)
                    return
            self._send_json({"error": "记录不存在"}, 404)
            return

        self.send_error(404, "Not Found")


def main():
    host = "0.0.0.0"
    port = 3000
    server = HTTPServer((host, port), Handler)
    print("\n" + "=" * 60)
    print("   项目管理与经营分析AI助手   (零依赖 Python HTTP 服务)")
    print("=" * 60)
    print(f"   访问地址： http://localhost:{port}")
    print(f"   API测试：  http://localhost:{port}/api/health")
    print(f"   项目数据：  http://localhost:{port}/api/projects")
    print("=" * 60)
    print("   按 Ctrl+C 停止服务")
    print("=" * 60 + "\n")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n服务已停止")
        server.server_close()


if __name__ == "__main__":
    main()
