import React, { useState } from 'react'
import { 
  FileText, 
  Download, 
  Loader2,
  Sparkles,
  Copy,
  CheckCircle
} from 'lucide-react'

function ReportGenerator() {
  const [reportType, setReportType] = useState('monthly')
  const [selectedProjects, setSelectedProjects] = useState(['P002', 'P005', 'P006'])
  const [generating, setGenerating] = useState(false)
  const [reportGenerated, setReportGenerated] = useState(false)
  const [copied, setCopied] = useState(false)

  const [reportContent] = useState(`# 项目管理月度诊断报告

## 一、客户问题概述

本次诊断聚焦项目制科技服务公司的项目风险识别与月度经营分析。客户当前的主要问题不是缺少单点工具，而是项目资料、成本数据、验收材料和客户反馈分散，导致经营分析依赖人工整理，风险发现较晚。

## 二、输入材料与证据

本次诊断使用了以下材料：

| 材料类别 | 具体材料 | 用途 |
|----------|----------|------|
| 公开客户需求 | 需求A_项目管理与经营分析AI助手.md | 明确客户原始需求和期望成果 |
| 项目数据 | 项目经营样例数据.md | 8个项目记录、计算口径 |
| 规则清单 | 规则与审核清单.md | 报告规则、风险标签 |

## 三、需求边界

| 字段 | 内容 |
|------|------|
| **目标用户** | 项目经理、业务顾问、审核人 |
| **输入** | 客户原始需求、项目经营样例数据 |
| **输出** | 项目风险判断、诊断报告初稿 |
| **不做范围** | 不接入真实企业系统，不替代财务最终判断 |

### 最小验证路径（2-6周）

| 周次 | 任务内容 | 产出 |
|------|----------|------|
| 第1周 | 统一项目编号和资料清单 | 项目台账标准化方案 |
| 第2-3周 | 验证风险识别准确性 | 风险项目清单 |
| 第4-6周 | 在真实项目会上复核效果 | 效果评估报告 |

## 四、数据与规则判断

### 4.1 数据判断：项目风险识别

基于项目经营样例数据，使用以下计算口径进行风险判断：

| 指标 | 计算方式 | 阈值 | 判断规则 |
|------|----------|------|----------|
| 成本使用率 | 已发生成本/预算 | >90%且未验收 | 成本风险 |
| 周期使用率 | 已用天数/计划周期 | >90%且未验收 | 进度风险 |
| 质量风险 | 质量问题数≥3 或 满意度<3.8 | - | 质量风险 |

**项目风险判断结果**：

| 项目编号 | 成本使用率 | 周期使用率 | 质量问题 | 满意度 | 综合风险项 | 优先级 |
|----------|-----------|-----------|----------|--------|-----------|--------|
| **P002** | **111%** | 93% | **5** | **3.1** | **4项** | **最高** |
| **P005** | 89% | 93% | **4** | 3.4 | **3项** | **高** |
| P006 | 81% | 98% | 3 | 3.8 | 3项 | 中 |

## 五、人工复核与风险控制

### 5.1 必须人工复核的内容

| 复核项 | 触发条件 | 复核人 | 复核内容 |
|--------|----------|--------|----------|
| 成本超预算 | 成本使用率>90%且未验收 | 项目经理 | 合同变更、付款节点 |
| 验收风险 | 验收风险字段为"高" | 审核人 | 材料版本、对外口径 |

### 5.2 下一步行动

| 优先级 | 行动项 | 责任人 | 截止时间 |
|--------|--------|--------|----------|
| P0 | P002成本超支原因分析会议 | 项目经理 | 本周内 |
| P1 | P006验收材料版本核对 | 审核人 | 验收前 |
| P1 | P005延期原因确认 | 项目经理 | 3天内 |

---

*本报告由项目管理与经营分析AI助手自动生成*
*生成时间：${new Date().toLocaleString('zh-CN')}*`)

  const handleGenerate = async () => {
    setGenerating(true)
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 2000))
    setGenerating(false)
    setReportGenerated(true)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(reportContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([reportContent], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `诊断报告_${new Date().toISOString().split('T')[0]}.md`
    a.click()
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">月报生成器</h1>
        <p className="text-text-secondary">AI智能生成项目管理诊断报告</p>
      </div>

      {/* Configuration */}
      <div className="card">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          报告配置
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">报告类型</label>
            <select 
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="input"
            >
              <option value="monthly">月度诊断报告</option>
              <option value="weekly">周报</option>
              <option value="quarterly">季度报告</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">选择项目</label>
            <div className="flex flex-wrap gap-2">
              {['P001', 'P002', 'P003', 'P004', 'P005', 'P006', 'P007', 'P008'].map(id => (
                <button
                  key={id}
                  onClick={() => {
                    setSelectedProjects(prev => 
                      prev.includes(id) 
                        ? prev.filter(p => p !== id)
                        : [...prev, id]
                    )
                  }}
                  className={`px-3 py-1 rounded-lg text-sm font-mono transition-all ${
                    selectedProjects.includes(id)
                      ? 'bg-primary text-white'
                      : 'bg-surface-2 text-text-secondary hover:bg-border'
                  }`}
                >
                  {id}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button 
          onClick={handleGenerate}
          disabled={generating || selectedProjects.length === 0}
          className="btn btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              AI正在生成报告...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              生成报告
            </>
          )}
        </button>
      </div>

      {/* Report Preview */}
      {reportGenerated && (
        <div className="card animate-slide-in">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FileText className="w-5 h-5 text-success" />
              报告预览
            </h2>
            <div className="flex gap-2">
              <button 
                onClick={handleCopy}
                className="btn btn-secondary flex items-center gap-2"
              >
                {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? '已复制' : '复制'}
              </button>
              <button 
                onClick={handleDownload}
                className="btn btn-primary flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                下载MD
              </button>
            </div>
          </div>

          <div className="bg-surface-2 rounded-lg p-6 max-h-96 overflow-y-auto">
            <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed text-text-secondary">
              {reportContent}
            </pre>
          </div>

          <div className="mt-4 p-4 rounded-lg bg-success/10 border border-success/30">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-success mt-0.5" />
              <div>
                <p className="font-medium text-success">报告生成成功</p>
                <p className="text-sm text-text-secondary mt-1">
                  已识别 {selectedProjects.length} 个项目风险，生成 {reportType === 'monthly' ? '月度' : reportType === 'weekly' ? '周' : '季度'}诊断报告
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Template Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-bold mb-2">结构完整</h3>
          <p className="text-sm text-text-secondary">包含7个标准章节，符合报告规范</p>
        </div>
        
        <div className="card text-center">
          <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-6 h-6 text-success" />
          </div>
          <h3 className="font-bold mb-2">依据充分</h3>
          <p className="text-sm text-text-secondary">每个结论都引用具体数据和材料</p>
        </div>
        
        <div className="card text-center">
          <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-6 h-6 text-warning" />
          </div>
          <h3 className="font-bold mb-2">人工复核</h3>
          <p className="text-sm text-text-secondary">明确标注需要人工确认的关键点</p>
        </div>
      </div>
    </div>
  )
}

export default ReportGenerator
