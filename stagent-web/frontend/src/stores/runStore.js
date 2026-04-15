import { create } from 'zustand'
import { runApi } from '../api/client'
import wsClient from '../api/websocket'

export const useRunStore = create((set, get) => ({
  taskId: null,
  status: 'idle', // idle, running, completed, stopped
  progress: 0,
  total: 0,
  passed: 0,
  failed: 0,
  errors: 0,
  results: [],
  logs: [],
  reportId: null,
  error: null,

  // 监听事件
  setupListeners: () => {
    wsClient.on('status', (data) => {
      set({
        status: data.status,
        progress: data.progress,
        total: data.total,
        passed: data.passed,
        failed: data.failed,
        errors: data.errors
      })
    })

    wsClient.on('log', (data) => {
      set(state => ({
        logs: [...state.logs, { ...data, timestamp: new Date().toISOString() }]
      }))
    })

    wsClient.on('progress', (data) => {
      set({
        progress: data.progress,
        total: data.total,
        passed: data.passed,
        failed: data.failed
      })
    })

    wsClient.on('result', (data) => {
      set(state => ({
        results: [...state.results, data]
      }))
    })

    wsClient.on('completed', (data) => {
      set({
        status: 'completed',
        reportId: data.report_id
      })
    })

    wsClient.on('disconnected', () => {
      if (get().status === 'running') {
        set({ status: 'idle' })
      }
    })
  },

  // 开始运行
  startRun: async (projectId) => {
    set({
      taskId: null,
      status: 'pending',
      progress: 0,
      total: 0,
      passed: 0,
      failed: 0,
      errors: 0,
      results: [],
      logs: [],
      reportId: null,
      error: null
    })

    try {
      const result = await runApi.start(projectId)
      set({ taskId: result.task_id })

      // 连接 WebSocket
      wsClient.connect(result.task_id)

      // 设置监听
      get().setupListeners()

      set({ status: 'running' })
      return result
    } catch (error) {
      set({ error: error.message, status: 'idle' })
      return null
    }
  },

  // 停止运行
  stopRun: async () => {
    const { taskId } = get()
    if (!taskId) return

    try {
      await runApi.stop(taskId)
      set({ status: 'stopped' })
      wsClient.disconnect()
    } catch (error) {
      set({ error: error.message })
    }
  },

  // 获取状态
  fetchStatus: async () => {
    const { taskId } = get()
    if (!taskId) return

    try {
      const status = await runApi.status(taskId)
      set({
        status: status.status,
        progress: status.progress,
        total: status.total,
        passed: status.passed,
        failed: status.failed,
        errors: status.errors
      })
    } catch (error) {
      set({ error: error.message })
    }
  },

  // 重置状态
  reset: () => {
    wsClient.disconnect()
    set({
      taskId: null,
      status: 'idle',
      progress: 0,
      total: 0,
      passed: 0,
      failed: 0,
      errors: 0,
      results: [],
      logs: [],
      reportId: null,
      error: null
    })
  }
}))
