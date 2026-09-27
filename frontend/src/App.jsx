import React from 'react'
import { Layout, Menu, Typography } from 'antd'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import {
  DashboardOutlined,
  PlusCircleOutlined,
  UnorderedListOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import Home from './pages/Home.jsx'
import TaskCreate from './pages/TaskCreate.jsx'
import TaskList from './pages/TaskList.jsx'
import Report from './pages/Report.jsx'

const { Header, Sider, Content } = Layout
const { Title } = Typography

function App() {
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: '概览' },
    { key: '/tasks/new', icon: <PlusCircleOutlined />, label: '新建评测' },
    { key: '/tasks', icon: <UnorderedListOutlined />, label: '评测任务' },
  ]

  // 报告页面不显示在菜单中，通过任务列表进入
  const selectedKey = location.pathname.startsWith('/tasks/') && location.pathname !== '/tasks/new'
    ? '/tasks'
    : location.pathname

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="light" width={220}>
        <div style={{ padding: '16px', textAlign: 'center' }}>
          <Title level={5} style={{ margin: 0, color: '#1677ff' }}>教育大模型评测中台</Title>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', borderBottom: '1px solid #f0f0f0' }}>
          <Title level={4} style={{ margin: '16px 0' }}>
            {location.pathname === '/' && '概览'}
            {location.pathname === '/tasks/new' && '新建评测任务'}
            {location.pathname === '/tasks' && '评测任务列表'}
            {location.pathname.startsWith('/tasks/') && location.pathname !== '/tasks/new' && '评测报告'}
          </Title>
        </Header>
        <Content style={{ margin: '24px', background: '#fff', padding: 24, borderRadius: 8, minHeight: 360 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/tasks/new" element={<TaskCreate />} />
            <Route path="/tasks" element={<TaskList />} />
            <Route path="/tasks/:id" element={<Report />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  )
}

export default App
