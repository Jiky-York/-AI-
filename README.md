# 教育大模型自动化评测中台

面向教育场景（作业批改、课件生成、教案写作）的大模型自动化评测平台，支持多厂商模型横向评测、LLM-as-Judge 自动打分、可视化报告输出。

## 功能特性

- 📊 **Benchmark 管理**：3 大教育场景，126 条评测用例（含参考答案 + Rubric）
- 🤖 **多模型评测**：通义千问、Kimi、DeepSeek 三家被评 + 文心一言 ERNIE 4.0 评委
- ⚖️ **LLM-as-Judge**：7 维度加权打分（准确性/专业性/完整性/格式/安全性/时延/成本）
- 🎲 **偏见缓解**：输出随机化呈现 + 位置交换交叉打分
- 📈 **可视化报告**：雷达图、柱状图、模型明细、逐条对比
- 🎭 **Mock 演示模式**：无需 API Key 即可完整演示评测流程
- 🐳 **Docker 一键部署**

## 技术栈

| 层 | 技术 |
|----|------|
| 前端 | React 18 + Ant Design 5 + ECharts + Vite |
| 后端 | Python FastAPI + SQLite |
| 部署 | Docker Compose |

## 快速开始

### 方式一：Docker Compose 部署（推荐）

```bash
cd edu-llm-eval

# 1. 复制环境变量配置
cp .env.example .env

# 2. 编辑 .env，填入真实 API Key（Mock 模式可跳过）
#    - 被评模型：QWEN_API_KEY、KIMI_API_KEY、DEEPSEEK_API_KEY
#    - 评委模型：ERNIE_API_KEY、ERNIE_SECRET_KEY

# 3. 启动服务
docker-compose up -d --build

# 4. 访问
#    前端：http://<服务器IP>
#    后端 API：http://<服务器IP>:8000/api
```

### 方式二：本地开发运行

```bash
# 后端
cd backend
pip install -r requirements.txt
MOCK_MODE=true python -m uvicorn app.main:app --host 0.0.0.0 --port 8000

# 前端（另开终端）
cd frontend
npm install
npm run dev   # 访问 http://localhost:5173
```

### 方式三：Mock 演示模式（无需 API Key）

设置环境变量 `MOCK_MODE=true` 即可启动演示模式，系统将生成模拟的模型输出和评分，完整展示评测流程。

```bash
# Docker
MOCK_MODE=true docker-compose up -d --build

# 或本地
MOCK_MODE=true python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## 评测工作流

```
1. Benchmark 构建 → 2. 模型配置 → 3. Judge 校准
→ 4. 创建评测任务 → 5. 批量推理 → 6. LLM-as-Judge 打分
→ 7. 人工抽检 → 8. 报告生成 → 9. 结论输出
```

## 评测维度与权重

| 维度 | 权重 | 说明 |
|------|------|------|
| 准确性 | 30% | 答案内容是否正确 |
| 教育专业性 | 20% | 表述符合教学规范 |
| 结构完整性 | 20% | 覆盖所有要求要素 |
| 格式规范 | 10% | 输出格式清晰 |
| 安全性 | 10% | 无不当内容 |
| 响应时延 | 5% | 响应速度 |
| 调用成本 | 5% | Token 费用 |

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/health | 健康检查 |
| GET | /api/models | 可用模型列表 |
| GET | /api/scenarios | 场景及统计 |
| GET | /api/dimensions | 评测维度 |
| GET | /api/benchmark | Benchmark 数据 |
| GET | /api/tasks | 任务列表 |
| POST | /api/tasks | 创建评测任务 |
| GET | /api/tasks/{id} | 任务详情 |
| GET | /api/tasks/{id}/progress | 任务进度 |
| GET | /api/tasks/{id}/report | 评测报告 |

## 项目结构

```
edu-llm-eval/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI 入口
│   │   ├── config.py            # 配置
│   │   ├── api/routes.py        # API 路由
│   │   ├── models/
│   │   │   ├── llm_client.py    # 统一 LLM 适配层
│   │   │   └── judge.py         # LLM-as-Judge 打分
│   │   ├── services/
│   │   │   ├── benchmark.py     # Benchmark 加载
│   │   │   ├── evaluation.py    # 评测引擎
│   │   │   └── report.py        # 报告生成
│   │   └── db/database.py       # 数据库
│   ├── data/benchmark/          # 评测数据集
│   └── requirements.txt
├── frontend/                     # React 前端
├── docker-compose.yml
└── .env.example
```

## API 成本跟踪与发票开具

### 成本自动跟踪

平台在每次评测时自动统计各模型 Token 用量与费用（基于 `config.py` 中各模型单价估算），并在报告页展示“各模型调用成本对比”图与总成本。所有费用记录持久化在 `eval_results.cost` 字段，可随时回溯。

### 发票开具流程

各厂商控制台均支持开具增值税发票，建议按以下步骤操作：

| 厂商 | 控制台路径 | 开票要点 |
|------|-----------|---------|
| 通义千问（阿里） | 阿里云控制台 → 费用 → 发票管理 → 新建发票 | 按账单合并开票，需先完成企业实名认证 |
| Kimi（Moonshot） | Moonshot AI 控制台 → 费用账单 → 发票申请 | 支持电子普票/专票，按月汇总开票 |
| DeepSeek | DeepSeek 开放平台 → 账单 → 发票管理 | 充值后即可申请，电子发票 |
| 文心一言（百度） | 百度智能云控制台 → 费用 → 发票管理 | 需先完成企业认证，按账单周期开票 |

### 报销对接建议

1. 评测前在各厂商控制台完成企业实名认证，避免开票受阻
2. 评测结束后，导出平台报告中的成本统计作为内部报销凭证
3. 汇总各厂商发票 + 平台成本报告，提交财务报销
