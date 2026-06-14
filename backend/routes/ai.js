import express from 'express'

const router = express.Router()

// OpenAI API 配置（需要设置 OPENAI_API_KEY 环境变量）
// import OpenAI from 'openai'
// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY
// })

// 模拟AI响应
const mockResponses = {
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
关键问题：周期使用率97.5%，材料版本冲突`,
  
  'default': '抱歉，我暂时无法回答这个问题。请尝试其他问题，或前往相关页面查看详细信息。'
}

// POST /api/ai/chat - AI对话
router.post('/chat', async (req, res) => {
  const { message, context } = req.body
  
  if (!message) {
    return res.status(400).json({ error: '消息不能为空' })
  }

  // 如果配置了OpenAI API Key，使用真实AI
  if (process.env.OPENAI_API_KEY) {
    try {
      // const completion = await openai.chat.completions.create({
      //   model: "gpt-4",
      //   messages: [
      //     { role: "system", content: "你是项目管理与经营分析AI助手，专注于项目风险识别和诊断报告生成。" },
      //     { role: "user", content: message }
      //   ]
      // })
      
      // res.json({ 
      //   response: completion.choices[0].message.content,
      //   model: 'gpt-4'
      // })
      
      // 临时使用模拟响应
      const response = mockResponses[message] || mockResponses['default']
      res.json({ response, model: 'mock' })
      
    } catch (error) {
      console.error('OpenAI API Error:', error)
      res.status(500).json({ error: 'AI服务调用失败' })
    }
  } else {
    // 使用模拟响应
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const response = mockResponses[message] || mockResponses['default']
    res.json({ 
      response,
      model: 'mock',
      note: '使用演示模式，请设置OPENAI_API_KEY启用真实AI'
    })
  }
})

// POST /api/ai/analyze - AI分析项目
router.post('/analyze', async (req, res) => {
  const { projectId } = req.body
  
  if (!projectId) {
    return res.status(400).json({ error: '项目ID不能为空' })
  }

  // 模拟AI分析
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  const analysis = {
    projectId,
    riskLevel: projectId === 'P002' ? 'critical' : projectId === 'P005' ? 'high' : 'medium',
    recommendations: [
      '建立成本预警机制',
      '定期监控项目进度',
      '加强质量管理',
      '完善客户沟通'
    ],
    summary: `已完成对${projectId}项目的AI风险分析`
  }
  
  res.json(analysis)
})

export default router
