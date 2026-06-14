import express from 'express'

const router = express.Router()

// 模拟项目数据
let projects = [
  { id: 'P001', name: '智能办公系统实施', type: '科技服务', stage: '验收前', budget: 42, cost: 36, planDays: 60, usedDays: 55, riskLevel: '中', qualityIssues: 2, satisfaction: 4.2 },
  { id: 'P002', name: '企业数字化转型咨询', type: '咨询交付', stage: '执行中', budget: 28, cost: 31, planDays: 45, usedDays: 42, riskLevel: '高', qualityIssues: 5, satisfaction: 3.1 },
  { id: 'P003', name: '食品安全检测项目', type: '检测服务', stage: '执行中', budget: 35, cost: 18, planDays: 50, usedDays: 22, riskLevel: '低', qualityIssues: 1, satisfaction: 4.5 },
  { id: 'P004', name: '展馆设计方案', type: '展览策划', stage: '启动', budget: 20, cost: 5, planDays: 35, usedDays: 8, riskLevel: '低', qualityIssues: 0, satisfaction: 4.4 },
  { id: 'P005', name: '智慧园区平台实施', type: '科技服务', stage: '执行中', budget: 55, cost: 49, planDays: 75, usedDays: 70, riskLevel: '高', qualityIssues: 4, satisfaction: 3.4 },
  { id: 'P006', name: '数据治理项目', type: '咨询交付', stage: '验收前', budget: 31, cost: 25, planDays: 40, usedDays: 39, riskLevel: '中', qualityIssues: 3, satisfaction: 3.8 },
  { id: 'P007', name: '环境评估报告', type: '检测服务', stage: '启动', budget: 18, cost: 4, planDays: 30, usedDays: 6, riskLevel: '低', qualityIssues: 0, satisfaction: 4.6 },
  { id: 'P008', name: '客户关系管理系统', type: '科技服务', stage: '执行中', budget: 48, cost: 33, planDays: 65, usedDays: 40, riskLevel: '中', qualityIssues: 2, satisfaction: 4.0 },
]

// 计算风险指标
const calculateRiskMetrics = (project) => {
  const costUsage = (project.cost / project.budget) * 100
  const cycleUsage = (project.usedDays / project.planDays) * 100
  const qualityRisk = project.qualityIssues >= 3 || project.satisfaction < 3.8
  
  return {
    costUsage: costUsage.toFixed(1),
    cycleUsage: cycleUsage.toFixed(1),
    qualityRisk
  }
}

// GET /api/projects - 获取所有项目
router.get('/', (req, res) => {
  const projectsWithRisk = projects.map(p => ({
    ...p,
    ...calculateRiskMetrics(p)
  }))
  res.json(projectsWithRisk)
})

// GET /api/projects/:id - 获取单个项目
router.get('/:id', (req, res) => {
  const project = projects.find(p => p.id === req.params.id)
  if (!project) {
    return res.status(404).json({ error: '项目不存在' })
  }
  res.json({
    ...project,
    ...calculateRiskMetrics(project)
  })
})

// POST /api/projects - 创建项目
router.post('/', (req, res) => {
  const newProject = {
    id: `P${String(projects.length + 1).padStart(3, '0')}`,
    ...req.body
  }
  projects.push(newProject)
  res.status(201).json(newProject)
})

// PUT /api/projects/:id - 更新项目
router.put('/:id', (req, res) => {
  const index = projects.findIndex(p => p.id === req.params.id)
  if (index === -1) {
    return res.status(404).json({ error: '项目不存在' })
  }
  projects[index] = { ...projects[index], ...req.body }
  res.json(projects[index])
})

// DELETE /api/projects/:id - 删除项目
router.delete('/:id', (req, res) => {
  const index = projects.findIndex(p => p.id === req.params.id)
  if (index === -1) {
    return res.status(404).json({ error: '项目不存在' })
  }
  projects.splice(index, 1)
  res.json({ message: '项目已删除' })
})

// POST /api/projects/import - 批量导入项目
router.post('/import', (req, res) => {
  const { projects: newProjects } = req.body
  if (!Array.isArray(newProjects)) {
    return res.status(400).json({ error: '数据格式错误' })
  }
  
  // 简单验证
  const validatedProjects = newProjects.map((p, idx) => ({
    ...p,
    id: p.id || `P${String(projects.length + idx + 1).padStart(3, '0')}`
  }))
  
  projects = [...projects, ...validatedProjects]
  res.json({ 
    message: '导入成功', 
    count: validatedProjects.length,
    projects: validatedProjects
  })
})

// GET /api/projects/stats - 获取统计数据
router.get('/stats/summary', (req, res) => {
  const total = projects.length
  const highRisk = projects.filter(p => {
    const metrics = calculateRiskMetrics(p)
    return metrics.costUsage > 90 || metrics.cycleUsage > 90 || metrics.qualityRisk
  }).length
  
  res.json({
    total,
    highRisk,
    normal: total - highRisk
  })
})

export default router
