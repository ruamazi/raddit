import { create } from 'zustand'
import api from '../services/api'

export const useMessagesStore = create((set, get) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  isLoading: false,
  error: null,

  fetchConversations: async () => {
    set({ isLoading: true, error: null })
    
    try {
      const response = await api.get('/messages/conversations')
      set({ conversations: response.data.data, isLoading: false })
      return response.data.data
    } catch (error) {
      set({ error: error.response?.data?.message || 'خطأ في جلب المحادثات', isLoading: false })
      throw error
    }
  },

  fetchMessages: async (userId) => {
    set({ isLoading: true, error: null })
    
    try {
      const response = await api.get(`/messages/${userId}`)
      set({
        messages: response.data.data.messages,
        currentConversation: response.data.data.otherUser,
        isLoading: false
      })
      return response.data.data
    } catch (error) {
      set({ error: error.response?.data?.message || 'خطأ في جلب الرسائل', isLoading: false })
      throw error
    }
  },

  sendMessage: async (data) => {
    const response = await api.post('/messages', data)
    const newMessage = response.data.data
    
    set((state) => ({
      messages: [...state.messages, newMessage]
    }))
    
    return newMessage
  },

  deleteMessage: async (id) => {
    await api.delete(`/messages/${id}`)
    set((state) => ({
      messages: state.messages.filter((m) => m._id !== id)
    }))
  },

  addMessage: (message) => {
    set((state) => ({
      messages: [...state.messages, message]
    }))
  },

  clearConversation: async (userId, permanent = false) => {
    await api.delete(`/messages/conversation/${userId}?permanent=${permanent}`)
    if (permanent) {
      set((state) => ({
        conversations: state.conversations.filter((c) => c.user._id !== userId),
        messages: [],
        currentConversation: null
      }))
    }
  },

  clearMessages: () => set({ messages: [], currentConversation: null }),
}))
