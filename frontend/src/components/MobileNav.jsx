import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import {
  HiOutlineHome,
  HiOutlineSearch,
  HiOutlinePlus,
  HiOutlineBell,
  HiOutlineUser
} from 'react-icons/hi'

export default function MobileNav() {
  const { user, isAuthenticated } = useAuthStore()
  const location = useLocation()

  const navItems = [
    { to: '/', icon: HiOutlineHome, label: 'الرئيسية' },
    { to: '/search', icon: HiOutlineSearch, label: 'بحث' },
    { to: isAuthenticated ? '/create-community' : '/login', icon: HiOutlinePlus, label: 'إنشاء' },
    { to: isAuthenticated ? '/notifications' : '/login', icon: HiOutlineBell, label: 'إشعارات' },
    { to: isAuthenticated ? `/u/${user?.username}` : '/login', icon: HiOutlineUser, label: 'حسابي' },
  ]

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-40">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item, index) => (
          <Link
            key={item.label + index}
            to={item.to}
            className={`flex flex-col items-center justify-center gap-1 py-2 px-3 ${
              isActive(item.to)
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <item.icon className="w-6 h-6" />
            <span className="text-xs">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
