import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import {
 HiOutlineHome,
 HiOutlineFire,
 HiOutlineClock,
 HiOutlineTrendingUp,
 HiOutlineCollection,
 HiOutlinePlus,
 HiOutlineUsers,
 HiOutlineSparkles,
} from "react-icons/hi";

export default function Sidebar() {
 const { user, isAuthenticated } = useAuthStore();
 const location = useLocation();

 const mainLinks = [
  { to: "/", icon: HiOutlineHome, label: "الرئيسية" },
  { to: "/?sort=hot", icon: HiOutlineFire, label: "الأكثر رواجاً" },
  { to: "/?sort=new", icon: HiOutlineClock, label: "الأحدث" },
  { to: "/?sort=top", icon: HiOutlineTrendingUp, label: "الأكثر تصويتاً" },
 ];

 const quickLinks = [
  {
   to: "/create-community",
   icon: HiOutlinePlus,
   label: "إنشاء مجتمع",
   auth: true,
  },
  {
   to: "/notifications",
   icon: HiOutlineSparkles,
   label: "الإشعارات",
   auth: true,
  },
  { to: "/messages", icon: HiOutlineCollection, label: "الرسائل", auth: true },
  { to: "/settings", icon: HiOutlineUsers, label: "الإعدادات", auth: true },
 ];

 const defaultCommunities = [
  {
   name: "programming",
   displayName: "برمجة",
   icon: "ب",
   color: "bg-blue-500",
  },
  {
   name: "technology",
   displayName: "تكنولوجيا",
   icon: "ت",
   color: "bg-purple-500",
  },
  { name: "gaming", displayName: "ألعاب", icon: "أ", color: "bg-green-500" },
  { name: "news", displayName: "أخبار", icon: "خ", color: "bg-red-500" },
  { name: "science", displayName: "علوم", icon: "ع", color: "bg-yellow-500" },
 ];

 const isActive = (path) => {
  if (path === "/") return location.pathname === "/" && !location.search;
  return (
   location.pathname === path || location.search.includes(path.replace("/", ""))
  );
 };

 return (
  <div className="p-4 mt-[55px]">
   <nav className="sidebar-section">
    <ul className="space-y-1">
     {mainLinks.map((link) => (
      <li key={link.to}>
       <Link
        to={link.to}
        className={`sidebar-item ${isActive(link.to) ? "sidebar-item-active" : ""}`}
       >
        <link.icon className="w-5 h-5" />
        <span>{link.label}</span>
       </Link>
      </li>
     ))}
    </ul>
   </nav>

   {isAuthenticated && (
    <nav className="sidebar-section">
     <h3 className="sidebar-title">سريع</h3>
     <ul className="space-y-1">
      {quickLinks
       .filter((l) => !l.auth || isAuthenticated)
       .map((link) => (
        <li key={link.to}>
         <Link
          to={link.to}
          className={`sidebar-item ${isActive(link.to) ? "sidebar-item-active" : ""}`}
         >
          <link.icon className="w-5 h-5" />
          <span>{link.label}</span>
         </Link>
        </li>
       ))}
     </ul>
    </nav>
   )}

   <nav className="sidebar-section">
    <div className="flex items-center justify-between mb-2 px-3">
     <h3 className="sidebar-title mb-0">المجتمعات</h3>
     <Link
      to="/create-community"
      className="text-xs text-primary-600 hover:text-primary-700"
     >
      إنشاء
     </Link>
    </div>
    <ul className="space-y-1">
     {defaultCommunities.map((community) => (
      <li key={community.name}>
       <Link
        to={`/c/${community.name}`}
        className={`sidebar-item ${location.pathname === `/c/${community.name}` ? "sidebar-item-active" : ""}`}
       >
        <div
         className={`w-6 h-6 rounded-full ${community.color} flex items-center justify-center text-white text-xs font-bold`}
        >
         {community.icon}
        </div>
        <span>{community.displayName}</span>
       </Link>
      </li>
     ))}
    </ul>
    <Link
     to="/search?type=communities"
     className="sidebar-item text-primary-600 dark:text-primary-400"
    >
     <HiOutlineUsers className="w-5 h-5" />
     <span>استكشف المزيد</span>
    </Link>
   </nav>

   <div className="mt-6 px-3 text-xs text-gray-500 dark:text-gray-400">
    <div className="flex flex-wrap gap-x-2 gap-y-1">
     <Link to="/about" className="hover:text-gray-700 dark:hover:text-gray-300">
      حول
     </Link>
     <span>•</span>
     <Link to="/help" className="hover:text-gray-700 dark:hover:text-gray-300">
      مساعدة
     </Link>
     <span>•</span>
     <Link
      to="/privacy"
      className="hover:text-gray-700 dark:hover:text-gray-300"
     >
      الخصوصية
     </Link>
     <span>•</span>
     <Link to="/terms" className="hover:text-gray-700 dark:hover:text-gray-300">
      الشروط
     </Link>
    </div>
    <p className="mt-2">© 2024 رديت</p>
   </div>
  </div>
 );
}
