import { create } from 'zustand'
import api from '../services/api'

export const useCommentsStore = create((set, get) => ({
  comments: [],
  isLoading: false,
  error: null,
  sort: 'best',

  setSort: (sort) => set({ sort }),

  fetchComments: async (postId) => {
    set({ isLoading: true, error: null })
    
    try {
      const response = await api.get(`/comments/post/${postId}`, {
        params: { sort: get().sort }
      })
      set({ comments: response.data.data, isLoading: false })
      return response.data.data
    } catch (error) {
      set({ error: error.response?.data?.message || 'خطأ في جلب التعليقات', isLoading: false })
      throw error
    }
  },

  createComment: async (data) => {
    const response = await api.post('/comments', data)
    const newComment = response.data.data
    
    if (data.parent) {
      set((state) => ({
        comments: addReplyToParent(state.comments, data.parent, newComment)
      }))
    } else {
      set((state) => ({
        comments: [...state.comments, newComment]
      }))
    }
    
    return newComment
  },

  createComment: async (data) => {
    const response = await api.post('/comments', data)
    const newComment = response.data.data
    
    if (data.parent) {
      set((state) => ({
        comments: addReplyToParent(state.comments, data.parent, newComment)
      }))
    } else {
      set((state) => ({
        comments: [...state.comments, newComment]
      }))
    }
    
    return newComment
  },

  updateComment: async (id, content) => {
    const response = await api.put(`/comments/${id}`, { content })
    const updatedComment = response.data.data
    
    set((state) => ({
      comments: updateCommentInTree(state.comments, id, updatedComment)
    }))
    
    return updatedComment
  },

  deleteComment: async (id) => {
    await api.delete(`/comments/${id}`)
    set((state) => ({
      comments: deleteCommentFromTree(state.comments, id)
    }))
  },

  voteComment: async (id, voteType) => {
    const response = await api.post(`/comments/${id}/vote`, { voteType })
    const { voteScore, upvotes, downvotes, isUpvoted, isDownvoted } = response.data.data
    
    set((state) => ({
      comments: state.comments.map((c) =>
        c._id === id ? { ...c, voteScore, upvotes, downvotes, isUpvoted, isDownvoted } : c
      )
    }))
    
    return response.data.data
  },

  clearComments: () => set({ comments: [] }),
}))

function addReplyToParent(comments, parentId, newReply) {
  return comments.map(comment => {
    if (String(comment._id) === String(parentId)) {
      return {
        ...comment,
        replies: [...(comment.replies || []), newReply]
      }
    }
    if (comment.replies && comment.replies.length > 0) {
      return {
        ...comment,
        replies: addReplyToParent(comment.replies, parentId, newReply)
      }
    }
    return comment
  })
}

function updateCommentInTree(comments, id, updatedComment) {
  return comments.map(comment => {
    if (String(comment._id) === String(id)) {
      return { ...comment, ...updatedComment }
    }
    if (comment.replies && comment.replies.length > 0) {
      return {
        ...comment,
        replies: updateCommentInTree(comment.replies, id, updatedComment)
      }
    }
    return comment
  })
}

function deleteCommentFromTree(comments, id) {
  return comments
    .filter(comment => String(comment._id) !== String(id))
    .map(comment => {
      if (comment.replies && comment.replies.length > 0) {
        return {
          ...comment,
          replies: deleteCommentFromTree(comment.replies, id)
        }
      }
      return comment
    })
}
