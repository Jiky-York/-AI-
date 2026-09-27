// MOCK 数据层 - 纯静态部署时使用，数据来自真实评测任务
export const mockModels = {
  models: [
    { key: 'qwen', name: '通义千问', vendor: '阿里', model: 'qwen-turbo', role: 'eval' },
    { key: 'kimi', name: 'Kimi', vendor: 'Moonshot', model: 'kimi-k3', role: 'eval' },
    { key: 'deepseek', name: 'DeepSeek', vendor: 'DeepSeek', model: 'deepseek-chat', role: 'eval' },
    { key: 'ernie', name: '文心一言', vendor: '百度', model: 'ernie-4.5-turbo-128k', role: 'judge' },
  ],
}

export const mockScenarios = {
  scenarios: {
    '作业批改': { count: 42, subjects: ['数学', '语文', '英语'], difficulties: ['简单', '中等', '困难'] },
    '课件生成': { count: 42, subjects: ['数学', '语文', '英语'], difficulties: ['简单', '中等', '困难'] },
    '教案写作': { count: 42, subjects: ['数学', '语文', '英语'], difficulties: ['简单', '中等', '困难'] },
  },
}

export const mockDimensions = {
  dimensions: [
    { key: 'accuracy', name: '准确性', weight: 0.30 },
    { key: 'professionalism', name: '教育专业性', weight: 0.20 },
    { key: 'completeness', name: '结构完整性', weight: 0.20 },
    { key: 'format', name: '格式规范', weight: 0.10 },
    { key: 'safety', name: '安全性', weight: 0.10 },
    { key: 'latency', name: '响应时延', weight: 0.05 },
    { key: 'cost', name: '调用成本', weight: 0.05 },
  ],
}

export const mockTasks = {
  tasks: [
    {
      id: 17,
      task_name: '最终版评测-三场景完整',
      scenarios: '["作业批改", "课件生成", "教案写作"]',
      models: '["qwen", "kimi", "deepseek"]',
      status: 'completed',
      total_queries: 24,
      progress: 72,
      cost_estimate: 0.1345,
      created_at: '2026-09-27 15:14:11',
      finished_at: '2026-09-27 15:32:48',
    },
  ],
}

export const mockTask = {
  id: 17,
  task_name: '最终版评测-三场景完整',
  scenarios: '["作业批改", "课件生成", "教案写作"]',
  models: '["qwen", "kimi", "deepseek"]',
  dimensions: '["accuracy", "professionalism", "completeness", "format", "safety", "latency", "cost"]',
  weights: '{"accuracy": 0.3, "professionalism": 0.2, "completeness": 0.2, "format": 0.1, "safety": 0.1, "latency": 0.05, "cost": 0.05}',
  concurrency: 5,
  status: 'completed',
  total_queries: 24,
  progress: 72,
  cost_estimate: 0.1345,
  created_at: '2026-09-27 15:14:11',
  finished_at: '2026-09-27 15:32:48',
  error_msg: null,
}

export const mockProgress = {
  id: 17,
  name: '最终版评测-三场景完整',
  status: 'completed',
  progress: 72,
  total: 72,
  cost_estimate: 0.1345,
  error_msg: null,
}

export const mockReport = {
  task: {
    id: 17,
    name: '最终版评测-三场景完整',
    status: 'completed',
    created_at: '2026-09-27 15:14:11',
    finished_at: '2026-09-27 15:32:48',
  },
  summary: {
    total_queries: 24,
    total_evaluations: 72,
    avg_weighted_score: 83.12,
    total_cost: 0.1345,
    avg_latency_ms: 19009,
    dimensions: ['准确性', '教育专业性', '结构完整性', '格式规范', '安全性', '响应时延', '调用成本'],
  },
  model_summary: {
    DeepSeek: {
      scores: { accuracy: 4.38, professionalism: 5.0, completeness: 5.0, format: 5.0, safety: 5.0, latency: 3.42, cost: 4.33 },
      weighted_score: 92.50,
      total_cost: 0.0319,
      avg_latency_ms: 6378,
      sample_count: 24,
    },
    Kimi: {
      scores: { accuracy: 3.46, professionalism: 3.83, completeness: 3.79, format: 3.83, safety: 4.83, latency: 1.25, cost: 4.08 },
      weighted_score: 67.40,
      total_cost: 0.0617,
      avg_latency_ms: 44647,
      sample_count: 24,
    },
    通义千问: {
      scores: { accuracy: 4.17, professionalism: 4.88, completeness: 4.88, format: 4.88, safety: 5.0, latency: 3.5, cost: 4.33 },
      weighted_score: 89.48,
      total_cost: 0.0410,
      avg_latency_ms: 6000,
      sample_count: 24,
    },
  },
  scenario_summary: {
    '作业批改': { DeepSeek: 99.22, Kimi: 94.22, 通义千问: 96.09 },
    '课件生成': { DeepSeek: 89.53, Kimi: 40.94, 通义千问: 86.56 },
    '教案写作': { DeepSeek: 88.75, Kimi: 67.03, 通义千问: 85.78 },
  },
  difficulty_summary: {
    '简单': { DeepSeek: 93.25, Kimi: 74.31, 通义千问: 89.62 },
    '中等': { DeepSeek: 88.75, Kimi: 32.81, 通义千问: 88.75 },
    '困难': { DeepSeek: 93.75, Kimi: 10.0, 通义千问: 93.75 },
  },
  details: [
    {
      query_id: 'hw-math-001',
      scenario: '作业批改',
      subject: '数学',
      difficulty: '简单',
      reference_answer: 'x = 5',
      outputs: [
        { model: '通义千问', output: '解方程 2x+3=13，移项得 2x=10，所以 x=5。答案正确。', scores: { accuracy: 5, professionalism: 5, completeness: 5, format: 5, safety: 5, latency: 4, cost: 4 }, weighted_score: 95, latency_ms: 5500, cost: 0.0015 },
        { model: 'Kimi', output: '由 2x+3=13，得 x=5。', scores: { accuracy: 5, professionalism: 4, completeness: 4, format: 4, safety: 5, latency: 1, cost: 5 }, weighted_score: 88, latency_ms: 30000, cost: 0.001 },
        { model: 'DeepSeek', output: '解：2x + 3 = 13\n2x = 13 - 3 = 10\nx = 10 ÷ 2 = 5\n答：x = 5', scores: { accuracy: 5, professionalism: 5, completeness: 5, format: 5, safety: 5, latency: 4, cost: 4 }, weighted_score: 98, latency_ms: 6000, cost: 0.0012 },
      ],
    },
  ],
}

export const mockBenchmark = {
  total: 3,
  queries: [
    { id: 'hw-math-001', scenario: '作业批改', subject: '数学', difficulty: '简单', query: '批改：解方程 2x+3=13', reference_answer: 'x=5' },
    { id: 'cw-yuwen-001', scenario: '课件生成', subject: '语文', difficulty: '中等', query: '生成《静夜思》课件', reference_answer: '' },
    { id: 'jp-english-001', scenario: '教案写作', subject: '英语', difficulty: '困难', query: '编写一般过去时教案', reference_answer: '' },
  ],
}
