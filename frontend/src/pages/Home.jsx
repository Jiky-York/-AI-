import React, { useEffect, useState } from 'react'
import { Card, Row, Col, Statistic, Tag, Table, Button, Space, Typography } from 'antd'
import {
  ExperimentOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { getTasks, getScenarios, getModels } from '../services/api'

const { Text, Title } = Typography

const statusMap = {
  pending: { text: '待运行', color: 'default' },
  running: { text: '运行中', color: 'processing' },
  completed: { text: '已完成', color: 'success' },
  failed: { text: '失败', color: 'error' },
}

export default function Home() {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [scenarios, setScenarios] = useState({})
  const [models, setModels] = useState([])

  useEffect(() => {
    getTasks().then(d => setTasks(d.tasks || []))
    getScenarios().then(d => setScenarios(d.scenarios || {}))
    getModels().then(d => setModels(d.models || []))
  }, [])

  const completedCount = tasks.filter(t => t.status === 'completed').length
  const runningCount = tasks.filter(t => t.status === 'running').length
  const failedCount = tasks.filter(t => t.status === 'failed').length

  const recentTasks = tasks.slice(0, 5)

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/tasks/new')}>
          新建评测任务
        </Button>
      </Space>

      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic
              title="评测任务总数"
              value={tasks.length}
              prefix={<ExperimentOutlined style={{ color: '#1677ff' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已完成"
              value={completedCount}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="运行中"
              value={runningCount}
              valueStyle={{ color: '#1677ff' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="失败"
              value={failedCount}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card title="Benchmark 数据集">
            {Object.entries(scenarios).map(([name, info]) => (
              <Row key={name} style={{ marginBottom: 8 }}>
                <Col span={8}><Text strong>{name}</Text></Col>
                <Col span={16}>
                  <Text>{info.count} 条 · 学科: {info.subjects?.join('/')} · 难度: {info.difficulties?.join('/')}</Text>
                </Col>
              </Row>
            ))}
          </Card>
        </Col>
        <Col span={12}>
          <Card title="已配置模型">
            {models.length === 0 ? (
              <Text type="secondary">暂未配置模型 API Key，请在环境变量中配置</Text>
            ) : (
              models.map(m => (
                <Tag key={m.key} color={m.role === 'judge' ? 'purple' : 'blue'}>
                  {m.name} ({m.role === 'judge' ? '评委' : '被评'})
                </Tag>
              ))
            )}
          </Card>
        </Col>
      </Row>

      <Card title="最近评测任务" style={{ marginTop: 16 }}>
        <Table
          dataSource={recentTasks}
          rowKey="id"
          pagination={false}
          columns={[
            { title: 'ID', dataIndex: 'id', width: 60 },
            { title: '任务名称', dataIndex: 'task_name' },
            {
              title: '状态',
              dataIndex: 'status',
              width: 100,
              render: s => <Tag color={statusMap[s]?.color}>{statusMap[s]?.text}</Tag>,
            },
            {
              title: '进度',
              dataIndex: 'progress',
              width: 120,
              render: (_, r) => `${r.progress || 0}/${r.total_queries || 0}`,
            },
            {
              title: '操作',
              width: 100,
              render: (_, r) => (
                <Button size="small" onClick={() => navigate(`/tasks/${r.id}`)}>查看</Button>
              ),
            },
          ]}
        />
      </Card>
    </div>
  )
}
