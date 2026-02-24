import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { usePostsStore } from '../stores/postsStore'
import { useAuthStore } from '../stores/authStore'
import PostCard from '../components/PostCard'
import Loading from '../components/Loading'
import {
  HiOutlineFire,
  HiOutlineClock,
  HiOutlineTrendingUp,
  HiOutlineChartBar
} from 'react-icons/hi'

export default function Home() {
  const { posts, isLoading, fetchPosts, sort, setSort, timeframe, setTimeframe, hasMore, page } = usePostsStore()
  const { isAuthenticated } = useAuthStore()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const sortParam = searchParams.get('sort')
    if (sortParam) {
      setSort(sortParam)
    }
  }, [searchParams])

  useEffect(() => {
    fetchPosts()
  }, [sort, timeframe])

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      fetchPosts({}, true)
    }
  }

  const sortOptions = [
    { value: 'hot', label: 'الأكثر رواجاً', icon: HiOutlineFire },
    { value: 'new', label: 'الأحدث', icon: HiOutlineClock },
    { value: 'top', label: 'الأكثر تصويتاً', icon: HiOutlineTrendingUp },
    { value: 'rising', label: 'الصاعدة', icon: HiOutlineChartBar },
  ]

  const timeframeOptions = [
    { value: 'all', label: 'كل الوقت' },
    { value: 'day', label: 'اليوم' },
    { value: 'week', label: 'هذا الأسبوع' },
    { value: 'month', label: 'هذا الشهر' },
    { value: 'year', label: 'هذه السنة' },
  ]

  return (
    <div>
      {!isAuthenticated && (
        <div className="card p-6 mb-4 bg-gradient-to-r from-primary-600 to-purple-600 text-white">
          <h2 className="text-2xl font-bold mb-2">مرحباً بك في رديت</h2>
          <p className="text-white/90 mb-4">
            منصة عربية للنقاش والمشاركة. انضم إلى المجتمعات وشارك أفكارك مع الآخرين.
          </p>
          <div className="flex gap-3">
            <Link to="/register" className="btn bg-white text-primary-600 hover:bg-gray-100">
              إنشاء حساب
            </Link>
            <Link to="/login" className="btn bg-white/20 text-white hover:bg-white/30">
              تسجيل الدخول
            </Link>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {sortOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setSort(option.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                sort === option.value
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <option.icon className="w-4 h-4" />
              <span>{option.label}</span>
            </button>
          ))}
        </div>

        {(sort === 'top' || sort === 'controversial') && (
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="input w-auto text-sm py-2"
          >
            {timeframeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="space-y-4">
        {isLoading && posts.length === 0 ? (
          <Loading type="posts" />
        ) : posts.length === 0 ? (
          <div className="card p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <HiOutlineFire className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium mb-2">لا توجد منشورات</h3>
            <p className="text-gray-500 mb-4">
              كن أول من ينشر في المجتمع!
            </p>
            {isAuthenticated ? (
              <Link to="/create-community" className="btn btn-primary">
                إنشاء مجتمع
              </Link>
            ) : (
              <Link to="/register" className="btn btn-primary">
                انضم إلينا
              </Link>
            )}
          </div>
        ) : (
          <>
            {posts.map((post) => (
              <PostCard key={post._id} post={post} />
            ))}
            
            {hasMore && (
              <div className="text-center py-4">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoading}
                  className="btn btn-secondary"
                >
                  {isLoading ? (
                    <Loading type="spinner" size="sm" />
                  ) : (
                    'تحميل المزيد'
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
