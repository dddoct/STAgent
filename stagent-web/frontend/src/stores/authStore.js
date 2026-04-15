// 认证状态管理
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi } from '../api/client'

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isGuest: false,

      login: async (username, password) => {
        const data = await authApi.login(username, password)
        set({
          user: data.user,
          token: data.access_token,
          isAuthenticated: true,
          isGuest: false,
        })
        return data
      },

      register: async (username, email, password) => {
        return authApi.register(username, email, password)
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isGuest: false,
        })
      },

      enterGuest: () => {
        set({
          user: { username: '游客' },
          token: null,
          isAuthenticated: true,
          isGuest: true,
        })
      },
    }),
    {
      name: 'stagent-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        isGuest: state.isGuest,
      }),
    }
  )
)
