import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card, Row, Col, Statistic, Tag, Progress, Table, Typography,
  Button, Space, Spin, message, Tabs, Descriptions, Empty,
} from 'antd'
import { ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { getTaskReport, getTaskProgress } from '../services/api'

const { Title, Text, Paragraph } = Typography

const statusMap = {
  pending: { text: '待运行', color: 'default' },
  running: { text: '运行中', color: 'processing' },
  completed: { text: '已完成', color: 'success' },
  failed: { text: '失败', color: 'error' },
}

const dimNameMap = {
  accuracy: '准确性',
  professionalism: '教育专业性',
  completeness: '结构完整性',
  format: '格式规范',
  safety: '安全性',
  latency: '响应时延',
  cost: '调用成本',
}

export default function Report() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [report, setReport] = useState(null)
  const [progress, setProgress] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadReport = () => {
    setLoading(true)
    getTaskReport(id)
      .then(d => setReport(d))
      .catch(() => message.error('加载报告失败'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadReport()
    const timer = setInterval(() => {
      getTaskProgress(id).then(p => {
        setProgress(p)
        if (p?.status === 'completed' || p?.status === 'failed') {
          loadReport()
          clearInterval(timer)
        }
      })
    }, 3000)
    return () => clearInterval(timer)
  }, [id])

  if (loading && !report) {
    return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>
  }

  if (!report) {
    return <Empty description="暂无报告数据" />
  }

  const { task, summary, model_summary, scenario_summary, difficulty_summary, details } = report
  const modelNames = Object.keys(model_summary || {})

  // 雷达图配置
  const radarOption = {
    title: { text: '各模型多维度能力雷达图', left: 'center' },
    tooltip: {},
    legend: { bottom: 0, data: modelNames },
    radar: {
      indicator: Object.keys(dimNameMap).map(k => ({
        name: dimNameMap[k],
        max: 5,
      })),
      radius: '65%',
    },
    series: [{
      type: 'radar',
      data: modelNames.map(name => ({
        name,
        value: Object.keys(dimNameMap).map(k => model_summary[name]?.scores?.[k] || 0),
      })),
    }],
  }

  // 加权总分柱状图
  const barOption = {
    title: { text: '各模型加权总分对比（满分 100）', left: 'center' },
    tooltip: {},
    xAxis: { type: 'category', data: modelNames },
    yAxis: { type: 'value', max: 100 },
    series: [{
      type: 'bar',
      data: modelNames.map(n => model_summary[n]?.weighted_score || 0),
      itemStyle: { color: '#1677ff' },
      label: { show: true, position: 'top' },
    }],
  }

  // 场景对比分组柱状图
  const scenarioNames = Object.keys(scenario_summary || {})
  const scenarioBarOption = {
    title: { text: '各场景模型得分对比', left: 'center' },
    tooltip: { trigger: 'axis' },
    legend: { bottom: 0, data: modelNames },
    xAxis: { type: 'category', data: scenarioNames },
    yAxis: { type: 'value', max: 100 },
    series: modelNames.map(name => ({
      name,
      type: 'bar',
      data: scenarioNames.map(s => scenario_summary[s]?.[name] || 0),
    })),
  }

  // 成本对比图
  const costOption = {
    title: { text: '各模型调用成本对比（元）', left: 'center' },
    tooltip: {},
    xAxis: { type: 'category', data: modelNames },
    yAxis: { type: 'value' },
    series: [{
      type: 'bar',
      data: modelNames.map(n => model_summary[n]?.total_cost || 0),
      itemStyle: { color: '#fa8c16' },
      label: { show: true, position: 'top', formatter: '{c} 元' },
    }],
  }

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/tasks')}>返回</Button>
        <Button icon={<ReloadOutlined />} onClick={loadReport}>刷新</Button>
        <Tag color={statusMap[task.status]?.color}>{statusMap[task.status]?.text}</Tag>
        {(task.status === 'running') && (
          <Progress
            percent={summary.total_queries ? Math.round((summary.total_evaluations / (summary.total_queries * modelNames.length)) * 100) : 0}
            size="small"
            style={{ width: 200 }}
          />
        )}
      </Space>

      <Descriptions column={3} bordered size="small" style={{ marginBottom: 16 }}>
        <Descriptions.Item label="任务名称">{task.name}</Descriptions.Item>
        <Descriptions.Item label="创建时间">{task.created_at}</Descriptions.Item>
        <Descriptions.Item label="完成时间">{task.finished_at || '-'}</Descriptions.Item>
      </Descriptions>

      {task.status === 'failed' && progress?.error_msg && (
        <Card type="inner" style={{ marginBottom: 16, background: '#fff2f0' }}>
          <Text type="danger">失败原因：{progress.error_msg}</Text>
        </Card>
      )}

      {task.status !== 'completed' && task.status !== 'failed' ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Spin size="large" />
          <Paragraph style={{ marginTop: 16 }}>评测进行中，请稍候...</Paragraph>
        </div>
      ) : (
        <>
          {/* 概览统计 */}
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <Card><Statistic title="评测 Query 数" value={summary.total_queries} /></Card>
            </Col>
            <Col span={6}>
              <Card><Statistic title="总评测次数" value={summary.total_evaluations} /></Card>
            </Col>
            <Col span={6}>
              <Card><Statistic title="平均加权分" value={summary.avg_weighted_score} precision={2} suffix="/100" /></Card>
            </Col>
            <Col span={6}>
              <Card><Statistic title="总费用" value={summary.total_cost} precision={4} prefix="¥" /></Card>
            </Col>
          </Row>

          <Tabs
            items={[
              {
                key: 'overview',
                label: '综合对比',
                children: (
                  <Row gutter={16}>
                    <Col span={12}>
                      <Card><ReactECharts option={radarOption} style={{ height: 400 }} /></Card>
                    </Col>
                    <Col span={12}>
                      <Card><ReactECharts option={barOption} style={{ height: 400 }} /></Card>
                    </Col>
                    <Col span={12} style={{ marginTop: 16 }}>
                      <Card><ReactECharts option={scenarioBarOption} style={{ height: 400 }} /></Card>
                    </Col>
                    <Col span={12} style={{ marginTop: 16 }}>
                      <Card><ReactECharts option={costOption} style={{ height: 400 }} /></Card>
                    </Col>
                  </Row>
                ),
              },
              {
                key: 'models',
                label: '模型明细',
                children: (
                  <Table
                    dataSource={modelNames.map(n => ({
                      key: n,
                      model: n,
                      ...model_summary[n]?.scores,
                      weighted: model_summary[n]?.weighted_score,
                      cost: model_summary[n]?.total_cost,
                      latency: model_summary[n]?.avg_latency_ms,
                      count: model_summary[n]?.sample_count,
                    }))}
                    columns={[
                      { title: '模型', dataIndex: 'model', fixed: 'left', width: 100 },
                      ...Object.keys(dimNameMap).map(k => ({
                        title: dimNameMap[k],
                        dataIndex: k,
                        width: 100,
                        render: v => v?.toFixed?.(2) || v,
                      })),
                      { title: '加权总分', dataIndex: 'weighted', width: 100, render: v => <Text strong>{v?.toFixed?.(2)}</Text> },
                      { title: '平均时延(ms)', dataIndex: 'latency', width: 110 },
                      { title: '总费用(元)', dataIndex: 'cost', width: 100, render: v => `¥${v}` },
                      { title: '样本数', dataIndex: 'count', width: 80 },
                    ]}
                    scroll={{ x: 1200 }}
                  />
                ),
              },
              {
                key: 'details',
                label: '逐条明细',
                children: (
                  <Table
                    dataSource={details}
                    rowKey="query_id"
                    pagination={{ pageSize: 5 }}
                    columns={[
                      { title: 'Query ID', dataIndex: 'query_id', width: 160 },
                      { title: '场景', dataIndex: 'scenario', width: 90 },
                      { title: '学科', dataIndex: 'subject', width: 70 },
                      { title: '难度', dataIndex: 'difficulty', width: 70 },
                      {
                        title: '参考答案',
                        dataIndex: 'reference_answer',
                        ellipsis: true,
                        render: t => <Text ellipsis style={{ maxWidth: 300 }}>{t}</Text>,
                      },
                      {
                        title: '各模型加权分',
                        render: (_, r) => (
                          <Space>
                            {r.outputs?.map(o => (
                              <Tag key={o.model} color="blue">{o.model}: {o.weighted_score?.toFixed(1)}</Tag>
                            ))}
                          </Space>
                        ),
                      },
                      {
                        title: '操作',
                        width: 80,
                        render: (_, r) => (
                          <a onClick={() => {
                            const text = r.outputs?.map(o => `【${o.model}】(分:${o.weighted_score?.toFixed(1)})\n${o.output}`).join('\n\n')
                            alert(`Query: ${r.query_id}\n参考答案: ${r.reference_answer}\n\n${text}`)
                          }}>查看</a>
                        ),
                      },
                    ]}
                  />
                ),
              },
            ]}
          />
        </>
      )}
    </div>
  )
}
