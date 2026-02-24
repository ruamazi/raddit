import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useDebounce } from '../hooks/useDebounce'
import api from '../services/api'
import PostCard from '../components/PostCard'
import Loading from '../components/Loading'
import { HiOutlineSearch, HiOutlineUserGroup, HiOutlineUser, HiOutlineX } from 'react-icons/hi'
import toast from 'react-hot-toast'

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [type, setType] = useState(searchParams.get('type') || 'all')
  const [results, setResults] = useState({ posts: [], communities: [], users: [] })
  const [isLoading, setIsLoading] = useState(false)
  const [suggestions, setSuggestions] = useState({ communities: [], users: [] })
  const [showSuggestions, setShowSuggestions] = useState(false)
  
  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    if (debouncedQuery && debouncedQuery.length >= 2) {
      search()
    }
  }, [debouncedQuery, type])

  useEffect(() => {
    if (debouncedQuery && debouncedQuery.length >= 2) {
      fetchSuggestions()
    } else {
      setSuggestions({ communities: [], users: [] })
    }
  }, [debouncedQuery])

  const search = async () => {
    setIsLoading(true)
    try {
      const response = await api.get('/search', {
        params: { q: debouncedQuery, type }
      })
      setResults(response.data.data)
    } catch (error) {
      toast.error('خطأ في البحث')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSuggestions = async () => {
    try {
      const response = await api.get('/search/suggestions', {
        params: { q: debouncedQuery }
      })
      setSuggestions(response.data.data)
    } catch (error) {
      console.error('Error fetching suggestions:', error)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (query.trim()) {
      setSearchParams({ q: query, type })
      setShowSuggestions(false)
    }
  }

  const handleClear = () => {
    setQuery('')
    setResults({ posts: [], communities: [], users: [] })
    setSearchParams({})
  }

  const typeOptions = [
    { value: 'all', label: 'الكل' },
    { value: 'posts', label: 'المنشورات' },
    { value: 'communities', label: 'المجتمعات' },
    { value: 'users', label: 'المستخدمون' },
  ]

  const hasResults = results.posts.length > 0 || results.communities.length > 0 || results.users.length > 0

  return (
    <div>
      <div className="card p-4 mb-4">
        <form onSubmit={handleSubmit} className="relative">
          <HiOutlineSearch className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setShowSuggestions(true)
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="ابحث في المنشورات والمجتمعات والمستخدمين..."
            className="input pr-12 pl-12"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <HiOutlineX className="w-5 h-5" />
            </button>
          )}

          {showSuggestions && (suggestions.communities.length > 0 || suggestions.users.length > 0) && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden z-10">
              {suggestions.communities.length > 0 && (
                <div className="p-2">
                  <div className="text-xs text-gray-500 px-3 py-1">المجتمعات</div>
                  {suggestions.communities.map((community) => (
                    <Link
                      key={community._id}
                      to={`/c/${community.name}`}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                      onClick={() => setShowSuggestions(false)}
                    >
                      {community.icon ? (
                        <img src={community.icon} alt="" className="w-8 h-8 rounded-full" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 font-bold text-sm">
                          {community.displayName[0]}
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{community.displayName}</div>
                        <div className="text-xs text-gray-500">c/{community.name}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              {suggestions.users.length > 0 && (
                <div className="p-2 border-t border-gray-100 dark:border-gray-700">
                  <div className="text-xs text-gray-500 px-3 py-1">المستخدمون</div>
                  {suggestions.users.map((user) => (
                    <Link
                      key={user._id}
                      to={`/u/${user.username}`}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                      onClick={() => setShowSuggestions(false)}
                    >
                      <img
                        src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.username}`}
                        alt={user.username}
                        className="w-8 h-8 rounded-full"
                      />
                      <div>
                        <div className="font-medium">{user.displayName || user.username}</div>
                        <div className="text-xs text-gray-500">u/{user.username}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </form>

        <div className="flex gap-2 mt-4">
          {typeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setType(option.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                type === option.value
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600'
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <Loading type="posts" />
      ) : query && !hasResults ? (
        <div className="card p-8 text-center">
          <HiOutlineSearch className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium mb-2">لا توجد نتائج</h3>
          <p className="text-gray-500">لم يتم العثور على نتائج لـ "{query}"</p>
        </div>
      ) : (
        <div className="space-y-6">
          {(type === 'all' || type === 'communities') && results.communities.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <HiOutlineUserGroup className="w-5 h-5" />
                المجتمعات
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.communities.map((community) => (
                  <Link
                    key={community._id}
                    to={`/c/${community.name}`}
                    className="card p-4 flex items-center gap-4"
                  >
                    {community.icon ? (
                      <img src={community.icon} alt="" className="w-12 h-12 rounded-full" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 font-bold">
                        {community.displayName[0]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                        {community.displayName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {community.memberCount} عضو
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {(type === 'all' || type === 'users') && results.users.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <HiOutlineUser className="w-5 h-5" />
                المستخدمون
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.users.map((user) => (
                  <Link
                    key={user._id}
                    to={`/u/${user.username}`}
                    className="card p-4 flex items-center gap-4"
                  >
                    <img
                      src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.username}`}
                      alt={user.username}
                      className="w-12 h-12 rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                        {user.displayName || user.username}
                      </div>
                      <div className="text-sm text-gray-500">
                        u/{user.username} • {user.karma} كارما
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {(type === 'all' || type === 'posts') && results.posts.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
                المنشورات
              </h2>
              <div className="space-y-4">
                {results.posts.map((post) => (
                  <PostCard key={post._id} post={post} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
