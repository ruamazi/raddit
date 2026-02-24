import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useCommentsStore } from '../stores/commentsStore'
import { formatRelativeTime, formatNumber } from '../utils/helpers'
import {
  HiOutlineArrowUp,
  HiOutlineArrowDown,
  HiArrowUp,
  HiArrowDown,
  HiOutlineChat,
  HiOutlineDotsHorizontal,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineReply
} from 'react-icons/hi'
import toast from 'react-hot-toast'

export default function Comment({ comment, depth = 0, postId, communityId }) {
  const { user, isAuthenticated } = useAuthStore()
  const { voteComment, deleteComment } = useCommentsStore()
  const [isReplying, setIsReplying] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)
  const [replyContent, setReplyContent] = useState('')
  const [showMenu, setShowMenu] = useState(false)
  const [isVoting, setIsVoting] = useState(false)

  const handleVote = async (voteType) => {
    if (!isAuthenticated) {
      toast.error('يجب تسجيل الدخول للتصويت')
      return
    }

    if (isVoting) return
    
    setIsVoting(true)
    try {
      await voteComment(comment._id, voteType)
    } catch (error) {
      toast.error(error.response?.data?.message || 'خطأ في التصويت')
    } finally {
      setIsVoting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('هل أنت متأكد من حذف هذا التعليق؟')) return
    
    try {
      await deleteComment(comment._id)
      toast.success('تم حذف التعليق')
    } catch (error) {
      toast.error(error.response?.data?.message || 'خطأ في حذف التعليق')
    }
  }

  const handleEdit = async () => {
    if (!editContent.trim()) {
      toast.error('لا يمكن أن يكون التعليق فارغاً')
      return
    }
    
    try {
      await useCommentsStore.getState().updateComment(comment._id, editContent)
      setIsEditing(false)
      toast.success('تم تحديث التعليق')
    } catch (error) {
      toast.error(error.response?.data?.message || 'خطأ في تحديث التعليق')
    }
  }

  const handleReply = async () => {
    if (!replyContent.trim()) {
      toast.error('لا يمكن أن يكون الرد فارغاً')
      return
    }
    
    try {
      await useCommentsStore.getState().createComment({
        content: replyContent,
        post: postId,
        community: communityId,
        parent: comment._id
      })
      setReplyContent('')
      setIsReplying(false)
      toast.success('تم إضافة الرد')
    } catch (error) {
      toast.error(error.response?.data?.message || 'خطأ في إضافة الرد')
    }
  }

  const getVoteButtonClass = (type) => {
    const isActive = type === 'up' ? comment.isUpvoted : comment.isDownvoted
    const baseClass = type === 'up' ? 'vote-btn-up' : 'vote-btn-down'
    const activeClass = type === 'up' ? 'vote-btn-up-active' : 'vote-btn-down-active'
    return isActive ? activeClass : baseClass
  }

  const maxDepth = 5
  const showThread = depth < maxDepth && comment.replies?.length > 0

  return (
    <div className={`${depth > 0 ? 'comment-thread' : ''}`}>
      <div className="comment">
        <div className="comment-header">
          <Link to={`/u/${comment.author?.username}`}>
            <img
              src={comment.author?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${comment.author?.username}`}
              alt={comment.author?.username}
              className="w-6 h-6 rounded-full"
            />
          </Link>
          <Link 
            to={`/u/${comment.author?.username}`}
            className="comment-author hover:underline"
          >
            {comment.author?.username}
          </Link>
          {comment.author?.karma !== undefined && (
            <span className="text-xs text-gray-400">
              {formatNumber(comment.author.karma)} كارما
            </span>
          )}
          <span className="comment-time">{formatRelativeTime(comment.createdAt)}</span>
          {comment.isEdited && (
            <span className="text-xs text-gray-400">(تم التعديل)</span>
          )}
        </div>

        {isEditing ? (
          <div className="mb-3">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="input min-h-24"
              rows={3}
            />
            <div className="flex gap-2 mt-2">
              <button onClick={handleEdit} className="btn btn-primary text-sm">
                حفظ
              </button>
              <button onClick={() => setIsEditing(false)} className="btn btn-ghost text-sm">
                إلغاء
              </button>
            </div>
          </div>
        ) : (
          <p className="comment-body">{comment.content}</p>
        )}

        <div className="comment-actions">
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleVote('upvote')}
              disabled={isVoting}
              className={getVoteButtonClass('up')}
            >
              {comment.isUpvoted ? (
                <HiArrowUp className="w-4 h-4" />
              ) : (
                <HiOutlineArrowUp className="w-4 h-4" />
              )}
            </button>
            <span className={`text-sm font-medium ${
              comment.isUpvoted ? 'text-reddit-orange' : 
              comment.isDownvoted ? 'text-blue-500' : 
              'text-gray-500'
            }`}>
              {formatNumber(comment.voteScore)}
            </span>
            <button
              onClick={() => handleVote('downvote')}
              disabled={isVoting}
              className={getVoteButtonClass('down')}
            >
              {comment.isDownvoted ? (
                <HiArrowDown className="w-4 h-4" />
              ) : (
                <HiOutlineArrowDown className="w-4 h-4" />
              )}
            </button>
          </div>

          {isAuthenticated && (
            <button
              onClick={() => setIsReplying(!isReplying)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <HiOutlineReply className="w-4 h-4" />
              <span>رد</span>
            </button>
          )}

          {user?._id === comment.author?._id && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <HiOutlineDotsHorizontal className="w-4 h-4" />
              </button>
              
              {showMenu && (
                <div className="absolute bottom-full right-0 mb-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-1 min-w-32">
                  <button
                    onClick={() => {
                      setIsEditing(true)
                      setShowMenu(false)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <HiOutlinePencil className="w-4 h-4" />
                    <span>تعديل</span>
                  </button>
                  <button
                    onClick={() => {
                      handleDelete()
                      setShowMenu(false)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <HiOutlineTrash className="w-4 h-4" />
                    <span>حذف</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {isReplying && (
          <div className="mt-3">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="اكتب ردك..."
              className="input min-h-24"
              rows={3}
            />
            <div className="flex gap-2 mt-2">
              <button onClick={handleReply} className="btn btn-primary text-sm">
                رد
              </button>
              <button onClick={() => setIsReplying(false)} className="btn btn-ghost text-sm">
                إلغاء
              </button>
            </div>
          </div>
        )}
      </div>

      {showThread && (
        <div className="space-y-3">
          {comment.replies.map((reply) => (
            <Comment
              key={reply._id}
              comment={reply}
              depth={depth + 1}
              postId={postId}
              communityId={communityId}
            />
          ))}
        </div>
      )}
    </div>
  )
}
