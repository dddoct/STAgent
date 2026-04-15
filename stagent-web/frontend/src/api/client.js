import axios from 'axios'
import { useAuthStore } from '../stores/authStore'

const API_BASE = '/api'

const client = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器 - 添加认证 Token
client.interceptors.request.use(
  config => {
    // 从 Zustand store 获取 token
    const token = useAuthStore.getState()?.token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

// 响应拦截器
client.interceptors.response.use(
  response => response.data,
  error => {
    const message = error.response?.data?.detail || error.message
    console.error('API Error:', message)

    // 401 未授权，跳转登录
    if (error.response?.status === 401) {
      const { logout } = useAuthStore.getState()
      logout()
      window.location.href = '/login'
    }

    return Promise.reject(error)
  }
)

// ============== 认证 API ==============

export const authApi = {
  login: (username, password) =>
    client.post('/auth/login', { username, password }),

  register: (username, email, password) =>
    client.post('/auth/register', { username, email, password }),

  me: () => client.get('/auth/me'),

  logout: () => client.post('/auth/logout')
}

// ============== 项目 API ==============

export const projectApi = {
  list: () => client.get('/projects'),

  get: (id) => client.get(`/projects/${id}`),

  create: (data) => client.post('/projects', data),

  update: (id, data) => client.put(`/projects/${id}`, data),

  delete: (id) => client.delete(`/projects/${id}`)
}

// ============== 测试运行 API ==============

export const runApi = {
  start: (projectId, configOverrides = null) =>
    client.post('/run', { project_id: projectId, config_overrides: configOverrides }),

  status: (taskId) => client.get(`/run/${taskId}`),

  stop: (taskId) => client.post(`/run/${taskId}/stop`),

  results: (taskId) => client.get(`/run/${taskId}/results`)
}

// ============== 报告 API ==============

export const reportApi = {
  get: (reportId) => client.get(`/reports/${reportId}`),

  getByTask: (taskId) => client.get(`/reports/task/${taskId}`)
}

// ============== 覆盖率 API ==============

export const coverageApi = {
  get: (reportId) => client.get(`/coverage/${reportId}`)
}

// ============== 文件上传 API ==============

export const uploadApi = {
  source: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return axios.post(`${API_BASE}/upload/source`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(res => res.data)
  },

  binary: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return axios.post(`${API_BASE}/upload/binary`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(res => res.data)
  }
}

export default client
