import axios from 'axios'
import { useAuthStore } from '../stores/authStore'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      const authEndpoints = ['/auth/login', '/auth/register', '/auth/logout', '/auth/refresh']
      if (authEndpoints.some(ep => originalRequest.url?.includes(ep))) {
        return Promise.reject(error)
      }

      originalRequest._retry = true

      try {
        const response = await axios.post('/api/auth/refresh', {}, { withCredentials: true })
        const { accessToken } = response.data.data
        
        localStorage.setItem('accessToken', accessToken)
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        
        return api(originalRequest)
      } catch (refreshError) {
        localStorage.removeItem('accessToken')
        useAuthStore.setState({ user: null, isAuthenticated: false })
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default api
