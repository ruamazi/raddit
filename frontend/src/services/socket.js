import { io } from 'socket.io-client'
import { useAuthStore } from '../stores/authStore'
import { useNotificationsStore } from '../stores/notificationsStore'
import { useMessagesStore } from '../stores/messagesStore'

let socket = null

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export const initSocket = () => {
  if (socket) {
    console.log('Socket already initialized')
    return socket
  }

  const token = localStorage.getItem('accessToken')
  console.log('Initializing socket, token exists:', !!token, 'url:', SOCKET_URL)
  
  socket = io(SOCKET_URL, {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    auth: {
      token: token
    }
  })

  socket.on('connect', () => {
    console.log('Socket connected')
    const user = useAuthStore.getState().user
    if (user) {
      socket.emit('join')
    }
  })

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message)
  })

  socket.on('disconnect', () => {
    console.log('Socket disconnected')
  })

  socket.on('notification', (notification) => {
    useNotificationsStore.getState().incrementUnread()
    if (notification) {
      useNotificationsStore.getState().addNotification(notification)
    } else {
      useNotificationsStore.getState().fetchNotifications()
    }
  })

  socket.on('new-message', (message) => {
    useMessagesStore.getState().addMessage(message)
  })

  socket.on('new-comment', (comment) => {
    console.log('New comment:', comment)
  })

  socket.on('new-post', (post) => {
    console.log('New post:', post)
  })

  return socket
}

export const getSocket = () => socket

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export const joinCommunity = (communityId) => {
  if (socket) {
    socket.emit('join-community', communityId)
  }
}

export const leaveCommunity = (communityId) => {
  if (socket) {
    socket.emit('leave-community', communityId)
  }
}

export const joinPost = (postId) => {
  if (socket) {
    socket.emit('join-post', postId)
  }
}

export const leavePost = (postId) => {
  if (socket) {
    socket.emit('leave-post', postId)
  }
}
