import React from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  AlertTriangle, 
  FileText, 
  CheckSquare, 
  MessageCircle,
  Upload,
  Settings
} from 'lucide-react'

// Pages
import Dashboard from './pages/Dashboard'
import RiskDashboard from './pages/RiskDashboard'
import ReportGenerator from './pages/ReportGenerator'
import ReviewManagement from './pages/ReviewManagement'
import AIChat from './pages/AIChat'
import DataImport from './pages/DataImport'

// Components
import Sidebar from './components/Sidebar'

function App() {
  return (
    <Router>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 ml-64 p-8 gradient-bg">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/risk" element={<RiskDashboard />} />
            <Route path="/report" element={<ReportGenerator />} />
            <Route path="/review" element={<ReviewManagement />} />
            <Route path="/chat" element={<AIChat />} />
            <Route path="/import" element={<DataImport />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
