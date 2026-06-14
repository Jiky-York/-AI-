# 项目管理与经营分析AI助手

基于OPC复赛需求A开发的完整Web应用

## 功能特性

### 1. 项目风险看板
- 实时展示所有项目的风险状态
- 多维度风险指标可视化（成本、进度、质量）
- 智能优先级排序

### 2. 月报生成器
- AI智能生成月度诊断报告
- 支持选择特定项目生成报告
- 一键复制/下载Markdown格式

### 3. 人工复核管理
- 待复核任务列表
- 责任人分配
- 优先级标记
- 进度跟踪

### 4. AI对话
- 智能问答
- 项目信息查询
- 风险分析建议

### 5. 数据导入
- 支持Excel/CSV文件导入
- 数据预览
- 模板下载

## 技术栈

- **前端**: React 18 + Vite + TailwindCSS
- **后端**: Express.js + Node.js
- **AI**: OpenAI GPT-4（可选）
- **部署**: Vercel

## 快速开始

### 方式一：本地开发

```bash
# 1. 安装前端依赖
cd frontend
npm install

# 2. 启动前端
npm run dev

# 3. 新开终端，启动后端
cd backend
npm install
npm run dev
```

访问 http://localhost:3000

### 方式二：Docker部署

```bash
docker-compose up -d
```

访问 http://localhost:3000

## 环境变量

在 `backend` 目录创建 `.env` 文件：

```env
PORT=3001
OPENAI_API_KEY=your-api-key  # 可选
```

## 部署到Vercel

1. Fork此仓库到GitHub
2. 在Vercel中导入项目
3. 配置环境变量（可选）
4. 点击Deploy

## 作者

吉承宇
北京师范大学
OPC复赛271号

## License

MIT License
