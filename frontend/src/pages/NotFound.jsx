import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="text-center">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <span className="text-4xl">🔍</span>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          404
        </h1>
        <h2 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-4">
          الصفحة غير موجودة
        </h2>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">
          عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link to="/" className="btn btn-primary">
            العودة للرئيسية
          </Link>
          <Link to="/search" className="btn btn-secondary">
            البحث
          </Link>
        </div>
      </div>
    </div>
  )
}
