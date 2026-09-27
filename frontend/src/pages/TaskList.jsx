import React, { useEffect, useState } from 'react'
import { Table, Tag, Button, Space, Typography, message } from 'antd'
import { ReloadOutlined, EyeOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { getTasks } from '../services/api'

const { Text } = Typography

const statusMap = {
  pending: { text: '待运行', color: 'default' },
  running: { text: '运行中', color: 'processing' },
  completed: { text: '已完成', color: 'success' },
  failed: { text: '失败', color: 'error' },
}

export default function TaskList() {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(false)

  const loadTasks = () => {
    setLoading(true)
    getTasks()
      .then(d => setTasks(d.tasks || []))
      .catch(() => message.error('加载失败'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadTasks()
    const timer = setInterval(loadTasks, 3000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ReloadOutlined />} onClick={loadTasks} loading={loading}>刷新</Button>
        <Button type="primary" onClick={() => navigate('/tasks/new')}>新建评测</Button>
      </Space>

      <Table
        dataSource={tasks}
        rowKey="id"
        loading={loading}
        columns={[
          { title: 'ID', dataIndex: 'id', width: 60 },
          { title: '任务名称', dataIndex: 'task_name' },
          {
            title: '场景',
            dataIndex: 'scenarios',
            render: s => {
              try { return JSON.parse(s).join(', ') } catch { return s }
            },
          },
          {
            title: '模型',
            dataIndex: 'models',
            render: m => {
              try { return JSON.parse(m).join(', ') } catch { return m }
            },
          },
          {
            title: '状态',
            dataIndex: 'status',
            width: 100,
            render: s => <Tag color={statusMap[s]?.color}>{statusMap[s]?.text}</Tag>,
          },
          {
            title: '进度',
            width: 120,
            render: (_, r) => (
              <Text>
                {r.progress || 0} / {r.total_queries || 0}
                {r.total_queries > 0 && ` (${Math.round((r.progress / r.total_queries) * 100)}%)`}
              </Text>
            ),
          },
          {
            title: '预估费用',
            dataIndex: 'cost_estimate',
            width: 100,
            render: v => v ? `¥${v}` : '-',
          },
          { title: '创建时间', dataIndex: 'created_at', width: 170 },
          {
            title: '操作',
            width: 100,
            render: (_, r) => (
              <Button
                size="small"
                icon={<EyeOutlined />}
                onClick={() => navigate(`/tasks/${r.id}`)}
              >
                查看
              </Button>
            ),
          },
        ]}
      />
    </div>
  )
}
