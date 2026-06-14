import React, { useState } from 'react'
import { 
  MessageCircle, 
  Send,
  Loader2,
  Sparkles,
  User,
  Bot,
  ThumbsUp,
  Copy
} from 'lucide-react'

const initialMessages = [
  {
    id: 1,
    role: 'bot',
    content: '您好！我是项目管理与经营分析AI助手。我可以帮助您：\n\n• 查询项目风险状态\n• 了解项目详细信息\n• 获取风险预警建议\n• 解答项目管理问题\n\n请告诉我您想了解什么？',
    timestamp: new Date(Date.now() - 60000)
  }
]

const quickQuestions = [
  'P002项目的风险是什么？',
  '哪些项目需要优先处理？',
  '如何降低项目成本超支风险？',
  '生成P005的诊断报告'
]

function AIChat() {
  const [messages, setMessages] = useState(initialMessages)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    // 模拟AI响应
    await new Promise(resolve => setTimeout(resolve, 1500))

    const responses = {
      'P002项目的风险是什么？': `根据数据分析，P002项目存在以下风险：

**成本风险** 🔴
- 成本使用率已达110.7%（超预算31万元）
- 已发生成本31万，预算仅28万

**质量风险** 🟡
- 质量问题数：5个（超过阈值3）
- 客户满意度：3.1（低于阈值3.8）

**进度风险** 🟡
- 周期使用率：93.3%（剩余3天）
- 计划周期45天，已用42天

**验收风险** 🔴
- 验收风险等级：高

**建议：** 需要立即进行人工复核，确认成本超支原因。`,
      
      '哪些项目需要优先处理？': `根据综合风险评估，建议优先处理以下项目：

**1. P002（最高优先级）**
风险项：成本+周期+质量+验收（共4项）
关键问题：成本超支111%，满意度仅3.1

**2. P005（高优先级）**
风险项：周期+质量+验收（共3项）
关键问题：周期使用率93%，质量问题4个

**3. P006（中优先级）**
风险项：周期+质量+验收（共3项）
关键问题：周期使用率97.5%，材料版本冲突

**优先级计算方法：**
• 成本使用率 >90% → 成本风险
• 周期使用率 >90% → 进度风险
• 质量问题≥3 或 满意度<3.8 → 质量风险
• 风险项越多，优先级越高`,

      '如何降低项目成本超支风险？': `基于历史案例和最佳实践，建议以下措施：

**1. 事前预防**
• 建立项目预算预警机制（阈值90%）
• 定期（如每周）监控成本使用情况
• 及时识别偏差并调整计划

**2. 事中控制**
• 成本超预警值时自动提醒项目经理
• 变更请求需要审批流程
• 记录实际成本与预算差异原因

**3. 事后复盘**
• 项目结束后进行成本分析
• 总结超支原因和经验教训
• 更新成本估算模型

**参考资料：**
• 历史案例C01：项目台账字段统一
• 历史案例C04：资料清单标准化
• 复盘案例R04：成本异常预警`,

      '生成P005的诊断报告': `正在为您生成P005项目的诊断报告...

**项目基本信息**
- 项目编号：P005
- 项目名称：智慧园区平台实施
- 客户类型：科技服务
- 当前阶段：执行中

**风险分析**
- 成本使用率：89.1%（接近90%阈值）
- 周期使用率：93.3%（剩余5天）
- 质量问题数：4个
- 客户满意度：3.4

**客户反馈**
关键节点延期，客户要求解释成本变化

**建议行动**
1. 尽快确认延期原因（内部/客户）
2. 分析成本变化的具体原因
3. 与客户沟通调整验收计划
4. 准备应对方案

如需完整报告，请前往"月报生成"页面生成详细文档。`
    }

    const botMessage = {
      id: Date.now() + 1,
      role: 'bot',
      content: responses[input] || '抱歉，我暂时无法回答这个问题。请尝试其他问题，或前往相关页面查看详细信息。',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, botMessage])
    setLoading(false)
  }

  const handleQuickQuestion = (question) => {
    setInput(question)
    handleSend()
  }

  const handleCopy = (content) => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">AI对话</h1>
        <p className="text-text-secondary">与AI助手对话，查询项目信息，获取智能建议</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Area */}
        <div className="lg:col-span-2 card flex flex-col" style={{ height: '600px' }}>
          <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4">
            {messages.map((msg) => (
              <div 
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.role === 'user' ? 'bg-primary' : 'bg-surface-2'
                }`}>
                  {msg.role === 'user' ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-primary" />
                  )}
                </div>
                <div className={`max-w-[80%] ${msg.role === 'user' ? 'text-right' : ''}`}>
                  <div className={`inline-block p-4 rounded-lg ${
                    msg.role === 'user' 
                      ? 'bg-primary text-white' 
                      : 'bg-surface-2'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-text-secondary">
                    <span>{msg.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
                    {msg.role === 'bot' && (
                      <button 
                        onClick={() => handleCopy(msg.content)}
                        className="hover:text-primary flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        {copied ? '已复制' : '复制'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div className="bg-surface-2 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm text-text-secondary">AI正在思考...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-border pt-4">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="输入您的问题..."
                className="input flex-1"
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="btn btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                发送
              </button>
            </div>
          </div>
        </div>

        {/* Quick Questions */}
        <div className="card">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            快捷问题
          </h2>
          <div className="space-y-3">
            {quickQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleQuickQuestion(question)}
                className="w-full text-left p-4 rounded-lg bg-surface-2 hover:bg-border transition-colors flex items-start gap-3"
              >
                <MessageCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm">{question}</span>
              </button>
            ))}
          </div>

          <div className="mt-6 p-4 rounded-lg bg-surface-2">
            <h3 className="font-medium mb-2 flex items-center gap-2">
              <ThumbsUp className="w-4 h-4 text-success" />
              提示
            </h3>
            <p className="text-sm text-text-secondary">
              您可以询问项目风险、优先级排序、改进建议等问题。AI会基于项目数据给出专业分析。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AIChat
