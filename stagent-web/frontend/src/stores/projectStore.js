import { create } from 'zustand'
import { exampleApi, projectApi } from '../api/client'

export const useProjectStore = create((set, get) => ({
  projects: [],
  currentProject: null,
  reportHistory: [],
  examples: [],
  inputPreview: null,
  loading: false,
  error: null,

  // 获取项目列表
  fetchProjects: async () => {
    set({ loading: true, error: null })
    try {
      const projects = await projectApi.list()
      set({ projects, loading: false })
    } catch (error) {
      set({ error: error.message, loading: false })
    }
  },

  // 获取单个项目
  fetchProject: async (id) => {
    set({ loading: true, error: null })
    try {
      const project = await projectApi.get(id)
      set({ currentProject: project, loading: false })
      return project
    } catch (error) {
      set({ error: error.message, loading: false })
      return null
    }
  },

  // 创建项目
  createProject: async (data) => {
    set({ loading: true, error: null })
    try {
      const project = await projectApi.create(data)
      set(state => ({
        projects: [...state.projects, project],
        currentProject: project,
        loading: false
      }))
      return project
    } catch (error) {
      set({ error: error.message, loading: false })
      return null
    }
  },

  // 更新项目
  updateProject: async (id, data) => {
    set({ loading: true, error: null })
    try {
      const project = await projectApi.update(id, data)
      set(state => ({
        projects: state.projects.map(p => p.id === id ? project : p),
        currentProject: project,
        loading: false
      }))
      return project
    } catch (error) {
      set({ error: error.message, loading: false })
      return null
    }
  },

  // 删除项目
  deleteProject: async (id) => {
    set({ loading: true, error: null })
    try {
      await projectApi.delete(id)
      set(state => ({
        projects: state.projects.filter(p => p.id !== id),
        currentProject: state.currentProject?.id === id ? null : state.currentProject,
        loading: false
      }))
      return true
    } catch (error) {
      set({ error: error.message, loading: false })
      return false
    }
  },

  fetchReportHistory: async (id) => {
    try {
      const reportHistory = await projectApi.reports(id)
      set({ reportHistory })
      return reportHistory
    } catch (error) {
      set({ error: error.message, reportHistory: [] })
      return []
    }
  },

  previewInputs: async (id, count = 5) => {
    try {
      const inputPreview = await projectApi.previewInputs(id, count)
      set({ inputPreview })
      return inputPreview
    } catch (error) {
      set({ error: error.response?.data?.detail || error.message, inputPreview: null })
      return null
    }
  },

  fetchExamples: async () => {
    try {
      const examples = await exampleApi.list()
      set({ examples })
      return examples
    } catch (error) {
      set({ error: error.message, examples: [] })
      return []
    }
  },

  importExample: async (exampleId) => {
    set({ loading: true, error: null })
    try {
      const project = await exampleApi.import(exampleId)
      set(state => ({
        projects: [...state.projects, project],
        currentProject: project,
        loading: false
      }))
      return project
    } catch (error) {
      set({ error: error.response?.data?.detail || error.message, loading: false })
      return null
    }
  },

  // 清空当前项目
  clearCurrentProject: () => set({ currentProject: null })
}))
