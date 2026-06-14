import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  AlertTriangle, 
  FileText, 
  CheckSquare, 
  MessageCircle,
  Upload,
  Database,
  Zap
} from 'lucide-react'

const menuItems = [
  { path: '/', icon: LayoutDashboard, label: '总览' },
  { path: '/risk', icon: AlertTriangle, label: '风险看板' },
  { path: '/report', icon: FileText, label: '月报生成' },
  { path: '/review', icon: CheckSquare, label: '人工复核' },
  { path: '/chat', icon: MessageCircle, label: 'AI对话' },
  { path: '/import', icon: Upload, label: '数据导入' },
]

function Sidebar() {
  const location = useLocation()

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-surface border-r border-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-text">项目管理</h1>
            <p className="text-xs text-text-secondary">AI助手</p>
          </div>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                ${isActive 
                  ? 'bg-primary/10 text-primary border-l-4 border-primary' 
                  : 'text-text-secondary hover:bg-surface-2 hover:text-text'
                }
              `}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="glass rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-4 h-4 text-success" />
            <span className="text-sm font-medium text-text">数据已同步</span>
          </div>
          <p className="text-xs text-text-secondary">
            共8个项目 · 3个高风险
          </p>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
