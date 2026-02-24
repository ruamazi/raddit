import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useNotificationsStore } from '../stores/notificationsStore'
import { useThemeStore } from '../stores/themeStore'
import { initSocket, disconnectSocket } from '../services/socket'
import Header from './Header'
import Sidebar from './Sidebar'
import MobileNav from './MobileNav'

export default function Layout() {
  const { user, isAuthenticated, refreshUser, isLoading } = useAuthStore()
  const { fetchUnreadCount, unreadCount } = useNotificationsStore()
  const { theme } = useThemeStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    refreshUser()
  }, [])

  useEffect(() => {
    console.log('Layout auth state:', { isAuthenticated, user: user?._id, isLoading })
    if (isAuthenticated && user) {
      console.log('Initializing socket...')
      initSocket()
      fetchUnreadCount()
    }
    
    return () => {
      if (isAuthenticated) {
        disconnectSocket()
      }
    }
  }, [isAuthenticated, user?._id])

  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex">
        <div className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
          <div 
            className="fixed inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 w-72 bg-white dark:bg-gray-900 shadow-xl">
            <Sidebar />
          </div>
        </div>
        
        <aside className="hidden lg:block w-72 shrink-0">
          <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto scrollbar-hide">
            <Sidebar />
          </div>
        </aside>
        
        <main className="flex-1 min-w-0 py-4 px-4 lg:px-6 pb-20 lg:pb-6">
          <div className="max-w-4xl mx-auto">
            <Outlet />
          </div>
        </main>
        
        <aside className="hidden xl:block w-72 shrink-0">
          <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto scrollbar-hide">
            <RightSidebar />
          </div>
        </aside>
      </div>
      
      <MobileNav />
    </div>
  )
}

function RightSidebar() {
  const { isAuthenticated } = useAuthStore()
  
  return (
    <div className="p-4">
      <div className="card p-4 mb-4">
        <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-3">
          المجتمعات الشائعة
        </h3>
        <div className="space-y-2">
          <Link to="/c/programming" className="sidebar-item">
            <div className="community-icon">ب</div>
            <div>
              <div className="font-medium">برمجة</div>
              <div className="text-xs text-gray-500">125K عضو</div>
            </div>
          </Link>
          <Link to="/c/technology" className="sidebar-item">
            <div className="community-icon">ت</div>
            <div>
              <div className="font-medium">تكنولوجيا</div>
              <div className="text-xs text-gray-500">89K عضو</div>
            </div>
          </Link>
          <Link to="/c/gaming" className="sidebar-item">
            <div className="community-icon">أ</div>
            <div>
              <div className="font-medium">ألعاب</div>
              <div className="text-xs text-gray-500">67K عضو</div>
            </div>
          </Link>
        </div>
        <Link to="/search?type=communities" className="btn btn-ghost w-full mt-3 text-sm">
          عرض الكل
        </Link>
      </div>
      
      <div className="card p-4">
        <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-3">
          روابط مفيدة
        </h3>
        <div className="space-y-2 text-sm">
          <Link to="/about" className="block text-gray-600 dark:text-gray-400 hover:text-primary-600">
            حول الموقع
          </Link>
          <Link to="/help" className="block text-gray-600 dark:text-gray-400 hover:text-primary-600">
            مركز المساعدة
          </Link>
          <Link to="/rules" className="block text-gray-600 dark:text-gray-400 hover:text-primary-600">
            قواعد المجتمع
          </Link>
          <Link to="/privacy" className="block text-gray-600 dark:text-gray-400 hover:text-primary-600">
            سياسة الخصوصية
          </Link>
        </div>
      </div>
    </div>
  )
}
