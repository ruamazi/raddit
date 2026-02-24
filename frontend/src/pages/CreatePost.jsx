import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useCommunitiesStore } from '../stores/communitiesStore'
import { usePostsStore } from '../stores/postsStore'
import { useAuthStore } from '../stores/authStore'
import Loading from '../components/Loading'
import {
  HiOutlinePhotograph,
  HiOutlineLink,
  HiOutlineChatAlt,
  HiOutlineDocumentText,
  HiOutlineX,
  HiOutlinePlus
} from 'react-icons/hi'
import toast from 'react-hot-toast'

export default function CreatePost() {
  const { name } = useParams()
  const navigate = useNavigate()
  const { currentCommunity, fetchCommunity } = useCommunitiesStore()
  const { createPost } = usePostsStore()
  const { user, isAuthenticated } = useAuthStore()
  
  const [postType, setPostType] = useState('text')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [imageUrls, setImageUrls] = useState([''])
  const [linkUrl, setLinkUrl] = useState('')
  const [pollOptions, setPollOptions] = useState(['', ''])
  const [isNSFW, setIsNSFW] = useState(false)
  const [isSpoiler, setIsSpoiler] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFlair, setSelectedFlair] = useState(null)

  useEffect(() => {
    if (name) {
      fetchCommunity(name)
    }
  }, [name])

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
    }
  }, [isAuthenticated])

  const addImageUrl = () => {
    if (imageUrls.length < 5) {
      setImageUrls([...imageUrls, ''])
    }
  }

  const updateImageUrl = (index, value) => {
    const newUrls = [...imageUrls]
    newUrls[index] = value
    setImageUrls(newUrls)
  }

  const removeImageUrl = (index) => {
    if (imageUrls.length > 1) {
      setImageUrls(imageUrls.filter((_, i) => i !== index))
    } else {
      setImageUrls([''])
    }
  }

  const addPollOption = () => {
    if (pollOptions.length < 6) {
      setPollOptions([...pollOptions, ''])
    }
  }

  const updatePollOption = (index, value) => {
    const newOptions = [...pollOptions]
    newOptions[index] = value
    setPollOptions(newOptions)
  }

  const removePollOption = (index) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!title.trim()) {
      toast.error('عنوان المنشور مطلوب')
      return
    }

    const validUrls = imageUrls.filter(url => url.trim() !== '')
    if (postType === 'image' && validUrls.length === 0) {
      toast.error('يجب إضافة رابط صورة واحد على الأقل')
      return
    }

    if (postType === 'link' && !linkUrl.trim()) {
      toast.error('رابط المنشور مطلوب')
      return
    }

    const validPollOptions = pollOptions.filter(opt => opt.trim() !== '')
    if (postType === 'poll' && validPollOptions.length < 2) {
      toast.error('يجب إضافة خيارين على الأقل للاستطلاع')
      return
    }

    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append('title', title)
      formData.append('type', postType)
      formData.append('community', currentCommunity.community._id)
      
      if (content) formData.append('content', content)
      if (isNSFW) formData.append('isNSFW', 'true')
      if (isSpoiler) formData.append('isSpoiler', 'true')
      if (selectedFlair) formData.append('flair', JSON.stringify(selectedFlair))
      
      if (postType === 'image') {
        const images = validUrls.map(url => ({ url: url.trim() }))
        formData.append('images', JSON.stringify(images))
      }
      
      if (postType === 'link') {
        formData.append('link', JSON.stringify({ url: linkUrl }))
      }

      if (postType === 'poll') {
        const poll = {
          options: validPollOptions.map(text => ({ text, votes: 0 })),
          totalVotes: 0,
          allowMultipleVotes: false
        }
        formData.append('poll', JSON.stringify(poll))
      }

      const post = await createPost(formData)
      toast.success('تم نشر المنشور بنجاح')
      navigate(`/post/${post._id}`)
    } catch (error) {
      toast.error(error.response?.data?.message || 'خطأ في نشر المنشور')
    } finally {
      setIsLoading(false)
    }
  }

  const postTypes = [
    { type: 'text', icon: HiOutlineDocumentText, label: 'نص' },
    { type: 'image', icon: HiOutlinePhotograph, label: 'صورة' },
    { type: 'link', icon: HiOutlineLink, label: 'رابط' },
    { type: 'poll', icon: HiOutlineChatAlt, label: 'استطلاع' },
  ]

  return (
    <div className="max-w-3xl mx-auto">
      <div className="card p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          إنشاء منشور
        </h1>

        {currentCommunity?.community && (
          <div className="flex items-center gap-3 mb-6 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
            {currentCommunity.community.icon ? (
              <img 
                src={currentCommunity.community.icon} 
                alt={currentCommunity.community.displayName}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 font-bold">
                {currentCommunity.community.displayName[0]}
              </div>
            )}
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {currentCommunity.community.displayName}
              </div>
              <div className="text-sm text-gray-500">
                c/{currentCommunity.community.name}
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-6">
          {postTypes.map((type) => (
            <button
              key={type.type}
              onClick={() => setPostType(type.type)}
              disabled={!currentCommunity?.community?.allowedPostTypes?.[type.type]}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                postType === type.type
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600'
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              } ${!currentCommunity?.community?.allowedPostTypes?.[type.type] ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <type.icon className="w-5 h-5" />
              <span>{type.label}</span>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="label">
              العنوان
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="عنوان المنشور"
              className="input"
              maxLength={300}
            />
            <div className="text-xs text-gray-500 mt-1 text-left">
              {title.length}/300
            </div>
          </div>

          {postType === 'text' && (
            <div>
              <label htmlFor="content" className="label">
                المحتوى (اختياري)
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="اكتب محتوى منشورك..."
                className="input min-h-48"
                rows={10}
              />
            </div>
          )}

          {postType === 'image' && (
            <div>
              <label className="label">
                روابط الصور (حد أقصى 5 روابط)
              </label>
              <div className="space-y-3 mb-3">
                {imageUrls.map((url, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => updateImageUrl(index, e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="input flex-1"
                      dir="ltr"
                    />
                    {imageUrls.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeImageUrl(index)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      >
                        <HiOutlineX className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {imageUrls.length < 5 && (
                <button
                  type="button"
                  onClick={addImageUrl}
                  className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
                >
                  <HiOutlinePlus className="w-4 h-4" />
                  <span>إضافة رابط آخر</span>
                </button>
              )}
              {imageUrls.some(url => url.trim()) && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500 mb-2">معاينة:</p>
                  <div className="grid grid-cols-3 gap-3">
                    {imageUrls.filter(url => url.trim()).map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt=""
                          className="w-full h-32 object-cover rounded-xl"
                          onError={(e) => {
                            e.target.style.display = 'none'
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {postType === 'link' && (
            <div>
              <label htmlFor="link" className="label">
                الرابط
              </label>
              <input
                id="link"
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                className="input"
                dir="ltr"
              />
            </div>
          )}

          {postType === 'poll' && (
            <div>
              <label className="label">
                خيارات الاستطلاع (2-6 خيارات)
              </label>
              <div className="space-y-3 mb-3">
                {pollOptions.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updatePollOption(index, e.target.value)}
                      placeholder={`الخيار ${index + 1}`}
                      className="input flex-1"
                    />
                    {pollOptions.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removePollOption(index)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      >
                        <HiOutlineX className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {pollOptions.length < 6 && (
                <button
                  type="button"
                  onClick={addPollOption}
                  className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
                >
                  <HiOutlinePlus className="w-4 h-4" />
                  <span>إضافة خيار آخر</span>
                </button>
              )}
            </div>
          )}

          {currentCommunity?.community?.flairs?.length > 0 && (
            <div>
              <label className="label">
                الوسم (اختياري)
              </label>
              <div className="flex flex-wrap gap-2">
                {currentCommunity.community.flairs.map((flair, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedFlair(selectedFlair === flair ? null : flair)}
                    className={`px-3 py-1 rounded-full text-sm transition-all ${
                      selectedFlair === flair
                        ? 'ring-2 ring-primary-500 ring-offset-2'
                        : ''
                    }`}
                    style={{
                      backgroundColor: flair.color,
                      color: flair.textColor
                    }}
                  >
                    {flair.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isNSFW}
                onChange={(e) => setIsNSFW(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                محتوى للبالغين (+18)
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isSpoiler}
                onChange={(e) => setIsSpoiler(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                سبويلر
              </span>
            </label>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary"
            >
              {isLoading ? <Loading type="spinner" size="sm" /> : 'نشر'}
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
