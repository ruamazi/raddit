import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../services/api'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      
      login: async (email, password) => {
        const response = await api.post('/auth/login', { email, password })
        const { user, accessToken } = response.data.data
        
        localStorage.setItem('accessToken', accessToken)
        set({ user, isAuthenticated: true })
        
        return user
      },
      
      register: async (userData) => {
        const response = await api.post('/auth/register', userData)
        const { user, accessToken } = response.data.data
        
        localStorage.setItem('accessToken', accessToken)
        set({ user, isAuthenticated: true })
        
        return user
      },
      
      logout: async () => {
        try {
          await api.post('/auth/logout')
        } catch (error) {
          console.error('Logout error:', error)
        } finally {
          localStorage.removeItem('accessToken')
          set({ user: null, isAuthenticated: false })
        }
      },
      
      refreshUser: async () => {
        try {
          const response = await api.get('/auth/me')
          set({ user: response.data.data, isAuthenticated: true, isLoading: false })
        } catch (error) {
          localStorage.removeItem('accessToken')
          set({ user: null, isAuthenticated: false, isLoading: false })
        }
      },
      
      updateProfile: async (data) => {
        const response = await api.put('/users/profile', data)
        set({ user: response.data.data })
        return response.data.data
      },
      
      updatePreferences: async (preferences) => {
        const response = await api.put('/users/preferences', preferences)
        set({ user: response.data.data })
        return response.data.data
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
)
