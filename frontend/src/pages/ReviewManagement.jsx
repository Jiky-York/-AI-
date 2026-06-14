import React, { useState } from 'react'
import { 
  CheckSquare, 
  Clock, 
  User,
  AlertCircle,
  CheckCircle2,
  Filter
} from 'lucide-react'

// 模拟复核数据
const reviewItems = [
  {
    id: 1,
    projectId: 'P002',
    projectName: '企业数字化转型咨询',
    type: '成本确认',
    content: '成本超预算31万元的具体原因分析',
    reason: '成本使用率111%，需要确认是合同变更、付款节点、实际人天还是返工导致',
    status: 'pending',
    priority: 'P0',
    assignee: '项目经理',
    dueDate: '2024-01-20',
    createdAt: '2024-01-15'
  },
  {
    id: 2,
    projectId: 'P002',
    projectName: '企业数字化转型咨询',
    type: '质量确认',
    content: '质量问题5个的具体分类',
    reason: '需要了解质量问题的性质和影响程度',
    status: 'pending',
    priority: 'P1',
    assignee: '项目经理',
    dueDate: '2024-01-22',
    createdAt: '2024-01-15'
  },
  {
    id: 3,
    projectId: 'P005',
    projectName: '智慧园区平台实施',
    type: '进度确认',
    content: '关键节点延期的具体原因',
    reason: '需要了解延期是内部原因还是客户原因',
    status: 'pending',
    priority: 'P1',
    assignee: '项目经理',
    dueDate: '2024-01-21',
    createdAt: '2024-01-16'
  },
  {
    id: 4,
    projectId: 'P006',
    projectName: '数据治理项目',
    type: '规则确认',
    content: '验收材料版本不一致的具体情况',
    reason: '需要确认哪些材料版本冲突，影响范围多大',
    status: 'in_progress',
    priority: 'P1',
    assignee: '审核人',
    dueDate: '2024-01-23',
    createdAt: '2024-01-17'
  },
  {
    id: 5,
    projectId: 'P002',
    projectName: '企业数字化转型咨询',
    type: '满意度确认',
    content: '客户满意度3.1的具体原因',
    reason: '需要了解客户不满的具体事项',
    status: 'completed',
    priority: 'P2',
    assignee: '项目经理',
    dueDate: '2024-01-18',
    createdAt: '2024-01-14'
  },
]

function ReviewManagement() {
  const [filter, setFilter] = useState('all')
  const [items, setItems] = useState(reviewItems)

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending': return <span className="badge badge-warning">待处理</span>
      case 'in_progress': return <span className="badge badge-info">进行中</span>
      case 'completed': return <span className="badge badge-success">已完成</span>
      default: return null
    }
  }

  const getPriorityBadge = (priority) => {
    switch(priority) {
      case 'P0': return <span className="text-danger font-bold">{priority}</span>
      case 'P1': return <span className="text-warning font-bold">{priority}</span>
      case 'P2': return <span className="text-primary font-bold">{priority}</span>
      default: return <span>{priority}</span>
    }
  }

  const handleComplete = (id) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, status: 'completed' } : item
    ))
  }

  const filteredItems = items.filter(item => 
    filter === 'all' || item.status === filter
  )

  const stats = {
    total: items.length,
    pending: items.filter(i => i.status === 'pending').length,
    in_progress: items.filter(i => i.status === 'in_progress').length,
    completed: items.filter(i => i.status === 'completed').length,
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">人工复核管理</h1>
        <p className="text-text-secondary">管理需要人工确认的关键复核点</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary mb-1">总复核项</p>
              <p className="text-3xl font-bold">{stats.total}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-surface-2 flex items-center justify-center">
              <CheckSquare className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary mb-1">待处理</p>
              <p className="text-3xl font-bold text-warning">{stats.pending}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center">
              <Clock className="w-6 h-6 text-warning" />
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary mb-1">进行中</p>
              <p className="text-3xl font-bold text-primary">{stats.in_progress}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary mb-1">已完成</p>
              <p className="text-3xl font-bold text-success">{stats.completed}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-success" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">复核列表</h2>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-text-secondary" />
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="input w-40"
            >
              <option value="all">全部</option>
              <option value="pending">待处理</option>
              <option value="in_progress">进行中</option>
              <option value="completed">已完成</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {filteredItems.map((item, index) => (
            <div 
              key={item.id}
              className="p-5 rounded-lg bg-surface-2 border border-border hover:border-primary transition-all"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center gap-1">
                    {getPriorityBadge(item.priority)}
                    <span className="font-mono text-xs text-primary">{item.projectId}</span>
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">{item.content}</h3>
                    <p className="text-sm text-text-secondary">{item.projectName}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {getStatusBadge(item.status)}
                  <span className="text-xs text-text-secondary">
                    截止：{item.dueDate}
                  </span>
                </div>
              </div>

              <div className="mb-4 p-3 rounded-lg bg-surface">
                <p className="text-sm text-text-secondary mb-1">复核原因：</p>
                <p className="text-sm">{item.reason}</p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-text-secondary">
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {item.assignee}
                  </span>
                  <span className="badge badge-info">{item.type}</span>
                </div>
                {item.status !== 'completed' && (
                  <button 
                    onClick={() => handleComplete(item.id)}
                    className="btn btn-primary text-sm px-4 py-2 flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    标记完成
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ReviewManagement
