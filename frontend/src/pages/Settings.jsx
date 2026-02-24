import { useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useThemeStore } from '../stores/themeStore'
import Loading from '../components/Loading'
import { HiOutlineUser, HiOutlineLockClosed, HiOutlineBell, HiOutlineEye, HiOutlineGlobe } from 'react-icons/hi'
import toast from 'react-hot-toast'

export default function Settings() {
  const { user, updateProfile, updatePreferences } = useAuthStore()
  const { theme, setTheme } = useThemeStore()
  const [activeTab, setActiveTab] = useState('profile')
  const [isLoading, setIsLoading] = useState(false)
  const [profileForm, setProfileForm] = useState({
    displayName: user?.displayName || '',
    bio: user?.bio || ''
  })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [preferences, setPreferences] = useState({
    theme: user?.preferences?.theme || 'system',
    showNSFW: user?.preferences?.showNSFW || false,
    emailNotifications: user?.preferences?.emailNotifications || true,
    showOnlineStatus: user?.preferences?.showOnlineStatus || true
  })

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      await updateProfile(profileForm)
      toast.success('تم تحديث الملف الشخصي')
    } catch (error) {
      toast.error(error.response?.data?.message || 'خطأ في التحديث')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('كلمات المرور غير متطابقة')
      return
    }

    setIsLoading(true)
    
    try {
      await useAuthStore.getState().updatePassword(passwordForm.currentPassword, passwordForm.newPassword)
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      toast.success('تم تغيير كلمة المرور')
    } catch (error) {
      toast.error(error.response?.data?.message || 'خطأ في تغيير كلمة المرور')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePreferencesUpdate = async () => {
    setIsLoading(true)
    
    try {
      await updatePreferences(preferences)
      setTheme(preferences.theme)
      toast.success('تم تحديث الإعدادات')
    } catch (error) {
      toast.error(error.response?.data?.message || 'خطأ في التحديث')
    } finally {
      setIsLoading(false)
    }
  }

  const tabs = [
    { id: 'profile', label: 'الملف الشخصي', icon: HiOutlineUser },
    { id: 'security', label: 'الأمان', icon: HiOutlineLockClosed },
    { id: 'preferences', label: 'التفضيلات', icon: HiOutlineEye },
    { id: 'notifications', label: 'الإشعارات', icon: HiOutlineBell },
  ]

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        الإعدادات
      </h1>

      <div className="flex flex-col md:flex-row gap-6">
        <nav className="md:w-48 shrink-0">
          <div className="flex md:flex-col gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-2 rounded-xl text-sm transition-all w-full justify-start ${
                  activeTab === tab.id
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-medium'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </nav>

        <div className="flex-1">
          {activeTab === 'profile' && (
            <div className="card p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
                تعديل الملف الشخصي
              </h2>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div>
                  <label className="label">اسم العرض</label>
                  <input
                    type="text"
                    value={profileForm.displayName}
                    onChange={(e) => setProfileForm({ ...profileForm, displayName: e.target.value })}
                    className="input"
                    maxLength={50}
                  />
                </div>
                <div>
                  <label className="label">النبذة</label>
                  <textarea
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                    className="input"
                    rows={3}
                    maxLength={200}
                  />
                  <div className="text-xs text-gray-500 mt-1 text-left">
                    {profileForm.bio.length}/200
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" disabled={isLoading}>
                  {isLoading ? <Loading type="spinner" size="sm" /> : 'حفظ التغييرات'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="card p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
                تغيير كلمة المرور
              </h2>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="label">كلمة المرور الحالية</label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="input"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="label">كلمة المرور الجديدة</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="input"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="label">تأكيد كلمة المرور الجديدة</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="input"
                    dir="ltr"
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={isLoading}>
                  {isLoading ? <Loading type="spinner" size="sm" /> : 'تغيير كلمة المرور'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="card p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
                التفضيلات
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="label">المظهر</label>
                  <div className="flex gap-3">
                    {['light', 'dark', 'system'].map((t) => (
                      <button
                        key={t}
                        onClick={() => setPreferences({ ...preferences, theme: t })}
                        className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                          preferences.theme === t
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-sm font-medium">{t === 'light' ? 'فاتح' : t === 'dark' ? 'داكن' : 'النظام'}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.showNSFW}
                      onChange={(e) => setPreferences({ ...preferences, showNSFW: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <div>
                      <div className="font-medium">عرض محتوى البالغين</div>
                      <div className="text-sm text-gray-500">عرض المحتوى المحدد كـ +18</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.showOnlineStatus}
                      onChange={(e) => setPreferences({ ...preferences, showOnlineStatus: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <div>
                      <div className="font-medium">إظهار حالة الاتصال</div>
                      <div className="text-sm text-gray-500">السماح للآخرين برؤية متى كنت متصلاً</div>
                    </div>
                  </label>
                </div>

                <button onClick={handlePreferencesUpdate} className="btn btn-primary" disabled={isLoading}>
                  {isLoading ? <Loading type="spinner" size="sm" /> : 'حفظ التغييرات'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="card p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
                إعدادات الإشعارات
              </h2>
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.emailNotifications}
                    onChange={(e) => setPreferences({ ...preferences, emailNotifications: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <div>
                    <div className="font-medium">إشعارات البريد الإلكتروني</div>
                    <div className="text-sm text-gray-500">استلام الإشعارات عبر البريد الإلكتروني</div>
                  </div>
                </label>

                <button onClick={handlePreferencesUpdate} className="btn btn-primary" disabled={isLoading}>
                  {isLoading ? <Loading type="spinner" size="sm" /> : 'حفظ التغييرات'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
