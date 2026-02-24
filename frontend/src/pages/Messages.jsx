import { useEffect, useState, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useMessagesStore } from '../stores/messagesStore'
import { useAuthStore } from '../stores/authStore'
import Loading from '../components/Loading'
import Modal from '../components/Modal'
import { formatRelativeTime } from '../utils/helpers'
import { HiOutlineChat, HiOutlineSearch, HiPaperAirplane, HiOutlineDotsVertical, HiOutlineTrash, HiOutlineEyeOff, HiOutlineExclamation } from 'react-icons/hi'
import toast from 'react-hot-toast'

export default function Messages() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const { 
    conversations, 
    messages, 
    currentConversation, 
    fetchConversations, 
    fetchMessages, 
    sendMessage,
    clearConversation,
    isLoading 
  } = useMessagesStore()
  const { user: currentUser, isAuthenticated } = useAuthStore()
  const [messageText, setMessageText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showMenu, setShowMenu] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteType, setDeleteType] = useState('clear')
  const messagesEndRef = useRef(null)
  const menuRef = useRef(null)

  useEffect(() => {
    if (isAuthenticated) {
      fetchConversations()
    }
  }, [isAuthenticated])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (userId) {
      fetchMessages(userId)
    }
  }, [userId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    
    if (!messageText.trim()) return

    try {
      await sendMessage({
        recipient: userId,
        content: messageText
      })
      setMessageText('')
    } catch (error) {
      toast.error(error.response?.data?.message || 'خطأ في إرسال الرسالة')
    }
  }

  const handleClearConversation = async () => {
    setDeleteType('clear')
    setShowMenu(false)
    setShowDeleteModal(true)
  }

  const handleDeleteConversation = async () => {
    setDeleteType('permanent')
    setShowMenu(false)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    try {
      await clearConversation(userId, deleteType === 'permanent')
      toast.success(deleteType === 'permanent' ? 'تم حذف المحادثة نهائياً' : 'تم مسح المحادثة')
      setShowDeleteModal(false)
      navigate('/messages')
    } catch (error) {
      toast.error('خطأ في حذف المحادثة')
    }
  }

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.user.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!isAuthenticated) {
    return (
      <div className="card p-8 text-center">
        <HiOutlineChat className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h2 className="text-xl font-bold mb-2">الرسائل</h2>
        <p className="text-gray-500 mb-4">سجل دخولك للوصول إلى رسائلك</p>
        <Link to="/login" className="btn btn-primary">
          تسجيل الدخول
        </Link>
      </div>
    )
  }

  return (
    <div className="card overflow-hidden h-[calc(100vh-10rem)]">
      <div className="flex h-full">
        <div className={`w-full md:w-80 border-l border-gray-200 dark:border-gray-700 flex flex-col ${userId ? 'hidden md:flex' : ''}`}>
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <HiOutlineSearch className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="بحث..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pr-10 py-2"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <Loading type="spinner" className="py-8" />
            ) : filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                لا توجد محادثات
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredConversations.map((conv) => (
                  <Link
                    key={conv.user._id}
                    to={`/messages/${conv.user._id}`}
                    className={`flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                      userId === conv.user._id ? 'bg-gray-50 dark:bg-gray-800' : ''
                    }`}
                  >
                    <img
                      src={conv.user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${conv.user.username}`}
                      alt={conv.user.username}
                      className="w-12 h-12 rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {conv.user.displayName || conv.user.username}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatRelativeTime(conv.lastMessage.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {conv.lastMessage.content}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span className="inline-flex items-center justify-center w-5 h-5 text-xs bg-primary-500 text-white rounded-full mt-1">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={`flex-1 flex flex-col ${!userId ? 'hidden md:flex' : ''}`}>
          {userId && currentConversation ? (
            <>
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
                <Link 
                  to="/messages"
                  className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                <img
                  src={currentConversation.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${currentConversation.username}`}
                  alt={currentConversation.username}
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {currentConversation.displayName || currentConversation.username}
                  </div>
                  <div className="text-sm text-gray-500">
                    u/{currentConversation.username}
                  </div>
                </div>
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
                  >
                    <HiOutlineDotsVertical className="w-5 h-5 text-gray-500" />
                  </button>
                  {showMenu && (
                    <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
                      <button
                        onClick={handleClearConversation}
                        className="w-full px-4 py-2 text-right flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                      >
                        <HiOutlineEyeOff className="w-4 h-4" />
                        مسح المحادثة
                      </button>
                      <button
                        onClick={handleDeleteConversation}
                        className="w-full px-4 py-2 text-right flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-red-500"
                      >
                        <HiOutlineTrash className="w-4 h-4" />
                        حذف نهائي
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => {
                  const isMine = message.sender._id === currentUser._id
                  return (
                    <div
                      key={message._id}
                      className={`flex ${isMine ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[70%] p-3 rounded-2xl ${
                          isMine
                            ? 'bg-primary-500 text-white rounded-br-none'
                            : 'bg-gray-100 dark:bg-gray-800 rounded-bl-none'
                        }`}
                      >
                        <p>{message.content}</p>
                        <span className={`text-xs mt-1 block ${isMine ? 'text-white/70' : 'text-gray-500'}`}>
                          {formatRelativeTime(message.createdAt)}
                        </span>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="اكتب رسالة..."
                    className="input flex-1"
                  />
                  <button
                    type="submit"
                    disabled={!messageText.trim()}
                    className="btn btn-primary"
                  >
                    <HiPaperAirplane className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <HiOutlineChat className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  رسائلك
                </h3>
                <p className="text-gray-500">
                  اختر محادثة من القائمة للبدء
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title={deleteType === 'permanent' ? 'حذف المحادثة' : 'مسح المحادثة'}
      >
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <HiOutlineExclamation className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {deleteType === 'permanent' 
              ? 'سيتم حذف هذه المحادثة نهائياً لكلا الطرفين. هل أنت متأكد؟'
              : 'سيتم مسح المحادثة من قائمة محادثاتك. هل أنت متأكد؟'
            }
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="btn btn-ghost"
            >
              إلغاء
            </button>
            <button
              onClick={confirmDelete}
              className="btn bg-red-500 hover:bg-red-600 text-white"
            >
              {deleteType === 'permanent' ? 'حذف نهائي' : 'مسح'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
