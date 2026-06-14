import express from 'express'

const router = express.Router()

// 模拟报告数据
const reports = [
  {
    id: 1,
    projectId: 'P002',
    projectName: '企业数字化转型咨询',
    type: '月度诊断报告',
    content: 'P002项目存在成本超支、进度延期、质量问题等多重风险...',
    status: 'completed',
    createdAt: '2024-01-15'
  },
  {
    id: 2,
    projectId: 'P005',
    projectName: '智慧园区平台实施',
    type: '月度诊断报告',
    content: 'P005项目进度正常，但成本接近阈值，需要关注...',
    status: 'completed',
    createdAt: '2024-01-14'
  }
]

// GET /api/report - 获取所有报告
router.get('/', (req, res) => {
  res.json(reports)
})

// POST /api/report/generate - 生成报告
router.post('/generate', async (req, res) => {
  const { projectIds, reportType } = req.body
  
  // 模拟AI生成延迟
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  const newReport = {
    id: reports.length + 1,
    projectId: projectIds.join(','),
    projectName: `项目群(${projectIds.length}个)`,
    type: reportType === 'monthly' ? '月度诊断报告' : '周报',
    content: generateReportContent(projectIds),
    status: 'completed',
    createdAt: new Date().toISOString().split('T')[0]
  }
  
  reports.push(newReport)
  res.json(newReport)
})

// 生成报告内容
function generateReportContent(projectIds) {
  const now = new Date().toLocaleString('zh-CN')
  
  return `# 项目管理诊断报告

## 一、客户问题概述

本次诊断聚焦项目制科技服务公司的项目风险识别与月度经营分析。

## 二、输入材料与证据

本次诊断使用了以下材料：
- 项目经营样例数据
- 规则与审核清单
- 历史案例和SOP

## 三、需求边界

| 字段 | 内容 |
|------|------|
| **目标用户** | 项目经理、业务顾问、审核人 |
| **输入** | 客户原始需求、项目经营样例数据 |
| **输出** | 项目风险判断、诊断报告初稿 |

## 四、数据与规则判断

### 项目风险判断结果

| 项目编号 | 成本使用率 | 周期使用率 | 质量问题 | 满意度 | 优先级 |
|----------|-----------|-----------|----------|--------|--------|
| P002 | 110.7% | 93.3% | 5 | 3.1 | 最高 |
| P005 | 89.1% | 93.3% | 4 | 3.4 | 高 |

## 五、人工复核与风险控制

### 必须人工复核的内容

| 复核项 | 触发条件 | 复核人 |
|--------|----------|--------|
| 成本超预算 | 成本使用率>90%且未验收 | 项目经理 |
| 验收风险 | 验收风险字段为"高" | 审核人 |

### 下一步行动

| 优先级 | 行动项 | 责任人 |
|--------|--------|--------|
| P0 | P002成本超支原因分析会议 | 项目经理 |
| P1 | P005延期原因确认 | 项目经理 |

---

*本报告由项目管理与经营分析AI助手自动生成*
*生成时间：${now}*`
}

// GET /api/report/:id - 获取单个报告
router.get('/:id', (req, res) => {
  const report = reports.find(r => r.id === parseInt(req.params.id))
  if (!report) {
    return res.status(404).json({ error: '报告不存在' })
  }
  res.json(report)
})

export default router
