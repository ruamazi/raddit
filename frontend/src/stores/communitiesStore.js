import { create } from 'zustand'
import api from '../services/api'

export const useCommunitiesStore = create((set, get) => ({
  communities: [],
  currentCommunity: null,
  userCommunities: [],
  isLoading: false,
  error: null,

  fetchCommunities: async (params = {}) => {
    set({ isLoading: true, error: null })
    
    try {
      const response = await api.get('/communities', { params })
      set({ communities: response.data.data, isLoading: false })
      return response.data.data
    } catch (error) {
      set({ error: error.response?.data?.message || 'خطأ في جلب المجتمعات', isLoading: false })
      throw error
    }
  },

  fetchCommunity: async (name) => {
    set({ isLoading: true, error: null })
    
    try {
      const response = await api.get(`/communities/${name}`)
      set({ currentCommunity: response.data.data, isLoading: false })
      return response.data.data
    } catch (error) {
      set({ error: error.response?.data?.message || 'خطأ في جلب المجتمع', isLoading: false })
      throw error
    }
  },

  createCommunity: async (data) => {
    const response = await api.post('/communities', data)
    const newCommunity = response.data.data
    
    set((state) => ({
      communities: [...state.communities, newCommunity],
      userCommunities: [...state.userCommunities, newCommunity]
    }))
    
    return newCommunity
  },

  updateCommunity: async (name, data) => {
    const formData = new FormData()
    
    Object.keys(data).forEach((key) => {
      if (data[key] !== undefined) {
        if (typeof data[key] === 'object' && !(data[key] instanceof File)) {
          formData.append(key, JSON.stringify(data[key]))
        } else {
          formData.append(key, data[key])
        }
      }
    })
    
    const response = await api.put(`/communities/${name}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    
    const updatedCommunity = response.data.data
    
    set((state) => ({
      currentCommunity: updatedCommunity,
      communities: state.communities.map((c) => (c.name === name ? updatedCommunity : c))
    }))
    
    return updatedCommunity
  },

  joinCommunity: async (name) => {
    const response = await api.post(`/communities/${name}/join`)
    const { isMember, memberCount } = response.data.data
    
    set((state) => ({
      currentCommunity: state.currentCommunity
        ? { ...state.currentCommunity, community: { ...state.currentCommunity.community, memberCount }, isMember }
        : null
    }))
    
    return response.data.data
  },

  fetchUserCommunities: async () => {
    try {
      const response = await api.get('/users/communities')
      set({ userCommunities: response.data.data })
      return response.data.data
    } catch (error) {
      console.error('Fetch user communities error:', error)
      return []
    }
  },

  clearCurrentCommunity: () => set({ currentCommunity: null }),
}))
