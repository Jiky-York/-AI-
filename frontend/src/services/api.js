import axios from 'axios'
import {
  mockModels, mockScenarios, mockDimensions, mockTasks,
  mockTask, mockProgress, mockReport, mockBenchmark,
} from './mock'

// VITE_MOCK=true 时纯前端运行，无需后端
const USE_MOCK = import.meta.env.VITE_MOCK === 'true'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

const mockDelay = (data) => new Promise(resolve => setTimeout(() => resolve(data), 300))

export const getModels = () =>
  USE_MOCK ? mockDelay(mockModels) : api.get('/models').then(r => r.data).catch(() => mockModels)

export const getScenarios = () =>
  USE_MOCK ? mockDelay(mockScenarios) : api.get('/scenarios').then(r => r.data).catch(() => mockScenarios)

export const getDimensions = () =>
  USE_MOCK ? mockDelay(mockDimensions) : api.get('/dimensions').then(r => r.data).catch(() => mockDimensions)

export const getBenchmark = (scenario, limit) =>
  USE_MOCK ? mockDelay(mockBenchmark) : api.get('/benchmark', { params: { scenario, limit } }).then(r => r.data).catch(() => mockBenchmark)

export const getTasks = () =>
  USE_MOCK ? mockDelay(mockTasks) : api.get('/tasks').then(r => r.data).catch(() => mockTasks)

export const getTask = (id) =>
  USE_MOCK ? mockDelay(mockTask) : api.get(`/tasks/${id}`).then(r => r.data).catch(() => mockTask)

export const createTask = (data) =>
  USE_MOCK ? mockDelay({ task_id: 17, status: 'running' }) : api.post('/tasks', data).then(r => r.data)

export const getTaskProgress = (id) =>
  USE_MOCK ? mockDelay(mockProgress) : api.get(`/tasks/${id}/progress`).then(r => r.data).catch(() => mockProgress)

export const getTaskReport = (id) =>
  USE_MOCK ? mockDelay(mockReport) : api.get(`/tasks/${id}/report`).then(r => r.data).catch(() => mockReport)

export default api
