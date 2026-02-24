import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { useAuthStore } from '../stores/authStore'
import Loading from '../components/Loading'
import Modal from '../components/Modal'
import { formatNumber, formatRelativeTime } from '../utils/helpers'
import {
  HiOutlineUsers,
  HiOutlineDocumentText,
  HiOutlineChatAlt,
  HiOutlineUserGroup,
  HiOutlineShieldExclamation,
  HiOutlineExclamationCircle,
  HiOutlineBan,
  HiOutlineCheck
} from 'react-icons/hi'
import toast from 'react-hot-toast'

export default function Admin() {
  const { user, isAuthenticated } = useAuthStore()
  const [stats, setStats] = useState(null)
  const [reports, setReports] = useState([])
  const [users, setUsers] = useState([])
  const [activeTab, setActiveTab] = useState('overview')
  const [isLoading, setIsLoading] = useState(true)
  const [showBanModal, setShowBanModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [banReason, setBanReason] = useState('')
  const [banDuration, setBanDuration] = useState('0')
  const [canPost, setCanPost] = useState(false)
  const [canComment, setCanComment] = useState(false)

  useEffect(() => {
    if (isAuthenticated && user?.isAdmin) {
      fetchData()
    }
  }, [isAuthenticated, user])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [statsRes, reportsRes, usersRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/reports'),
        api.get('/admin/users')
      ])
      setStats(statsRes.data.data)
      setReports(reportsRes.data.data)
      setUsers(usersRes.data.data)
    } catch (error) {
      toast.error('خطأ في جلب البيانات')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBanUser = async (userId, reason) => {
    try {
      await api.put(`/admin/users/${userId}/ban`, { 
        reason,
        duration: parseInt(banDuration),
        canPost,
        canComment
      })
      toast.success('تم تطبيق الحظر بنجاح')
      setShowBanModal(false)
      setBanReason('')
      setBanDuration('0')
      setCanPost(false)
      setCanComment(false)
      fetchData()
    } catch (error) {
      toast.error('خطأ في تطبيق الحظر')
    }
  }

  const handleUnbanUser = async (userId) => {
    try {
      await api.put(`/admin/users/${userId}/unban`)
      toast.success('تم إلغاء الحظر بنجاح')
      fetchData()
    } catch (error) {
      toast.error('خطأ في إلغاء الحظر')
    }
  }

  const handleFixCommentCounts = async () => {
    try {
      const response = await api.post('/admin/fix-comment-counts')
      toast.success(response.data.message)
      fetchData()
    } catch (error) {
      toast.error('خطأ في إصلاح أعداد التعليقات')
    }
  }

  const openBanModal = (u) => {
    setSelectedUser(u)
    setBanReason(u.banReason || '')
    setCanPost(!u.canPost)
    setCanComment(!u.canComment)
    setBanDuration('0')
    setShowBanModal(true)
  }

  const handleResolveReport = async (reportId, action, note) => {
    try {
      await api.put(`/admin/reports/${reportId}`, { action, actionNote: note })
      toast.success('تم معالجة البلاغ')
      fetchData()
    } catch (error) {
      toast.error('خطأ في معالجة البلاغ')
    }
  }

  if (!isAuthenticated || !user?.isAdmin) {
    return (
      <div className="card p-8 text-center">
        <HiOutlineShieldExclamation className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h2 className="text-xl font-bold mb-2">وصول ممنوع</h2>
        <p className="text-gray-500 mb-4">ليس لديك صلاحية للوصول إلى هذه الصفحة</p>
        <Link to="/" className="btn btn-primary">
          العودة للرئيسية
        </Link>
      </div>
    )
  }

  if (isLoading) {
    return <Loading type="spinner" className="py-8" />
  }

  const tabs = [
    { id: 'overview', label: 'نظرة عامة' },
    { id: 'reports', label: 'البلاغات' },
    { id: 'users', label: 'المستخدمون' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        لوحة التحكم
      </h1>

      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <HiOutlineUsers className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {formatNumber(stats.totalUsers)}
                </div>
                <div className="text-sm text-gray-500">مستخدم</div>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <HiOutlineDocumentText className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {formatNumber(stats.totalPosts)}
                </div>
                <div className="text-sm text-gray-500">منشور</div>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <HiOutlineUserGroup className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {formatNumber(stats.totalCommunities)}
                </div>
                <div className="text-sm text-gray-500">مجتمع</div>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <HiOutlineExclamationCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.pendingReports}
                </div>
                <div className="text-sm text-gray-500">بلاغ معلق</div>
              </div>
            </div>
          </div>

          <button
            onClick={handleFixCommentCounts}
            className="btn btn-secondary w-full mt-4"
          >
            إصلاح أعداد التعليقات
          </button>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-4">
          {reports.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-gray-500">لا توجد بلاغات معلقة</p>
            </div>
          ) : (
            reports.map((report) => (
              <div key={report._id} className="card p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="badge badge-danger">
                        {report.reason === 'spam' ? 'سبام' :
                         report.reason === 'harassment' ? 'تحرش' :
                         report.reason === 'hate_speech' ? 'خطاب كراهية' : report.reason}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatRelativeTime(report.createdAt)}
                      </span>
                    </div>
                    
                    {report.reportedPost && (
                      <p className="text-gray-700 dark:text-gray-300">
                        <span className="font-medium">المنشور:</span> {report.reportedPost.title}
                      </p>
                    )}
                    
                    {report.reportedUser && (
                      <p className="text-gray-700 dark:text-gray-300">
                        <span className="font-medium">المستخدم:</span> {report.reportedUser.username}
                      </p>
                    )}
                    
                    {report.description && (
                      <p className="text-sm text-gray-500 mt-2">{report.description}</p>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleResolveReport(report._id, 'removal', 'تم حذف المحتوى')}
                      className="btn btn-secondary text-sm"
                    >
                      حذف
                    </button>
                    <button
                      onClick={() => handleResolveReport(report._id, 'warning', 'تم التحذير')}
                      className="btn btn-secondary text-sm"
                    >
                      تحذير
                    </button>
                    <button
                      onClick={() => handleResolveReport(report._id, 'dismissed', 'بلاغ غير صحيح')}
                      className="btn btn-ghost text-sm"
                    >
                      تجاهل
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'users' && (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">المستخدم</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">الحالة</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">الكارما</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">تاريخ التسجيل</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {users.map((u) => (
                <tr key={u._id}>
                  <td className="px-4 py-3">
                    <Link to={`/u/${u.username}`} className="flex items-center gap-2">
                      <img
                        src={u.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${u.username}`}
                        alt={u.username}
                        className="w-8 h-8 rounded-full"
                      />
                      <span className="font-medium">{u.username}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      {u.isBanned && (
                        <span className="badge badge-danger w-fit">محظور</span>
                      )}
                      {!u.canPost && (
                        <span className="badge badge-warning w-fit">لا ينشر</span>
                      )}
                      {!u.canComment && (
                        <span className="badge badge-warning w-fit">لا يعلق</span>
                      )}
                      {u.banExpiresAt && new Date(u.banExpiresAt) > new Date() && (
                        <span className="text-xs text-orange-500">
                          ينتهي: {formatRelativeTime(u.banExpiresAt)}
                        </span>
                      )}
                      {u.isBanned && u.banReason && (
                        <span className="text-xs text-gray-500">{u.banReason}</span>
                      )}
                      {u.isBanned === false && u.canPost === true && u.canComment === true && (
                        <span className="text-sm text-green-500">نشط</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">{formatNumber(u.karma)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {formatRelativeTime(u.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    {u.isBanned || !u.canPost || !u.canComment ? (
                      <button
                        onClick={() => handleUnbanUser(u._id)}
                        className="flex items-center gap-1 text-sm text-green-600 hover:underline"
                      >
                        <HiOutlineCheck className="w-4 h-4" />
                        <span>تفعيل</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => openBanModal(u)}
                        className="flex items-center gap-1 text-sm text-red-600 hover:underline"
                      >
                        <HiOutlineBan className="w-4 h-4" />
                        <span>حظر</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={showBanModal}
        onClose={() => setShowBanModal(false)}
        title={`حظر ${selectedUser?.username}`}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              سبب الحظر
            </label>
            <input
              type="text"
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="أدخل سبب الحظر..."
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              مدة الحظر
            </label>
            <select
              value={banDuration}
              onChange={(e) => setBanDuration(e.target.value)}
              className="input"
            >
              <option value="0">دائم</option>
              <option value="1">يوم واحد</option>
              <option value="3">3 أيام</option>
              <option value="7">أسبوع</option>
              <option value="14">أسبوعان</option>
              <option value="30">شهر</option>
              <option value="90">3 أشهر</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              تقييد الصلاحيات
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={canPost}
                  onChange={(e) => setCanPost(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600"
                />
                <span>منع النشر</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={canComment}
                  onChange={(e) => setCanComment(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600"
                />
                <span>منع التعليق</span>
              </label>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => handleBanUser(selectedUser?._id, banReason)}
              className="btn btn-primary flex-1"
            >
              تطبيق الحظر
            </button>
            <button
              onClick={() => setShowBanModal(false)}
              className="btn btn-ghost"
            >
              إلغاء
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
