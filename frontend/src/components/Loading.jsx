export default function Loading({ type = 'spinner', size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }

  if (type === 'spinner') {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div 
          className={`${sizeClasses[size]} border-4 border-gray-200 dark:border-gray-700 border-t-primary-500 rounded-full animate-spin`}
        />
      </div>
    )
  }

  if (type === 'dots') {
    return (
      <div className={`flex items-center justify-center gap-1 ${className}`}>
        <div className={`${sizeClasses[size].split(' ')[0]} bg-primary-500 rounded-full animate-bounce`} style={{ animationDelay: '0ms' }} />
        <div className={`${sizeClasses[size].split(' ')[0]} bg-primary-500 rounded-full animate-bounce`} style={{ animationDelay: '150ms' }} />
        <div className={`${sizeClasses[size].split(' ')[0]} bg-primary-500 rounded-full animate-bounce`} style={{ animationDelay: '300ms' }} />
      </div>
    )
  }

  if (type === 'skeleton') {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center gap-4">
          <div className="skeleton-avatar" />
          <div className="flex-1">
            <div className="skeleton-text w-1/3 mb-2" />
            <div className="skeleton-text w-1/2" />
          </div>
        </div>
        <div className="skeleton-card" />
        <div className="flex gap-4">
          <div className="skeleton-text w-20" />
          <div className="skeleton-text w-20" />
          <div className="skeleton-text w-20" />
        </div>
      </div>
    )
  }

  if (type === 'posts') {
    return (
      <div className={`space-y-4 ${className}`}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="card p-4 flex gap-4">
            <div className="flex flex-col items-center gap-1 w-10">
              <div className="skeleton w-8 h-8 rounded-full" />
              <div className="skeleton w-6 h-4" />
              <div className="skeleton w-8 h-8 rounded-full" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="skeleton w-5 h-5 rounded-full" />
                <div className="skeleton w-24 h-4" />
                <div className="skeleton w-16 h-4" />
              </div>
              <div className="skeleton h-6 w-3/4 mb-2" />
              <div className="skeleton h-20 w-full mb-2" />
              <div className="flex gap-4">
                <div className="skeleton w-20 h-4" />
                <div className="skeleton w-20 h-4" />
                <div className="skeleton w-20 h-4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return null
}
