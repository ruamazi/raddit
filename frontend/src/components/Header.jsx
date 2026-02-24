import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { useNotificationsStore } from "../stores/notificationsStore";
import { useThemeStore } from "../stores/themeStore";
import { formatNumber } from "../utils/helpers";
import {
 HiOutlineSearch,
 HiOutlineBell,
 HiOutlineChat,
 HiOutlineUser,
 HiOutlineCog,
 HiOutlineLogout,
 HiOutlinePlus,
 HiOutlineSun,
 HiOutlineMoon,
 HiOutlineDesktopComputer,
 HiOutlineChevronDown,
 HiOutlineShieldCheck,
} from "react-icons/hi";

export default function Header({ onMenuClick }) {
 const { user, isAuthenticated, logout } = useAuthStore();
 const { unreadCount, notifications, fetchNotifications } =
  useNotificationsStore();
 const { theme, setTheme } = useThemeStore();
 const navigate = useNavigate();
 const [showUserMenu, setShowUserMenu] = useState(false);
 const [showThemeMenu, setShowThemeMenu] = useState(false);
 const [showNotifications, setShowNotifications] = useState(false);
 const [searchQuery, setSearchQuery] = useState("");
 const [showSearch, setShowSearch] = useState(false);
 const userMenuRef = useRef(null);
 const themeMenuRef = useRef(null);
 const searchRef = useRef(null);
 const notifRef = useRef(null);

 useEffect(() => {
  const handleClickOutside = (event) => {
   if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
    setShowUserMenu(false);
   }
   if (themeMenuRef.current && !themeMenuRef.current.contains(event.target)) {
    setShowThemeMenu(false);
   }
   if (searchRef.current && !searchRef.current.contains(event.target)) {
    setShowSearch(false);
   }
   if (notifRef.current && !notifRef.current.contains(event.target)) {
    setShowNotifications(false);
   }
  };

  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
 }, []);

 const handleSearch = (e) => {
  e.preventDefault();
  if (searchQuery.trim()) {
   navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
   setSearchQuery("");
   setShowSearch(false);
  }
 };

 const handleLogout = async () => {
  await logout();
  navigate("/login");
 };

 const themeOptions = [
  { value: "light", label: "فاتح", icon: HiOutlineSun },
  { value: "dark", label: "داكن", icon: HiOutlineMoon },
  { value: "system", label: "النظام", icon: HiOutlineDesktopComputer },
 ];

 const currentTheme = themeOptions.find((t) => t.value === theme);

 const getNotificationIcon = (type) => {
  switch (type) {
   case "comment":
   case "post_reply":
   case "comment_reply":
    return "💬";
   case "reply":
    return "↩️";
   case "message":
    return "✉️";
   case "follow":
    return "👤";
   case "vote":
    return "⬆️";
   case "mention":
    return "@";
   default:
    return "🔔";
  }
 };

 const getNotificationLink = (notification) => {
  switch (notification.type) {
   case "comment":
   case "post_reply":
   case "comment_reply":
    return `/post/${notification.post}`;
   case "message":
    return `/messages/${notification.sender}`;
   case "follow":
    return `/u/${notification.sender}`;
   default:
    return "/notifications";
  }
 };

 const handleNotificationClick = (notification) => {
  navigate(getNotificationLink(notification));
  setShowNotifications(false);
 };

 return (
  <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
   <div className="flex items-center justify-between h-16 px-4">
    <div className="flex items-center gap-4">
     <button
      onClick={onMenuClick}
      className="lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
     >
      <svg
       className="w-6 h-6"
       fill="none"
       stroke="currentColor"
       viewBox="0 0 24 24"
      >
       <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 6h16M4 12h16M4 18h16"
       />
      </svg>
     </button>

     <Link to="/" className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-reddit-orange to-reddit-blue flex items-center justify-center">
        <span className="text-white font-bold text-sm">ع</span>
      </div>
      <span className="font-bold text-xl hidden sm:block bg-gradient-to-r from-reddit-orange to-reddit-blue bg-clip-text text-transparent">
        رديت
      </span>
     </Link>
    </div>

    <form
     onSubmit={handleSearch}
     className="hidden sm:block flex-1 max-w-xl mx-4"
    >
     <div className="relative">
      <HiOutlineSearch className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
      <input
       type="text"
       placeholder="ابحث في المجتمعات والمنشورات..."
       value={searchQuery}
       onChange={(e) => setSearchQuery(e.target.value)}
       className="input pr-10 py-2.5 bg-gray-100 dark:bg-gray-800 border-0 focus:bg-white dark:focus:bg-gray-700"
      />
     </div>
    </form>

    <div className="flex items-center gap-2">
     <button
      onClick={() => setShowSearch(!showSearch)}
      className="sm:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
     >
      <HiOutlineSearch className="w-6 h-6" />
     </button>

     {showSearch && (
      <div
       ref={searchRef}
       className="absolute top-full right-4 left-4 sm:hidden bg-white dark:bg-gray-900 p-4 shadow-lg rounded-b-xl"
      >
       <form onSubmit={handleSearch}>
        <input
         type="text"
         placeholder="ابحث..."
         value={searchQuery}
         onChange={(e) => setSearchQuery(e.target.value)}
         className="input"
         autoFocus
        />
       </form>
      </div>
     )}

     <div className="relative" ref={themeMenuRef}>
      <button
       onClick={() => setShowThemeMenu(!showThemeMenu)}
       className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
      >
       <currentTheme.icon className="w-5 h-5" />
      </button>

      {showThemeMenu && (
       <div className="dropdown left-0">
        {themeOptions.map((option) => (
         <button
          key={option.value}
          onClick={() => {
           setTheme(option.value);
           setShowThemeMenu(false);
          }}
          className={`dropdown-item w-full ${theme === option.value ? "bg-gray-50 dark:bg-gray-700" : ""}`}
         >
          <option.icon className="w-5 h-5" />
          <span>{option.label}</span>
         </button>
        ))}
       </div>
      )}
     </div>

     {isAuthenticated ? (
      <>
       <div className="relative" ref={notifRef}>
        <button
         onClick={() => {
          if (!showNotifications) {
           fetchNotifications({ limit: 5 });
          }
          setShowNotifications(!showNotifications);
         }}
         className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
        >
         <HiOutlineBell className="w-6 h-6" />
         {unreadCount > 0 && <span className="notification-dot" />}
        </button>

        {showNotifications && (
         <div className="absolute left-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-gray-700">
           <span className="font-bold text-gray-900 dark:text-gray-100">
            الإشعارات
           </span>
           <Link
            to="/notifications"
            onClick={() => setShowNotifications(false)}
            className="text-sm text-primary-500 hover:underline"
           >
            عرض الكل
           </Link>
          </div>
          <div className="max-h-80 overflow-y-auto">
           {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">
             لا توجد إشعارات
            </div>
           ) : (
            notifications.slice(0, 5).map((notification) => (
             <button
              key={notification._id}
              onClick={() => handleNotificationClick(notification)}
              className={`w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-right ${
               !notification.isRead
                ? "bg-primary-50 dark:bg-primary-900/20"
                : ""
              }`}
             >
              <span className="text-xl">
               {getNotificationIcon(notification.type)}
              </span>
              <div className="flex-1 min-w-0">
               <p className="text-sm text-gray-900 dark:text-gray-100 line-clamp-2">
                {notification.title}
               </p>
               <p className="text-xs text-gray-500 mt-1">
                {new Date(notification.createdAt).toLocaleDateString("ar")}
               </p>
              </div>
              {!notification.isRead && (
               <span className="w-2 h-2 bg-primary-500 rounded-full mt-2" />
              )}
             </button>
            ))
           )}
          </div>
         </div>
        )}
       </div>

       <Link
        to="/messages"
        className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
       >
        <HiOutlineChat className="w-6 h-6" />
       </Link>

       <Link to="/create-community" className="hidden md:flex btn btn-primary">
        <HiOutlinePlus className="w-5 h-5" />
        <span>مجتمع جديد</span>
       </Link>

       <div className="relative" ref={userMenuRef}>
        <button
         onClick={() => setShowUserMenu(!showUserMenu)}
         className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
        >
         <img
          src={
           user?.avatar ||
           `https://api.dicebear.com/7.x/initials/svg?seed=${user?.username}`
          }
          alt={user?.username}
          className="w-8 h-8 rounded-full"
         />
         <div className="hidden md:block text-right">
          <div className="text-sm font-medium">{user?.username}</div>
          <div className="text-xs text-gray-500">
           {formatNumber(user?.karma || 0)} كارما
          </div>
         </div>
         <HiOutlineChevronDown className="w-4 h-4 hidden md:block" />
        </button>

        {showUserMenu && (
         <div className="dropdown left-0">
          {user?.isAdmin && (
           <Link
            to="/admin"
            className="dropdown-item"
            onClick={() => setShowUserMenu(false)}
           >
            <HiOutlineShieldCheck className="w-5 h-5" />
            <span>لوحة الإدارة</span>
           </Link>
          )}
          <Link
           to={`/u/${user?.username}`}
           className="dropdown-item"
           onClick={() => setShowUserMenu(false)}
          >
           <HiOutlineUser className="w-5 h-5" />
           <span>الملف الشخصي</span>
          </Link>
          <Link
           to="/settings"
           className="dropdown-item"
           onClick={() => setShowUserMenu(false)}
          >
           <HiOutlineCog className="w-5 h-5" />
           <span>الإعدادات</span>
          </Link>
          <hr className="my-2 border-gray-100 dark:border-gray-700" />
          <button
           onClick={handleLogout}
           className="dropdown-item w-full text-red-600 dark:text-red-400"
          >
           <HiOutlineLogout className="w-5 h-5" />
           <span>تسجيل الخروج</span>
          </button>
         </div>
        )}
       </div>
      </>
     ) : (
      <div className="flex items-center gap-2">
       <Link to="/login" className="btn btn-ghost">
        تسجيل الدخول
       </Link>
       <Link to="/register" className="btn btn-primary">
        إنشاء حساب
       </Link>
      </div>
     )}
    </div>
   </div>
  </header>
 );
}
