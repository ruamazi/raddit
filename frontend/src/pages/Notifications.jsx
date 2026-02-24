import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useNotificationsStore } from '../stores/notificationsStore'
import { useAuthStore } from '../stores/authStore'
import Loading from '../components/Loading'
import Modal from '../components/Modal'
import { formatRelativeTime } from '../utils/helpers'
import {
  HiOutlineBell,
  HiOutlineChatAlt,
  HiOutlineArrowUp,
  HiUserAdd,
  HiOutlineCheck,
  HiOutlineTrash,
  HiOutlineExclamation
} from 'react-icons/hi'
import toast from 'react-hot-toast'

export default function Notifications() {
  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearNotifications
  } = useNotificationsStore()
  const { isAuthenticated } = useAuthStore()
  const [showClearModal, setShowClearModal] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications()
    }
  }, [isAuthenticated])

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead()
      toast.success('تم تحديد جميع الإشعارات كمقروءة')
    } catch (error) {
      toast.error('خطأ في تحديث الإشعارات')
    }
  }

  const handleClearAll = async () => {
    setShowClearModal(true)
  }

  const confirmClearAll = async () => {
    try {
      await clearNotifications()
      toast.success('تم حذف جميع الإشعارات')
      setShowClearModal(false)
    } catch (error) {
      toast.error('خطأ في حذف الإشعارات')
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'post_reply':
      case 'comment_reply':
        return HiOutlineChatAlt
      case 'upvote_post':
      case 'upvote_comment':
        return HiOutlineArrowUp
      case 'new_follower':
        return HiUserAdd
      default:
        return HiOutlineBell
    }
  }

  const getNotificationLink = (notification) => {
    if (notification.post) return `/post/${notification.post._id}`
    if (notification.message) return `/messages/${notification.sender?._id}`
    if (notification.sender) return `/u/${notification.sender.username}`
    return '#'
  }

  if (!isAuthenticated) {
    return (
      <div className="card p-8 text-center">
        <HiOutlineBell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h2 className="text-xl font-bold mb-2">الإشعارات</h2>
        <p className="text-gray-500 mb-4">سجل دخولك للوصول إلى إشعاراتك</p>
        <Link to="/login" className="btn btn-primary">
          تسجيل الدخول
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            الإشعارات
            {unreadCount > 0 && (
              <span className="badge badge-primary mr-2">{unreadCount} جديد</span>
            )}
          </h1>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="btn btn-ghost text-sm">
                <HiOutlineCheck className="w-4 h-4" />
                <span>تحديد الكل كمقروء</span>
              </button>
            )}
            {notifications.length > 0 && (
              <button onClick={handleClearAll} className="btn btn-ghost text-sm text-red-600">
                <HiOutlineTrash className="w-4 h-4" />
                <span>حذف الكل</span>
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <Loading type="skeleton" />
        ) : notifications.length === 0 ? (
          <div className="card p-8 text-center">
            <HiOutlineBell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">لا توجد إشعارات</h3>
            <p className="text-gray-500">ستظهر الإشعارات هنا عند وجود نشاط جديد</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => {
              const Icon = getNotificationIcon(notification.type)
              return (
                <div
                  key={notification._id}
                  className={`card p-4 flex items-start gap-4 ${
                    !notification.isRead ? 'border-r-4 border-r-primary-500' : ''
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      to={getNotificationLink(notification)}
                      onClick={() => !notification.isRead && markAsRead(notification._id)}
                      className="block"
                    >
                      <p className="text-gray-900 dark:text-gray-100 font-medium">
                        {notification.title}
                      </p>
                      {notification.content && (
                        <p className="text-sm text-gray-500 truncate">
                          {notification.content}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {formatRelativeTime(notification.createdAt)}
                      </p>
                    </Link>
                  </div>
                  {!notification.isRead && (
                    <button
                      onClick={() => markAsRead(notification._id)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                    >
                      <HiOutlineCheck className="w-5 h-5 text-gray-400" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notification._id)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                  >
                    <HiOutlineTrash className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Modal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        title="حذف جميع الإشعارات"
      >
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <HiOutlineExclamation className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            سيتم حذف جميع الإشعارات. هل أنت متأكد؟
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowClearModal(false)}
              className="btn btn-ghost"
            >
              إلغاء
            </button>
            <button
              onClick={confirmClearAll}
              className="btn bg-red-500 hover:bg-red-600 text-white"
            >
              حذف الكل
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}
