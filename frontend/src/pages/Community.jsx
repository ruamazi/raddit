import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useCommunitiesStore } from '../stores/communitiesStore'
import { usePostsStore } from '../stores/postsStore'
import { useAuthStore } from '../stores/authStore'
import PostCard from '../components/PostCard'
import Loading from '../components/Loading'
import Modal from '../components/Modal'
import { formatNumber, formatRelativeTime } from '../utils/helpers'
import {
  HiOutlineUserGroup,
  HiOutlineCalendar,
  HiOutlineCog,
  HiOutlinePlus,
  HiOutlineShieldCheck
} from 'react-icons/hi'
import toast from 'react-hot-toast'

export default function Community() {
  const { name } = useParams()
  const { currentCommunity, fetchCommunity, joinCommunity, isLoading: communityLoading } = useCommunitiesStore()
  const { posts, fetchPosts, isLoading: postsLoading, hasMore, sort, setSort } = usePostsStore()
  const { user, isAuthenticated } = useAuthStore()
  const [showRules, setShowRules] = useState(false)

  useEffect(() => {
    fetchCommunity(name)
  }, [name])

  useEffect(() => {
    if (currentCommunity?.community) {
      fetchPosts({ community: name })
    }
  }, [currentCommunity?.community, sort])

  const handleJoin = async () => {
    if (!isAuthenticated) {
      toast.error('يجب تسجيل الدخول للانضمام')
      return
    }

    try {
      await joinCommunity(name)
      toast.success(currentCommunity?.isMember ? 'تم مغادرة المجتمع' : 'تم الانضمام للمجتمع')
    } catch (error) {
      toast.error(error.response?.data?.message || 'خطأ في الانضمام')
    }
  }

  if (communityLoading && !currentCommunity) {
    return <Loading type="skeleton" />
  }

  if (!currentCommunity?.community) {
    return (
      <div className="card p-8 text-center">
        <h2 className="text-xl font-bold mb-2">المجتمع غير موجود</h2>
        <p className="text-gray-500 mb-4">لم يتم العثور على هذا المجتمع</p>
        <Link to="/" className="btn btn-primary">
          العودة للرئيسية
        </Link>
      </div>
    )
  }

  const community = currentCommunity.community
  const isMember = currentCommunity.isMember
  const isModerator = currentCommunity.isModerator

  return (
    <div>
      <div className="card overflow-hidden mb-4">
        {community.banner ? (
          <div 
            className="h-32 bg-cover bg-center"
            style={{ backgroundImage: `url(${community.banner})` }}
          />
        ) : (
          <div className="h-32 bg-gradient-to-r from-primary-600 to-purple-600" />
        )}
        
        <div className="p-4">
          <div className="flex items-start gap-4 -mt-10">
            <div className="w-20 h-20 rounded-2xl bg-white dark:bg-gray-800 p-1 shadow-lg">
              {community.icon ? (
                <img 
                  src={community.icon} 
                  alt={community.displayName}
                  className="w-full h-full rounded-xl object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-3xl font-bold text-primary-600">
                  {community.displayName[0]}
                </div>
              )}
            </div>
            
            <div className="flex-1 pt-12">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {community.displayName}
                  </h1>
                  <p className="text-gray-500">c/{community.name}</p>
                </div>
                
                <div className="flex gap-2">
                  {isModerator && (
                    <Link 
                      to={`/c/${community.name}/settings`}
                      className="btn btn-ghost"
                    >
                      <HiOutlineCog className="w-5 h-5" />
                    </Link>
                  )}
                  
                  {isAuthenticated ? (
                    isModerator ? (
                      <Link 
                        to={`/c/${community.name}/create`}
                        className="btn btn-primary"
                      >
                        <HiOutlinePlus className="w-5 h-5" />
                        <span>منشور جديد</span>
                      </Link>
                    ) : (
                      <button
                        onClick={handleJoin}
                        className={`btn ${isMember ? 'btn-secondary' : 'btn-primary'}`}
                      >
                        {isMember ? 'مغادرة' : 'انضمام'}
                      </button>
                    )
                  ) : (
                    <Link to="/login" className="btn btn-primary">
                      انضمام
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>

          <p className="mt-4 text-gray-700 dark:text-gray-300">
            {community.description}
          </p>

          <div className="flex items-center gap-6 mt-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <HiOutlineUserGroup className="w-5 h-5" />
              <span>{formatNumber(community.memberCount)} عضو</span>
            </div>
            <div className="flex items-center gap-1">
              <HiOutlineCalendar className="w-5 h-5" />
              <span>تأسس {formatRelativeTime(community.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {isMember && (
            <Link
              to={`/c/${community.name}/create`}
              className="card p-4 flex items-center gap-4"
            >
              <img
                src={user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.username}`}
                alt={user?.username}
                className="w-10 h-10 rounded-full"
              />
              <input
                type="text"
                placeholder="أنشئ منشوراً..."
                className="input flex-1"
                disabled
              />
              <HiOutlinePlus className="w-6 h-6 text-gray-400" />
            </Link>
          )}

          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {['hot', 'new', 'top'].map((sortOption) => (
              <button
                key={sortOption}
                onClick={() => setSort(sortOption)}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  sort === sortOption
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {sortOption === 'hot' ? 'الأكثر رواجاً' : 
                 sortOption === 'new' ? 'الأحدث' : 'الأكثر تصويتاً'}
              </button>
            ))}
          </div>

          {postsLoading && posts.length === 0 ? (
            <Loading type="posts" />
          ) : posts.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-gray-500 mb-4">لا توجد منشورات بعد</p>
              {isMember && (
                <Link to={`/c/${community.name}/create`} className="btn btn-primary">
                  كن أول من ينشر
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard key={post._id} post={post} showCommunity={false} />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="card p-4">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-3">
              عن المجتمع
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {community.description}
            </p>
            
            {community.type !== 'public' && (
              <div className="badge badge-warning mb-4">
                {community.type === 'private' ? 'خاص' : 'مقيد'}
              </div>
            )}

            {community.isNSFW && (
              <div className="badge badge-danger mb-4">+18</div>
            )}
          </div>

          {community.rules?.length > 0 && (
            <div className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900 dark:text-gray-100">
                  قواعد المجتمع
                </h3>
                <button 
                  onClick={() => setShowRules(true)}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  عرض الكل
                </button>
              </div>
              <ol className="space-y-2">
                {community.rules.slice(0, 3).map((rule, index) => (
                  <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex gap-2">
                    <span className="font-medium">{index + 1}.</span>
                    <span>{rule.title}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {community.moderators?.length > 0 && (
            <div className="card p-4">
              <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-3">
                المشرفون
              </h3>
              <div className="space-y-2">
                {community.moderators.slice(0, 5).map((mod) => (
                  <Link
                    key={mod.user._id}
                    to={`/u/${mod.user.username}`}
                    className="flex items-center gap-2 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <img
                      src={mod.user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${mod.user.username}`}
                      alt={mod.user.username}
                      className="w-8 h-8 rounded-full"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{mod.user.username}</div>
                      <div className="text-xs text-gray-500">
                        {mod.role === 'owner' ? 'المالك' : 
                         mod.role === 'admin' ? 'مدير' : 'مشرف'}
                      </div>
                    </div>
                    <HiOutlineShieldCheck className="w-4 h-4 text-primary-600" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showRules}
        onClose={() => setShowRules(false)}
        title="قواعد المجتمع"
      >
        <ol className="space-y-4">
          {community.rules?.map((rule, index) => (
            <li key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <div className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                {index + 1}. {rule.title}
              </div>
              {rule.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {rule.description}
                </p>
              )}
            </li>
          ))}
        </ol>
      </Modal>
    </div>
  )
}
