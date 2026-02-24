import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import PostCard from '../components/PostCard'
import Loading from '../components/Loading'
import Modal from '../components/Modal'
import api from '../services/api'
import { formatNumber, formatRelativeTime } from '../utils/helpers'
import {
  HiOutlineCake,
  HiOutlineLocationMarker,
  HiOutlineLink,
  HiUserAdd,
  HiUserRemove,
  HiOutlineChat,
  HiOutlineCog
} from 'react-icons/hi'
import toast from 'react-hot-toast'

export default function Profile() {
  const { username } = useParams()
  const { user: currentUser, isAuthenticated } = useAuthStore()
  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [comments, setComments] = useState([])
  const [activeTab, setActiveTab] = useState('posts')
  const [isLoading, setIsLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)
  const [showFollowers, setShowFollowers] = useState(false)
  const [showFollowing, setShowFollowing] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [username])

  const fetchProfile = async () => {
    setIsLoading(true)
    try {
      const response = await api.get(`/users/profile/${username}`)
      setProfile(response.data.data.user)
      setPosts(response.data.data.posts)
      setComments(response.data.data.comments)
      setIsFollowing(response.data.data.isFollowing)
    } catch (error) {
      toast.error('خطأ في جلب الملف الشخصي')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFollow = async () => {
    if (!isAuthenticated) {
      toast.error('يجب تسجيل الدخول للمتابعة')
      return
    }

    try {
      await api.post(`/users/follow/${profile._id}`)
      setIsFollowing(!isFollowing)
      toast.success(isFollowing ? 'تم إلغاء المتابعة' : 'تم المتابعة')
    } catch (error) {
      toast.error(error.response?.data?.message || 'خطأ في المتابعة')
    }
  }

  if (isLoading) {
    return <Loading type="skeleton" />
  }

  if (!profile) {
    return (
      <div className="card p-8 text-center">
        <h2 className="text-xl font-bold mb-2">المستخدم غير موجود</h2>
        <Link to="/" className="btn btn-primary mt-4">
          العودة للرئيسية
        </Link>
      </div>
    )
  }

  const isOwner = currentUser?._id === profile._id

  return (
    <div>
      <div className="card overflow-hidden mb-4">
        {profile.banner ? (
          <div 
            className="h-32 bg-cover bg-center"
            style={{ backgroundImage: `url(${profile.banner})` }}
          />
        ) : (
          <div className="h-32 bg-gradient-to-r from-primary-600 to-purple-600" />
        )}

        <div className="p-6">
          <div className="flex items-start gap-6 -mt-12">
            <img
              src={profile.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${profile.username}`}
              alt={profile.username}
              className="w-24 h-24 rounded-2xl border-4 border-white dark:border-gray-900 bg-white dark:bg-gray-800"
            />

            <div className="flex-1 pt-14">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {profile.displayName || profile.username}
                  </h1>
                  <p className="text-gray-500">u/{profile.username}</p>
                </div>

                <div className="flex gap-2">
                  {isOwner ? (
                    <Link to="/settings" className="btn btn-secondary">
                      <HiOutlineCog className="w-5 h-5" />
                      <span>تعديل الملف</span>
                    </Link>
                  ) : (
                    <>
                      <button
                        onClick={handleFollow}
                        className={`btn ${isFollowing ? 'btn-secondary' : 'btn-primary'}`}
                      >
                        {isFollowing ? (
                           <>
                             <HiUserRemove className="w-5 h-5" />
                             <span>إلغاء المتابعة</span>
                           </>
                         ) : (
                           <>
                             <HiUserAdd className="w-5 h-5" />
                             <span>متابعة</span>
                           </>
                         )}
                      </button>
                      <Link 
                        to={`/messages/${profile._id}`}
                        className="btn btn-secondary"
                      >
                        <HiOutlineChat className="w-5 h-5" />
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {profile.bio && (
            <p className="mt-4 text-gray-700 dark:text-gray-300">
              {profile.bio}
            </p>
          )}

          <div className="flex items-center gap-6 mt-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <HiOutlineCake className="w-5 h-5" />
              <span>انضم {formatRelativeTime(profile.cakeDay)}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {formatNumber(profile.karma)}
              </span>
              <span>كارما</span>
            </div>
          </div>

          <div className="flex items-center gap-6 mt-4">
            <button
              onClick={() => setShowFollowers(true)}
              className="text-sm hover:underline"
            >
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {formatNumber(profile.followers?.length || 0)}
              </span>
              <span className="text-gray-500 mr-1">متابع</span>
            </button>
            <button
              onClick={() => setShowFollowing(true)}
              className="text-sm hover:underline"
            >
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {formatNumber(profile.following?.length || 0)}
              </span>
              <span className="text-gray-500 mr-1">يتابع</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('posts')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'posts'
              ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          المنشورات
        </button>
        <button
          onClick={() => setActiveTab('comments')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'comments'
              ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          التعليقات
        </button>
      </div>

      {activeTab === 'posts' ? (
        posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post._id} post={post} />
            ))}
          </div>
        ) : (
          <div className="card p-8 text-center">
            <p className="text-gray-500">لا توجد منشورات</p>
          </div>
        )
      ) : (
        comments.length > 0 ? (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment._id} className="card p-4">
                <Link 
                  to={`/post/${comment.post?._id}`}
                  className="text-sm text-gray-500 mb-2 block"
                >
                  في: {comment.post?.title}
                </Link>
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  {comment.content}
                </p>
                <div className="text-xs text-gray-500">
                  {formatRelativeTime(comment.createdAt)} • {formatNumber(comment.voteScore)} نقاط
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card p-8 text-center">
            <p className="text-gray-500">لا توجد تعليقات</p>
          </div>
        )
      )}

      <Modal
        isOpen={showFollowers}
        onClose={() => setShowFollowers(false)}
        title="المتابعون"
      >
        <div className="space-y-2">
          {profile.followers?.length > 0 ? (
            profile.followers.map((follower) => (
              <Link
                key={follower._id}
                to={`/u/${follower.username}`}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => setShowFollowers(false)}
              >
                <img
                  src={follower.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${follower.username}`}
                  alt={follower.username}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <div className="font-medium">{follower.displayName || follower.username}</div>
                  <div className="text-sm text-gray-500">u/{follower.username}</div>
                </div>
              </Link>
            ))
          ) : (
            <p className="text-center text-gray-500 py-4">لا يوجد متابعون</p>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={showFollowing}
        onClose={() => setShowFollowing(false)}
        title="المتابَعون"
      >
        <div className="space-y-2">
          {profile.following?.length > 0 ? (
            profile.following.map((following) => (
              <Link
                key={following._id}
                to={`/u/${following.username}`}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => setShowFollowing(false)}
              >
                <img
                  src={following.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${following.username}`}
                  alt={following.username}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <div className="font-medium">{following.displayName || following.username}</div>
                  <div className="text-sm text-gray-500">u/{following.username}</div>
                </div>
              </Link>
            ))
          ) : (
            <p className="text-center text-gray-500 py-4">لا يوجد متابَعون</p>
          )}
        </div>
      </Modal>
    </div>
  )
}
