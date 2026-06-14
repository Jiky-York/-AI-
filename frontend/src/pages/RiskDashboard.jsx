import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  AlertTriangle, 
  TrendingUp,
  Filter,
  Download,
  ChevronDown,
  Eye
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'

// 模拟数据
const allProjects = [
  { id: 'P001', name: '智能办公系统实施', type: '科技服务', stage: '验收前', priority: 4, cost: 85.7, cycle: 91.7, quality: 2, satisfaction: 4.2, riskLevel: 'medium' },
  { id: 'P002', name: '企业数字化转型咨询', type: '咨询交付', stage: '执行中', priority: 1, cost: 110.7, cycle: 93.3, quality: 5, satisfaction: 3.1, riskLevel: 'critical' },
  { id: 'P003', name: '食品安全检测项目', type: '检测服务', stage: '执行中', priority: 6, cost: 51.4, cycle: 44.0, quality: 1, satisfaction: 4.5, riskLevel: 'low' },
  { id: 'P004', name: '展馆设计方案', type: '展览策划', stage: '启动', priority: 7, cost: 25.0, cycle: 22.9, quality: 0, satisfaction: 4.4, riskLevel: 'low' },
  { id: 'P005', name: '智慧园区平台实施', type: '科技服务', stage: '执行中', priority: 2, cost: 89.1, cycle: 93.3, quality: 4, satisfaction: 3.4, riskLevel: 'high' },
  { id: 'P006', name: '数据治理项目', type: '咨询交付', stage: '验收前', priority: 3, cost: 80.6, cycle: 97.5, quality: 3, satisfaction: 3.8, riskLevel: 'medium' },
  { id: 'P007', name: '环境评估报告', type: '检测服务', stage: '启动', priority: 8, cost: 22.2, cycle: 20.0, quality: 0, satisfaction: 4.6, riskLevel: 'low' },
  { id: 'P008', name: '客户关系管理系统', type: '科技服务', stage: '执行中', priority: 5, cost: 68.8, cycle: 61.5, quality: 2, satisfaction: 4.0, riskLevel: 'low' },
]

const radarData = [
  { subject: '成本控制', P002: 30, P005: 70, P006: 60, fullMark: 100 },
  { subject: '进度管理', P002: 40, P005: 50, P006: 80, fullMark: 100 },
  { subject: '质量保障', P002: 20, P005: 40, P006: 55, fullMark: 100 },
  { subject: '客户满意', P002: 35, P005: 45, P006: 60, fullMark: 100 },
  { subject: '验收通过', P002: 25, P005: 35, P006: 50, fullMark: 100 },
]

function RiskDashboard() {
  const [filter, setFilter] = useState('all')
  const [sortBy, setSortBy] = useState('priority')

  const filteredProjects = allProjects
    .filter(p => filter === 'all' || p.riskLevel === filter)
    .sort((a, b) => {
      if (sortBy === 'priority') return a.priority - b.priority
      if (sortBy === 'cost') return b.cost - a.cost
      if (sortBy === 'cycle') return b.cycle - a.cycle
      return 0
    })

  const getRiskBadge = (level) => {
    switch(level) {
      case 'critical': return <span className="badge badge-danger">最高</span>
      case 'high': return <span className="badge badge-warning">高</span>
      case 'medium': return <span className="badge badge-info">中</span>
      case 'low': return <span className="badge badge-success">低</span>
      default: return null
    }
  }

  const getProgressColor = (value, type) => {
    if (type === 'cost') {
      if (value > 100) return 'bg-danger'
      if (value > 90) return 'bg-warning'
      return 'bg-success'
    }
    if (value > 90) return 'bg-danger'
    if (value > 80) return 'bg-warning'
    return 'bg-success'
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">项目风险看板</h1>
          <p className="text-text-secondary">实时监控所有项目的风险状态和关键指标</p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            导出报告
          </button>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Distribution */}
        <div className="card">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            风险分布概览
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredProjects}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="id" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="cost" fill="#ef4444" name="成本使用率%" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Radar Chart */}
        <div className="card">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            高风险项目对比
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="subject" tick={{fill: '#94a3b8', fontSize: 12}} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{fill: '#94a3b8'}} />
                <Radar name="P002" dataKey="P002" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
                <Radar name="P005" dataKey="P005" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} />
                <Radar name="P006" dataKey="P006" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.3} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">项目列表</h2>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-text-secondary" />
              <select 
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="input w-32"
              >
                <option value="all">全部</option>
                <option value="critical">最高</option>
                <option value="high">高</option>
                <option value="medium">中</option>
                <option value="low">低</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-secondary">排序：</span>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="input w-32"
              >
                <option value="priority">优先级</option>
                <option value="cost">成本使用率</option>
                <option value="cycle">周期使用率</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>项目编号</th>
                <th>项目名称</th>
                <th>类型</th>
                <th>阶段</th>
                <th>风险等级</th>
                <th>成本使用率</th>
                <th>周期使用率</th>
                <th>质量问题</th>
                <th>满意度</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((project) => (
                <tr key={project.id}>
                  <td className="font-mono text-primary">{project.id}</td>
                  <td className="font-medium">{project.name}</td>
                  <td>{project.type}</td>
                  <td>{project.stage}</td>
                  <td>{getRiskBadge(project.riskLevel)}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="progress-bar w-20">
                        <div 
                          className={`progress-fill ${getProgressColor(project.cost, 'cost')}`}
                          style={{ width: `${Math.min(project.cost, 120)}%` }}
                        />
                      </div>
                      <span className="font-mono text-sm">{project.cost}%</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="progress-bar w-20">
                        <div 
                          className={`progress-fill ${getProgressColor(project.cycle, 'cycle')}`}
                          style={{ width: `${Math.min(project.cycle, 100)}%` }}
                        />
                      </div>
                      <span className="font-mono text-sm">{project.cycle}%</span>
                    </div>
                  </td>
                  <td>
                    <span className={`font-mono ${project.quality >= 3 ? 'text-danger' : 'text-text'}`}>
                      {project.quality}
                    </span>
                  </td>
                  <td>
                    <span className={`font-mono ${project.satisfaction < 3.8 ? 'text-danger' : 'text-success'}`}>
                      {project.satisfaction}
                    </span>
                  </td>
                  <td>
                    <Link 
                      to={`/review?project=${project.id}`}
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      查看
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default RiskDashboard
