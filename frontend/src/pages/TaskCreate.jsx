import React, { useEffect, useState } from 'react'
import {
  Form, Input, Select, InputNumber, Button, Card, Row, Col,
  Space, message, Alert, Slider, Typography, Divider,
} from 'antd'
import { useNavigate } from 'react-router-dom'
import { getModels, getScenarios, getDimensions, createTask } from '../services/api'

const { Text, Title } = Typography

export default function TaskCreate() {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [models, setModels] = useState([])
  const [scenarios, setScenarios] = useState({})
  const [dimensions, setDimensions] = useState([])
  const [weights, setWeights] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getModels().then(d => setModels(d.models || []))
    getScenarios().then(d => setScenarios(d.scenarios || {}))
    getDimensions().then(d => {
      setDimensions(d.dimensions || [])
      const w = {}
      d.dimensions.forEach(dim => { w[dim.key] = dim.weight })
      setWeights(w)
    })
  }, [])

  // 只显示被评模型（排除 judge）
  const evalModels = models.filter(m => m.role !== 'judge')
  const judgeModel = models.find(m => m.role === 'judge')

  const onFinish = async (values) => {
    setLoading(true)
    try {
      const weightsObj = {}
      dimensions.forEach(d => { weightsObj[d.key] = weights[d.key] })
      const res = await createTask({
        task_name: values.task_name,
        scenarios: values.scenarios,
        models: values.models,
        dimensions: dimensions.map(d => d.key),
        weights: weightsObj,
        concurrency: values.concurrency || 5,
      })
      message.success('评测任务创建成功，正在执行...')
      navigate(`/tasks/${res.task_id}`)
    } catch (e) {
      message.error(e.response?.data?.detail || '创建失败')
    } finally {
      setLoading(false)
    }
  }

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0)

  return (
    <div>
      {evalModels.length < 3 && (
        <Alert
          type="warning"
          message={`当前仅配置了 ${evalModels.length} 个被评模型，需至少 3 个。请配置环境变量：QWEN_API_KEY、KIMI_API_KEY、DEEPSEEK_API_KEY`}
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      {!judgeModel && (
        <Alert
          type="warning"
          message="评委模型（文心一言）未配置，请设置 ERNIE_API_KEY 和 ERNIE_SECRET_KEY 环境变量"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ concurrency: 5 }}
      >
        <Card title="基本信息">
          <Form.Item
            label="任务名称"
            name="task_name"
            rules={[{ required: true, message: '请输入任务名称' }]}
          >
            <Input placeholder="例如：教育场景评测-第一轮" />
          </Form.Item>
        </Card>

        <Card title="评测场景" style={{ marginTop: 16 }}>
          <Form.Item
            name="scenarios"
            rules={[{ required: true, message: '请选择评测场景' }]}
          >
            <Select
              mode="multiple"
              placeholder="选择评测场景"
              options={Object.entries(scenarios).map(([name, info]) => ({
                label: `${name}（${info.count} 条）`,
                value: name,
              }))}
            />
          </Form.Item>
        </Card>

        <Card title="评测模型" style={{ marginTop: 16 }}>
          <Form.Item
            name="models"
            rules={[{ required: true, message: '请选择被评模型' }]}
          >
            <Select
              mode="multiple"
              placeholder="选择被评模型（至少 3 个）"
              options={evalModels.map(m => ({ label: m.name, value: m.key }))}
            />
          </Form.Item>
          {judgeModel && (
            <Text type="secondary">评委模型：{judgeModel.name}（自动启用）</Text>
          )}
        </Card>

        <Card title="评测维度与权重" style={{ marginTop: 16 }}>
          <Text type="secondary">调整各维度权重（总和应为 100%）</Text>
          <div style={{ marginTop: 12 }}>
            {dimensions.map(d => (
              <Row key={d.key} align="middle" style={{ marginBottom: 12 }}>
                <Col span={6}><Text>{d.name}</Text></Col>
                <Col span={14}>
                  <Slider
                    min={0}
                    max={100}
                    value={Math.round((weights[d.key] || 0) * 100)}
                    onChange={v => setWeights({ ...weights, [d.key]: v / 100 })}
                  />
                </Col>
                <Col span={4}><Text strong>{Math.round((weights[d.key] || 0) * 100)}%</Text></Col>
              </Row>
            ))}
            <Divider style={{ margin: '8px 0' }} />
            <Row>
              <Col span={6}><Text strong>总计</Text></Col>
              <Col span={14} />
              <Col span={4}>
                <Text strong={totalWeight === 1} type={totalWeight === 1 ? 'success' : 'danger'}>
                  {Math.round(totalWeight * 100)}%
                </Text>
              </Col>
            </Row>
          </div>
        </Card>

        <Card title="执行参数" style={{ marginTop: 16 }}>
          <Form.Item label="并发数" name="concurrency">
            <InputNumber min={1} max={20} />
          </Form.Item>
        </Card>

        <Space style={{ marginTop: 16 }}>
          <Button type="primary" htmlType="submit" loading={loading}>
            创建并启动评测
          </Button>
          <Button onClick={() => navigate('/tasks')}>返回任务列表</Button>
        </Space>
      </Form>
    </div>
  )
}
