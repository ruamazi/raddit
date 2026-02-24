import { create } from 'zustand'
import api from '../services/api'

export const usePostsStore = create((set, get) => ({
  posts: [],
  currentPost: null,
  isLoading: false,
  error: null,
  sort: 'hot',
  timeframe: 'all',
  hasMore: true,
  page: 1,

  setSort: (sort) => set({ sort, posts: [], page: 1, hasMore: true }),
  
  setTimeframe: (timeframe) => set({ timeframe, posts: [], page: 1, hasMore: true }),

  fetchPosts: async (params = {}, append = false) => {
    const state = get()
    const page = append ? state.page + 1 : 1
    
    set({ isLoading: true, error: null })
    
    try {
      const response = await api.get('/posts', {
        params: {
          sort: state.sort,
          timeframe: state.timeframe,
          limit: 20,
          page,
          ...params
        }
      })
      
      const newPosts = response.data.data
      
      set({
        posts: append ? [...state.posts, ...newPosts] : newPosts,
        isLoading: false,
        hasMore: newPosts.length === 20,
        page
      })
      
      return newPosts
    } catch (error) {
      set({ error: error.response?.data?.message || 'خطأ في جلب المنشورات', isLoading: false })
      throw error
    }
  },

  fetchPost: async (id) => {
    set({ isLoading: true, error: null })
    
    try {
      const response = await api.get(`/posts/${id}`)
      set({ currentPost: response.data.data, isLoading: false })
      return response.data.data
    } catch (error) {
      set({ error: error.response?.data?.message || 'خطأ في جلب المنشور', isLoading: false })
      throw error
    }
  },

  createPost: async (postData) => {
    const response = await api.post('/posts', postData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    
    const newPost = response.data.data
    set((state) => ({ posts: [newPost, ...state.posts] }))
    
    return newPost
  },

  updatePost: async (id, data) => {
    const response = await api.put(`/posts/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    
    const updatedPost = response.data.data
    
    set((state) => ({
      posts: state.posts.map((p) => (p._id === id ? updatedPost : p)),
      currentPost: state.currentPost?._id === id ? updatedPost : state.currentPost
    }))
    
    return updatedPost
  },

  deletePost: async (id) => {
    await api.delete(`/posts/${id}`)
    set((state) => ({
      posts: state.posts.filter((p) => p._id !== id),
      currentPost: state.currentPost?._id === id ? null : state.currentPost
    }))
  },

  votePost: async (id, voteType) => {
    const response = await api.post(`/posts/${id}/vote`, { voteType })
    const { voteScore, upvotes, downvotes, isUpvoted, isDownvoted } = response.data.data
    
    set((state) => ({
      posts: state.posts.map((p) =>
        p._id === id ? { ...p, voteScore, upvotes, downvotes, isUpvoted, isDownvoted } : p
      ),
      currentPost:
        state.currentPost?._id === id
          ? { ...state.currentPost, voteScore, upvotes, downvotes, isUpvoted, isDownvoted }
          : state.currentPost
    }))
    
    return response.data.data
  },

  clearPosts: () => set({ posts: [], page: 1, hasMore: true }),
  clearCurrentPost: () => set({ currentPost: null }),
}))
