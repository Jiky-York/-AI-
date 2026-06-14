import React from 'react'
import { Link } from 'react-router-dom'
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  ArrowRight,
  FileText,
  MessageCircle
} from 'lucide-react'

// 模拟数据
const stats = [
  { label: '总项目数', value: '8', icon: FileText, color: 'text-primary', bg: 'bg-primary/10' },
  { label: '高风险项目', value: '3', icon: AlertTriangle, color: 'text-danger', bg: 'bg-danger/10' },
  { label: '待复核项', value: '7', icon: Clock, color: 'text-warning', bg: 'bg-warning/10' },
  { label: '已完成报告', value: '12', icon: CheckCircle, color: 'text-success', bg: 'bg-success/10' },
]

const highRiskProjects = [
  {
    id: 'P002',
    name: '企业数字化转型咨询',
    risk: '最高',
    type: '成本+质量+验收',
    metrics: { cost: '111%', quality: 5, satisfaction: 3.1 }
  },
  {
    id: 'P005',
    name: '智慧园区平台实施',
    risk: '高',
    type: '周期+质量+验收',
    metrics: { cycle: '93%', quality: 4, satisfaction: 3.4 }
  },
  {
    id: 'P006',
    name: '数据治理项目',
    risk: '中',
    type: '周期+规则冲突',
    metrics: { cycle: '98%', quality: 3, satisfaction: 3.8 }
  },
]

const recentActivities = [
  { time: '2小时前', action: 'P002风险预警已发送', type: 'warning' },
  { time: '5小时前', action: '月报生成完成', type: 'success' },
  { time: '1天前', action: 'P005人工复核已完成', type: 'info' },
  { time: '2天前', action: '新项目P008已导入', type: 'info' },
]

function Dashboard() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">项目管理总览</h1>
        <p className="text-text-secondary">实时监控项目风险，智能生成经营分析报告</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="card hover:scale-105 transition-transform" style={{ animationDelay: `${index * 100}ms` }}>
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
              <h3 className="text-3xl font-bold mb-1">{stat.value}</h3>
              <p className="text-sm text-text-secondary">{stat.label}</p>
            </div>
          )
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* High Risk Projects */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-danger" />
              高风险项目
            </h2>
            <Link to="/risk" className="text-primary text-sm flex items-center gap-1 hover:underline">
              查看全部 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-4">
            {highRiskProjects.map((project, index) => (
              <div 
                key={project.id}
                className="p-4 rounded-lg bg-surface-2 border border-border hover:border-primary transition-colors"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm text-primary">{project.id}</span>
                      <span className={`badge ${
                        project.risk === '最高' ? 'badge-danger' : 
                        project.risk === '高' ? 'badge-warning' : 'badge-info'
                      }`}>
                        {project.risk}
                      </span>
                    </div>
                    <h3 className="font-semibold">{project.name}</h3>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-text-secondary">
                  <span>风险类型：{project.type}</span>
                </div>
                <div className="mt-3 flex gap-4">
                  {project.metrics.cost && (
                    <div className="text-xs">
                      <span className="text-text-secondary">成本使用率</span>
                      <div className={`font-mono font-semibold ${parseFloat(project.metrics.cost) > 100 ? 'text-danger' : 'text-warning'}`}>
                        {project.metrics.cost}
                      </div>
                    </div>
                  )}
                  {project.metrics.cycle && (
                    <div className="text-xs">
                      <span className="text-text-secondary">周期使用率</span>
                      <div className={`font-mono font-semibold ${parseFloat(project.metrics.cycle) > 90 ? 'text-danger' : 'text-warning'}`}>
                        {project.metrics.cycle}
                      </div>
                    </div>
                  )}
                  <div className="text-xs">
                    <span className="text-text-secondary">质量问题</span>
                    <div className={`font-mono font-semibold ${project.metrics.quality >= 3 ? 'text-danger' : 'text-text'}`}>
                      {project.metrics.quality}个
                    </div>
                  </div>
                  <div className="text-xs">
                    <span className="text-text-secondary">满意度</span>
                    <div className={`font-mono font-semibold ${project.metrics.satisfaction < 3.8 ? 'text-danger' : 'text-text'}`}>
                      {project.metrics.satisfaction}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              最近动态
            </h2>
          </div>
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div 
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-surface-2 transition-colors"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  activity.type === 'warning' ? 'bg-danger' :
                  activity.type === 'success' ? 'bg-success' : 'bg-primary'
                }`} />
                <div className="flex-1">
                  <p className="text-sm">{activity.action}</p>
                  <p className="text-xs text-text-secondary mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-xl font-bold mb-6">快捷操作</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link 
            to="/report"
            className="p-6 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30 hover:border-primary transition-all group"
          >
            <FileText className="w-8 h-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold mb-1">生成月报</h3>
            <p className="text-sm text-text-secondary">AI智能生成诊断报告</p>
          </Link>
          
          <Link 
            to="/chat"
            className="p-6 rounded-lg bg-gradient-to-br from-secondary/20 to-accent/20 border border-secondary/30 hover:border-secondary transition-all group"
          >
            <MessageCircle className="w-8 h-8 text-secondary mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold mb-1">AI对话</h3>
            <p className="text-sm text-text-secondary">查询项目信息，获取建议</p>
          </Link>
          
          <Link 
            to="/import"
            className="p-6 rounded-lg bg-gradient-to-br from-success/20 to-primary/20 border border-success/30 hover:border-success transition-all group"
          >
            <FileText className="w-8 h-8 text-success mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold mb-1">导入数据</h3>
            <p className="text-sm text-text-secondary">上传Excel/CSV文件</p>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
