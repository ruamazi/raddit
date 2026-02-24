import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { usePostsStore } from "../stores/postsStore";
import api from "../services/api";
import Modal from "./Modal";
import {
 formatRelativeTime,
 formatNumber,
 truncateText,
} from "../utils/helpers";
import {
 HiOutlineArrowUp,
 HiOutlineArrowDown,
 HiArrowUp,
 HiArrowDown,
 HiOutlineChat,
 HiOutlineShare,
 HiOutlineBookmark,
 HiOutlineDotsHorizontal,
 HiOutlineEye,
 HiOutlineGift,
 HiOutlineExclamation
} from "react-icons/hi";
import toast from "react-hot-toast";

export default function PostCard({ post, showCommunity = true }) {
 const { user, isAuthenticated } = useAuthStore();
 const { votePost } = usePostsStore();
  const [isSaved, setIsSaved] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [reportReason, setReportReason] = useState("");
 const [reportDescription, setReportDescription] = useState("");
 const [isReporting, setIsReporting] = useState(false);
 const [isVoting, setIsVoting] = useState(false);
 const menuRef = useRef(null);

  useEffect(() => {
   const handleClickOutside = (event) => {
    if (menuRef.current && !menuRef.current.contains(event.target)) {
     setShowMenu(false);
    }
   };
   document.addEventListener("mousedown", handleClickOutside);
   return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
   if (post.isHidden === true) {
    setIsHidden(true);
   } else if (post.isHidden === false) {
    setIsHidden(false);
   }
  }, [post.isHidden]);

  const handleVote = async (voteType) => {
  if (!isAuthenticated) {
   toast.error("يجب تسجيل الدخول للتصويت");
   return;
  }

  if (isVoting) return;

  setIsVoting(true);
  try {
   await votePost(post._id, voteType);
  } catch (error) {
   toast.error(error.response?.data?.message || "خطأ في التصويت");
  } finally {
   setIsVoting(false);
  }
 };

  const handleSave = async () => {
   if (!isAuthenticated) {
    toast.error("يجب تسجيل الدخول للحفظ");
    return;
   }
   setIsSaved(!isSaved);
   toast.success(isSaved ? "تم إزالة الحفظ" : "تم حفظ المنشور");
  };

  const handleShare = () => {
   navigator.clipboard.writeText(window.location.origin + `/post/${post._id}`);
   toast.success("تم نسخ الرابط");
  };

  const handleHide = async () => {
   if (!isAuthenticated) {
    toast.error("يجب تسجيل الدخول");
    setShowMenu(false);
    return;
   }

   try {
    const response = await api.post(`/users/hide/${post._id}`);
    setShowMenu(false);
    if (response.data.data.isHidden) {
     setIsHidden(true);
     toast.success("تم إخفاء المنشور");
    } else {
     setIsHidden(false);
     toast.success("تم إظهار المنشور");
    }
   } catch (error) {
    if (error.response?.data?.message === 'المنشور غير موجود') {
     setIsHidden(true);
     toast.success("تم إخفاء المنشور");
    } else {
     toast.error(error.response?.data?.message || "خطأ في إخفاء المنشور");
    }
   }
  };

  const toggleHideOption = async () => {
   if (!isAuthenticated) {
    toast.error("يجب تسجيل الدخول");
    setShowMenu(false);
    return;
   }

   try {
    await api.post(`/users/hide/${post._id}`);
    setShowMenu(false);
    toast.success("تم إخفاء المنشور");
    window.location.reload();
   } catch (error) {
    toast.error(error.response?.data?.message || "خطأ في إخفاء المنشور");
   }
  };

  const handleReport = async () => {
   if (!isAuthenticated) {
     toast.error("يجب تسجيل الدخول للإبلاغ");
     setShowMenu(false);
     return;
   }
   setShowMenu(false);
   setShowReportModal(true);
  };

  const submitReport = async () => {
   if (!reportReason) {
     toast.error("يرجى اختيار سبب البلاغ");
     return;
   }

   setIsReporting(true);
   try {
     await api.post(`/posts/${post._id}/report`, { 
       reason: reportReason,
       description: reportDescription 
     });
     toast.success("تم تقديم البلاغ بنجاح");
     setShowReportModal(false);
     setReportReason("");
     setReportDescription("");
   } catch (error) {
     toast.error(error.response?.data?.message || "خطأ في تقديم البلاغ");
   } finally {
     setIsReporting(false);
   }
  };

  const getVoteButtonClass = (type) => {
  const isActive = type === "up" ? post.isUpvoted : post.isDownvoted;
  const baseClass = type === "up" ? "vote-btn-up" : "vote-btn-down";
  const activeClass =
   type === "up" ? "vote-btn-up-active" : "vote-btn-down-active";
  return isActive ? activeClass : baseClass;
 };

 return (
  <article className="post-card group">
   <div className="post-votes">
    <button
     onClick={() => handleVote("upvote")}
     disabled={isVoting}
     className={getVoteButtonClass("up")}
    >
     {post.isUpvoted ? (
      <HiArrowUp className="w-5 h-5" />
     ) : (
      <HiOutlineArrowUp className="w-5 h-5" />
     )}
    </button>
    <span
     className={`text-sm font-bold ${
      post.isUpvoted
       ? "text-reddit-orange"
       : post.isDownvoted
         ? "text-blue-500"
         : "text-gray-900 dark:text-gray-100"
     }`}
    >
     {formatNumber(post.voteScore)}
    </span>
    <button
     onClick={() => handleVote("downvote")}
     disabled={isVoting}
     className={getVoteButtonClass("down")}
    >
     {post.isDownvoted ? (
      <HiArrowDown className="w-5 h-5" />
     ) : (
      <HiOutlineArrowDown className="w-5 h-5" />
     )}
    </button>
   </div>

   <div className="post-content">
    <div className="post-meta">
     {showCommunity && post.community && (
      <>
       <Link
        to={`/c/${post.community.name}`}
        className="flex items-center gap-1 hover:underline"
       >
        {post.community.icon ? (
         <img
          src={post.community.icon}
          alt=""
          className="w-5 h-5 rounded-full"
         />
        ) : (
         <div className="w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 text-xs">
          {post.community.displayName?.[0]}
         </div>
        )}
        <span className="font-medium text-gray-900 dark:text-gray-100">
         {post.community.displayName}
        </span>
       </Link>
       <span>•</span>
      </>
     )}
     <span>نشر بواسطة</span>
     <Link to={`/u/${post.author?.username}`} className="hover:underline">
      u/{post.author?.username}
     </Link>
     <span>•</span>
     <span>{formatRelativeTime(post.createdAt)}</span>
    </div>

    <Link to={`/post/${post._id}`}>
     <h2 className="post-title">
      {post.isSpoiler && (
       <span className="badge badge-warning ml-2">سبويلر</span>
      )}
      {post.isNSFW && <span className="badge badge-danger ml-2">+18</span>}
      {post.title}
     </h2>
    </Link>

    {post.flair && (
     <span
      className="flair mb-2"
      style={{
       backgroundColor: post.flair.color || "#0079D3",
       color: post.flair.textColor || "#fff",
      }}
     >
      {post.flair.text}
     </span>
    )}

    {post.type === "image" && post.images?.length > 0 && (
     <Link to={`/post/${post._id}`} className="block mb-3">
      {post.images.length === 1 ? (
       <img
        src={
         typeof post.images[0] === "string"
          ? post.images[0]
          : post.images[0].url
        }
        alt=""
        className="rounded-xl max-h-96 w-full object-contain bg-gray-100 dark:bg-gray-800"
       />
      ) : (
       <div
        className={`grid gap-1 rounded-xl overflow-hidden ${
         post.images.length === 2
          ? "grid-cols-2"
          : post.images.length >= 3
            ? "grid-cols-2"
            : ""
        }`}
       >
        {post.images.slice(0, 4).map((image, index) => (
         <div
          key={index}
          className="relative bg-gray-100 dark:bg-gray-800 aspect-square"
         >
          <img
           src={typeof image === "string" ? image : image.url}
           alt=""
           className="w-full h-full object-cover"
          />
          {index === 3 && post.images.length > 4 && (
           <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white text-xl font-bold">
             +{post.images.length - 4}
            </span>
           </div>
          )}
         </div>
        ))}
       </div>
      )}
     </Link>
    )}

    {post.type === "link" && post.link && (
     <a
      href={post.link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block mb-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700"
     >
      <div className="text-sm text-primary-600 dark:text-primary-400 truncate">
       {post.link.url}
      </div>
      {post.link.title && (
       <div className="font-medium mt-1">{post.link.title}</div>
      )}
      {post.link.description && (
       <div className="text-sm text-gray-500 mt-1 truncate">
        {post.link.description}
       </div>
      )}
     </a>
    )}

    {post.type === "poll" && post.poll && (
     <Link to={`/post/${post._id}`} className="block mb-3">
      <div className="space-y-2">
       {post.poll.options.map((option, index) => {
        const percentage =
         post.poll.totalVotes > 0
          ? Math.round((option.votes / post.poll.totalVotes) * 100)
          : 0;
        return (
         <div
          key={index}
          className="relative w-full rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-800"
         >
          <div
           className="absolute inset-0 bg-primary-100 dark:bg-primary-900/30 transition-all duration-300"
           style={{ width: `${percentage}%` }}
          />
          <div className="relative p-2 flex items-center justify-between text-sm">
           <span>{option.text}</span>
           <span className="text-gray-500">{percentage}%</span>
          </div>
         </div>
        );
       })}
       <div className="text-xs text-gray-500">{post.poll.totalVotes} صوت</div>
      </div>
     </Link>
    )}

    {post.type === "text" && post.content && (
     <Link to={`/post/${post._id}`}>
      <p className="post-preview">{truncateText(post.content, 200)}</p>
     </Link>
    )}

    <div className="post-actions">
     <Link to={`/post/${post._id}`} className="post-action-btn">
      <HiOutlineChat className="w-4 h-4" />
      <span>{formatNumber(post.commentCount)} تعليق</span>
     </Link>

     <button onClick={handleShare} className="post-action-btn">
      <HiOutlineShare className="w-4 h-4" />
      <span className="hidden sm:inline">مشاركة</span>
     </button>

     <button
      onClick={handleSave}
      className={`post-action-btn ${isSaved ? "text-primary-600" : ""}`}
     >
      <HiOutlineBookmark className="w-4 h-4" />
      <span className="hidden sm:inline">{isSaved ? "محفوظ" : "حفظ"}</span>
     </button>

     <div className="relative">
      <button
       type="button"
       onClick={() => setShowMenu(!showMenu)}
       className="post-action-btn"
      >
       <HiOutlineDotsHorizontal className="w-4 h-4" />
      </button>

      {showMenu && (
        <div
         ref={menuRef}
         className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-2 min-w-40 z-[100]"
        >
          {isAuthenticated && (
           isHidden ? (
            <button onClick={handleHide} className="dropdown-item w-full">
             <HiOutlineEye className="w-4 h-4" />
             <span>إظهار</span>
            </button>
           ) : (
            <button onClick={handleHide} className="dropdown-item w-full">
             <HiOutlineEye className="w-4 h-4" />
             <span>إخفاء</span>
            </button>
           )
          )}
          <button className="dropdown-item w-full">
            <HiOutlineGift className="w-4 h-4" />
            <span>جائزة</span>
          </button>
         <button onClick={handleReport} className="dropdown-item w-full text-red-600">
          <HiOutlineExclamation className="w-4 h-4" />
          <span>إبلاغ</span>
         </button>
        </div>
       )}
      </div>
     </div>
    </div>

    <Modal
     isOpen={showReportModal}
     onClose={() => setShowReportModal(false)}
     title="إبلاغ عن منشور"
    >
     <div className="space-y-4">
      <div>
       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        سبب الإبلاغ
       </label>
       <div className="grid grid-cols-2 gap-2">
        {[
         { value: 'spam', label: 'سبام' },
         { value: 'harassment', label: 'مضايقة' },
         { value: 'hate_speech', label: 'خطاب كراهية' },
         { value: 'violence', label: 'عنف' },
         { value: 'misinformation', label: 'معلومات خاطئة' },
         { value: 'other', label: 'أخرى' }
        ].map((reason) => (
         <button
          key={reason.value}
          onClick={() => setReportReason(reason.value)}
          className={`p-3 rounded-xl border text-sm transition-all ${
           reportReason === reason.value
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-600'
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
          }`}
         >
          {reason.label}
         </button>
        ))}
       </div>
      </div>

      <div>
       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        تفاصيل إضافية (اختياري)
       </label>
       <textarea
        value={reportDescription}
        onChange={(e) => setReportDescription(e.target.value)}
        placeholder="اكتب تفاصيل إضافية..."
        className="input min-h-24"
        rows={3}
       />
      </div>

      <div className="flex gap-2 pt-2">
       <button
        onClick={submitReport}
        disabled={isReporting || !reportReason}
        className="btn btn-primary flex-1"
       >
        {isReporting ? 'جاري الإرسال...' : 'إرسال البلاغ'}
       </button>
       <button
        onClick={() => setShowReportModal(false)}
        className="btn btn-ghost"
       >
        إلغاء
       </button>
      </div>
     </div>
    </Modal>
   </article>
  );
}
