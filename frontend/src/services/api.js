import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

export const getModels = () => api.get('/models').then(r => r.data)
export const getScenarios = () => api.get('/scenarios').then(r => r.data)
export const getDimensions = () => api.get('/dimensions').then(r => r.data)
export const getBenchmark = (scenario, limit) =>
  api.get('/benchmark', { params: { scenario, limit } }).then(r => r.data)
export const getTasks = () => api.get('/tasks').then(r => r.data)
export const getTask = (id) => api.get(`/tasks/${id}`).then(r => r.data)
export const createTask = (data) => api.post('/tasks', data).then(r => r.data)
export const getTaskProgress = (id) => api.get(`/tasks/${id}/progress`).then(r => r.data)
export const getTaskReport = (id) => api.get(`/tasks/${id}/report`).then(r => r.data)

export default api
