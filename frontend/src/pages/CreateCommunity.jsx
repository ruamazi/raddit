import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCommunitiesStore } from '../stores/communitiesStore'
import { useAuthStore } from '../stores/authStore'
import Loading from '../components/Loading'
import toast from 'react-hot-toast'

export default function CreateCommunity() {
  const { createCommunity } = useCommunitiesStore()
  const { isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    type: 'public'
  })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.name) {
      newErrors.name = 'اسم المجتمع مطلوب'
    } else if (formData.name.length < 3) {
      newErrors.name = 'اسم المجتمع يجب أن يكون 3 أحرف على الأقل'
    } else if (!/^[a-zA-Z0-9_\u0600-\u06FF]+$/.test(formData.name)) {
      newErrors.name = 'اسم المجتمع يمكن أن يحتوي على أحرف وأرقام فقط'
    }
    
    if (!formData.displayName) {
      newErrors.displayName = 'اسم العرض مطلوب'
    }
    
    if (!formData.description) {
      newErrors.description = 'الوصف مطلوب'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsLoading(true)
    
    try {
      const community = await createCommunity(formData)
      toast.success('تم إنشاء المجتمع بنجاح')
      navigate(`/c/${community.name}`)
    } catch (error) {
      const message = error.response?.data?.message || 'خطأ في إنشاء المجتمع'
      toast.error(message)
      if (error.response?.data?.errors) {
        const fieldErrors = {}
        error.response.data.errors.forEach(err => {
          fieldErrors[err.param] = err.msg
        })
        setErrors(fieldErrors)
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (!isAuthenticated) {
    navigate('/login')
    return null
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          إنشاء مجتمع جديد
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="label">
              اسم المجتمع
            </label>
            <div className="relative">
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">c/</span>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="اسم_المجتمع"
                className={`input pr-10 ${errors.name ? 'input-error' : ''}`}
                dir="ltr"
              />
            </div>
            {errors.name && (
              <p className="text-sm text-red-500 mt-1">{errors.name}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              يجب أن يكون فريداً ويمكن أن يحتوي على أحرف وأرقام وشرطات سفلية فقط
            </p>
          </div>

          <div>
            <label htmlFor="displayName" className="label">
              اسم العرض
            </label>
            <input
              id="displayName"
              name="displayName"
              type="text"
              value={formData.displayName}
              onChange={handleChange}
              placeholder="اسم المجتمع"
              className={`input ${errors.displayName ? 'input-error' : ''}`}
            />
            {errors.displayName && (
              <p className="text-sm text-red-500 mt-1">{errors.displayName}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="label">
              الوصف
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="صف مجتمعك بإيجاز..."
              className={`input ${errors.description ? 'input-error' : ''}`}
              rows={4}
            />
            {errors.description && (
              <p className="text-sm text-red-500 mt-1">{errors.description}</p>
            )}
            <div className="text-xs text-gray-500 mt-1 text-left">
              {formData.description.length}/500
            </div>
          </div>

          <div>
            <label className="label">نوع المجتمع</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'public', label: 'عام', desc: '任何人都可以查看和加入' },
                { value: 'restricted', label: 'مقيد', desc: 'الجميع يمكنه المشاهدة، فقط المعتمدون يمكنهم النشر' },
                { value: 'private', label: 'خاص', desc: 'فقط الأعضاء يمكنهم المشاهدة والنشر' }
              ].map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: type.value }))}
                  className={`p-4 rounded-xl border-2 transition-all text-center ${
                    formData.type === type.value
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="font-medium">{type.label}</div>
                  <div className="text-xs text-gray-500 mt-1">{type.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary"
            >
              {isLoading ? <Loading type="spinner" size="sm" /> : 'إنشاء المجتمع'}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn btn-ghost"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
