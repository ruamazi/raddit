import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { usePostsStore } from '../stores/postsStore'
import { useCommentsStore } from '../stores/commentsStore'
import { useAuthStore } from '../stores/authStore'
import { joinPost, leavePost } from '../services/socket'
import api from '../services/api'
import Comment from '../components/Comment'
import Loading from '../components/Loading'
import Modal from '../components/Modal'
import { formatRelativeTime, formatNumber, truncateText } from '../utils/helpers'
import {
  HiOutlineArrowUp,
  HiOutlineArrowDown,
  HiArrowUp,
  HiArrowDown,
  HiOutlineShare,
  HiOutlineBookmark,
  HiOutlineDotsHorizontal,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineLockClosed
} from 'react-icons/hi'
import toast from 'react-hot-toast'

export default function Post() {
  const { id } = useParams()
  const { currentPost, fetchPost, votePost, deletePost, isLoading: postLoading } = usePostsStore()
  const { comments, fetchComments, createComment, isLoading: commentsLoading } = useCommentsStore()
  const { user, isAuthenticated } = useAuthStore()
  const [commentText, setCommentText] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [hasVoted, setHasVoted] = useState(false)
  const [selectedPollOption, setSelectedPollOption] = useState(null)

  useEffect(() => {
    fetchPost(id)
    fetchComments(id)
    joinPost(id)
    
    return () => {
      leavePost(id)
    }
  }, [id])

  useEffect(() => {
    if (currentPost && user?._id) {
      setHasVoted(currentPost.hasVoted || false)
      if (currentPost.userPollVote && currentPost.userPollVote.length > 0) {
        setSelectedPollOption(currentPost.userPollVote[0])
      }
    }
  }, [currentPost, user])

  const handleVote = async (voteType) => {
    if (!isAuthenticated) {
      toast.error('يجب تسجيل الدخول للتصويت')
      return
    }
    
    try {
      await votePost(id, voteType)
    } catch (error) {
      toast.error(error.response?.data?.message || 'خطأ في التصويت')
    }
  }

  const handlePollVote = async (optionIndex) => {
    if (!isAuthenticated) {
      toast.error('يجب تسجيل للتصويت في الاستطلاع')
      return
    }
    
    if (hasVoted) {
      toast.error('لقد صوتت بالفعل في هذا الاستطلاع')
      return
    }

    try {
      const response = await api.post(`/posts/${id}/vote-poll`, { options: optionIndex })
      if (response.data.success) {
        setHasVoted(true)
        setSelectedPollOption(optionIndex)
        fetchPost(id)
        toast.success('تم تسجيل تصويتك')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'خطأ في التصويت')
    }
  }

  const handleComment = async (e) => {
    e.preventDefault()
    
    if (!isAuthenticated) {
      toast.error('يجب تسجيل الدخول للتعليق')
      return
    }
    
    if (!commentText.trim()) {
      toast.error('لا يمكن أن يكون التعليق فارغاً')
      return
    }

    try {
      await createComment({
        content: commentText,
        post: id,
        community: currentPost.community._id
      })
      setCommentText('')
      toast.success('تم إضافة التعليق')
    } catch (error) {
      toast.error(error.response?.data?.message || 'خطأ في إضافة التعليق')
    }
  }

  const handleDelete = async () => {
    setShowDeleteModal(false)
    try {
      await deletePost(id)
      toast.success('تم حذف المنشور')
      window.history.back()
    } catch (error) {
      toast.error(error.response?.data?.message || 'خطأ في حذف المنشور')
    }
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success('تم نسخ الرابط')
  }

  const handleSave = async () => {
    if (!isAuthenticated) {
      toast.error('يجب تسجيل الدخول للحفظ')
      return
    }
    setIsSaving(!isSaving)
    toast.success(isSaving ? 'تم إزالة الحفظ' : 'تم حفظ المنشور')
  }

  if (postLoading && !currentPost) {
    return <Loading type="skeleton" />
  }

  if (!currentPost) {
    return (
      <div className="card p-8 text-center">
        <h2 className="text-xl font-bold mb-2">المنشور غير موجود</h2>
        <p className="text-gray-500 mb-4">لم يتم العثور على هذا المنشور</p>
        <Link to="/" className="btn btn-primary">
          العودة للرئيسية
        </Link>
      </div>
    )
  }

  const isAuthor = user?._id === currentPost.author?._id
  const isAdmin = user?.isAdmin

  return (
    <div>
      <div className="card overflow-hidden">
        <div className="p-4 flex gap-4">
          <div className="flex flex-col items-center gap-1 shrink-0">
            <button
              onClick={() => handleVote('upvote')}
              className={`vote-btn ${currentPost.isUpvoted ? 'vote-btn-up-active' : 'vote-btn-up'}`}
            >
              {currentPost.isUpvoted ? (
                <HiArrowUp className="w-6 h-6" />
              ) : (
                <HiOutlineArrowUp className="w-6 h-6" />
              )}
            </button>
            <span className={`text-lg font-bold ${
              currentPost.isUpvoted ? 'text-reddit-orange' : 
              currentPost.isDownvoted ? 'text-blue-500' : 
              'text-gray-900 dark:text-gray-100'
            }`}>
              {formatNumber(currentPost.voteScore)}
            </span>
            <button
              onClick={() => handleVote('downvote')}
              className={`vote-btn ${currentPost.isDownvoted ? 'vote-btn-down-active' : 'vote-btn-down'}`}
            >
              {currentPost.isDownvoted ? (
                <HiArrowDown className="w-6 h-6" />
              ) : (
                <HiOutlineArrowDown className="w-6 h-6" />
              )}
            </button>
          </div>

          <div className="flex-1 min-w-0">
            <div className="post-meta mb-2">
              <Link 
                to={`/c/${currentPost.community?.name}`}
                className="flex items-center gap-1 hover:underline"
              >
                {currentPost.community?.icon ? (
                  <img src={currentPost.community.icon} alt="" className="w-5 h-5 rounded-full" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 text-xs">
                    {currentPost.community?.displayName?.[0]}
                  </div>
                )}
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {currentPost.community?.displayName}
                </span>
              </Link>
              <span>•</span>
              <span>نشر بواسطة</span>
              <Link 
                to={`/u/${currentPost.author?.username}`}
                className="hover:underline"
              >
                u/{currentPost.author?.username}
              </Link>
              <span>•</span>
              <span>{formatRelativeTime(currentPost.createdAt)}</span>
              {currentPost.isEdited && (
                <>
                  <span>•</span>
                  <span className="text-gray-400">(تم التعديل)</span>
                </>
              )}
            </div>

            {currentPost.flair && (
              <span 
                className="flair mb-2 inline-block"
                style={{
                  backgroundColor: currentPost.flair.color || '#0079D3',
                  color: currentPost.flair.textColor || '#fff'
                }}
              >
                {currentPost.flair.text}
              </span>
            )}

            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {currentPost.isSpoiler && <span className="badge badge-warning ml-2">سبويلر</span>}
              {currentPost.isNSFW && <span className="badge badge-danger ml-2">+18</span>}
              {currentPost.title}
            </h1>

            {currentPost.type === 'image' && currentPost.images?.length > 0 && (
              <div className={`mb-4 ${currentPost.images.length > 1 ? 'grid gap-2' : ''} ${
                currentPost.images.length === 2 ? 'grid-cols-2' :
                currentPost.images.length === 3 ? 'grid-cols-2' :
                currentPost.images.length === 4 ? 'grid-cols-2' :
                currentPost.images.length >= 5 ? 'grid-cols-3' : ''
              }`}>
                {currentPost.images.map((image, index) => (
                  <div key={index} className="relative overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
                    <img 
                      src={typeof image === 'string' ? image : image.url} 
                      alt=""
                      className="w-full h-auto max-h-96 object-contain"
                    />
                  </div>
                ))}
              </div>
            )}

            {currentPost.type === 'video' && currentPost.video && (
              <video 
                src={currentPost.video.url} 
                controls
                className="rounded-xl max-w-full h-auto mb-4"
              />
            )}

            {currentPost.type === 'link' && currentPost.link && (
              <a 
                href={currentPost.link.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <div className="text-sm text-primary-600 dark:text-primary-400 truncate">
                  {currentPost.link.url}
                </div>
                {currentPost.link.title && (
                  <div className="font-medium mt-1">{currentPost.link.title}</div>
                )}
                {currentPost.link.description && (
                  <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {currentPost.link.description}
                  </div>
                )}
              </a>
            )}

            {currentPost.type === 'poll' && currentPost.poll && (
              <div className="mb-4 space-y-2">
                {currentPost.poll.options.map((option, index) => {
                  const percentage = currentPost.poll.totalVotes > 0 
                    ? Math.round((option.votes / currentPost.poll.totalVotes) * 100) 
                    : 0
                  const isSelected = hasVoted && selectedPollOption === index
                  return (
                    <div
                      key={index}
                      className={`relative w-full rounded-xl overflow-hidden ${
                        hasVoted ? 'cursor-default' : 'cursor-pointer'
                      }`}
                      onClick={() => !hasVoted && handlePollVote(index)}
                    >
                      {hasVoted && (
                        <div 
                          className="absolute inset-0 bg-primary-100 dark:bg-primary-900/30 transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      )}
                      <div className="relative p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3 z-10">
                          {!hasVoted && (
                            <div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                          )}
                          {hasVoted && isSelected && (
                            <div className="w-4 h-4 rounded-full bg-primary-500 flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-white" />
                            </div>
                          )}
                          {hasVoted && !isSelected && (
                            <div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                          )}
                          <span className={hasVoted && isSelected ? 'font-medium' : ''}>{option.text}</span>
                        </div>
                        <span className="text-sm text-gray-500 z-10">{percentage}%</span>
                      </div>
                    </div>
                  )
                })}
                <div className="flex items-center justify-between text-sm text-gray-500 pt-2">
                  <span>{currentPost.poll.totalVotes} صوت</span>
                  {hasVoted && <span className="text-primary-600">• لقد صوتت</span>}
                </div>
              </div>
            )}

            {currentPost.content && (
              <div className="prose dark:prose-invert max-w-none mb-4">
                {currentPost.content}
              </div>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>{formatNumber(currentPost.commentCount)} تعليق</span>
                <span>•</span>
                <span>{formatNumber(currentPost.viewCount)} مشاهدة</span>
              </div>

              <div className="flex items-center gap-2 mr-auto">
                <button
                  onClick={handleShare}
                  className="post-action-btn"
                >
                  <HiOutlineShare className="w-4 h-4" />
                  <span>مشاركة</span>
                </button>

                <button
                  onClick={handleSave}
                  className={`post-action-btn ${isSaving ? 'text-primary-600' : ''}`}
                >
                  <HiOutlineBookmark className="w-4 h-4" />
                  <span>{isSaving ? 'محفوظ' : 'حفظ'}</span>
                </button>

                {(isAuthor || isAdmin) && (
                  <div className="relative">
                    <button
                      onClick={() => setShowMenu(!showMenu)}
                      className="post-action-btn"
                    >
                      <HiOutlineDotsHorizontal className="w-4 h-4" />
                    </button>

                    {showMenu && (
                      <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-2 min-w-40 z-50">
                        {isAuthor && (
                          <Link
                            to={`/post/${id}/edit`}
                            className="dropdown-item"
                          >
                            <HiOutlinePencil className="w-4 h-4" />
                            <span>تعديل</span>
                          </Link>
                        )}
                        {(isAuthor || isAdmin) && (
                          <button
                            onClick={() => {
                              setShowMenu(false)
                              setShowDeleteModal(true)
                            }}
                            className="dropdown-item text-red-600 w-full"
                          >
                            <HiOutlineTrash className="w-4 h-4" />
                            <span>حذف</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {currentPost.isLocked && (
              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                <HiOutlineLockClosed className="w-5 h-5" />
                <span className="text-sm">هذا المنشور مقفل. لا يمكن إضافة تعليقات جديدة.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card mt-4 p-4">
        <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4">
          التعليقات
        </h3>

        {isAuthenticated && !currentPost.isLocked ? (
          <form onSubmit={handleComment} className="mb-6">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="شارك رأيك..."
              className="input min-h-24 mb-3"
              rows={3}
            />
            <button
              type="submit"
              disabled={!commentText.trim()}
              className="btn btn-primary"
            >
              تعليق
            </button>
          </form>
        ) : !isAuthenticated ? (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl text-center">
            <p className="text-gray-500 mb-3">سجل دخولك للتعليق</p>
            <Link to="/login" className="btn btn-primary">
              تسجيل الدخول
            </Link>
          </div>
        ) : null}

        {commentsLoading ? (
          <Loading type="spinner" className="py-8" />
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            لا توجد تعليقات بعد. كن أول من يعلق!
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <Comment
                key={comment._id}
                comment={comment}
                postId={id}
                communityId={currentPost.community._id}
              />
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="حذف المنشور"
        size="sm"
      >
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            هل أنت متأكد من حذف هذا المنشور؟ لا يمكنك التراجع عن هذا الإجراء.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              className="btn btn-danger flex-1"
            >
              حذف
            </button>
            <button
              onClick={() => setShowDeleteModal(false)}
              className="btn btn-ghost flex-1"
            >
              إلغاء
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
