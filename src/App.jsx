import { useEffect, useMemo, useState } from 'react'
import AddPostModal from './components/AddPostModal'
import Header from './components/Header'
import HexNav from './components/HexNav'
import LoginModal from './components/LoginModal'
import { PostCard, StrategyCard } from './components/PostCard'
import Scrapbook from './components/Scrapbook'
import Sidebar from './components/Sidebar'
import StrategyModal from './components/StrategyModal'
import { TABS } from './constants'
import { store } from './store'

export default function App() {
  const [tab, setTab] = useState('grade2')
  const [filter, setFilter] = useState('all')
  const [posts, setPosts] = useState([])
  const [strategies, setStrategies] = useState([])
  const [isTeacher, setIsTeacher] = useState(false)
  const [modal, setModal] = useState(null) // 'add' | 'login' | 'strategy'
  const [editing, setEditing] = useState(null)
  const [toast, setToast] = useState('')
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const [dbError, setDbError] = useState(false)

  useEffect(() => {
    const onErr = () => setDbError(true)
    const unsubPosts = store.subscribePosts(setPosts, onErr)
    const unsubStrategies = store.subscribeStrategies(setStrategies, onErr)
    const unsubAuth = store.onAuth(setIsTeacher)
    return () => {
      unsubPosts()
      unsubStrategies()
      unsubAuth()
    }
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 3200)
    return () => clearTimeout(t)
  }, [toast])

  const switchTab = (t) => {
    setTab(t)
    setFilter('all')
  }

  const gradePosts = useMemo(
    () => posts.filter((p) => p.grade === tab),
    [posts, tab],
  )

  const visiblePosts = useMemo(
    () =>
      filter === 'all'
        ? gradePosts
        : gradePosts.filter((p) => p.sportCategory === filter),
    [gradePosts, filter],
  )

  const counts = useMemo(() => {
    const map = {}
    for (const p of gradePosts) map[p.sportCategory] = (map[p.sportCategory] || 0) + 1
    return map
  }, [gradePosts])

  const closeModal = () => {
    setModal(null)
    setEditing(null)
  }

  const showToast = (msg) => {
    setToast('')
    requestAnimationFrame(() => setToast(msg))
  }

  async function handlePostSubmit(data, file, onProgress) {
    if (editing) {
      await store.updatePost(editing, data, file, onProgress)
      showToast('تم تعديل المشاركة بنجاح')
    } else {
      await store.addPost(data, file, onProgress)
      showToast('تم نشر مشاركتك بنجاح! 🎉')
    }
    closeModal()
  }

  async function handleStrategySubmit(data, file, onProgress) {
    if (editing) {
      await store.updateStrategy(editing, data, file, onProgress)
      showToast('تم تعديل الاستراتيجية بنجاح')
    } else {
      await store.addStrategy(data, file, onProgress)
      showToast('تمت إضافة الاستراتيجية بنجاح')
    }
    closeModal()
  }

  async function handleLogin(email, password) {
    await store.signIn(email, password)
    setIsTeacher(true)
    closeModal()
    showToast('مرحباً أستاذة بدرية 💖')
  }

  async function handleLogout() {
    await store.signOut()
    setIsTeacher(false)
    showToast('تم تسجيل الخروج')
  }

  async function handleDeletePost(post) {
    if (!isTeacher) return
    if (!window.confirm(`حذف مشاركة "${post.studentName}"؟`)) return
    try {
      await store.deletePost(post)
      showToast('تم حذف المشاركة')
    } catch (err) {
      console.error('[pe-portal] delete failed:', err)
      showToast('تعذر حذف المشاركة — تحققي من الاتصال والقواعد')
    }
  }

  async function handleDeleteStrategy(item) {
    if (!isTeacher) return
    if (!window.confirm(`حذف استراتيجية "${item.title}"؟`)) return
    try {
      await store.deleteStrategy(item)
      showToast('تم حذف الاستراتيجية')
    } catch (err) {
      console.error('[pe-portal] delete failed:', err)
      showToast('تعذر حذف الاستراتيجية — تحققي من الاتصال والقواعد')
    }
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <Header
        isTeacher={isTeacher}
        onLogin={() => setModal('login')}
        onLogout={handleLogout}
      />

      {!bannerDismissed && store.mode === 'demo' && (
        <Banner
          onDismiss={() => setBannerDismissed(true)}
          text={
            <>
              ⚠️ وضع المعاينة — لم يتم ربط Firebase بعد. البيانات تُحفظ محلياً في
              المتصفح. أضيفي إعدادات مشروعك في ملف <code dir="ltr">.env</code>{' '}
              لتفعيل النشر الفوري.
            </>
          }
        />
      )}

      {dbError && (
        <div className="mx-4 mt-4 flex max-w-4xl items-center justify-between gap-3 rounded-2xl bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700 ring-1 ring-rose-200 sm:mx-auto">
          <p>
            ❌ تعذر الاتصال بقاعدة البيانات — تأكدي من إعدادات{' '}
            <code dir="ltr">.env</code> ومن نشر قواعد Firestore
            (firestore.rules). راجعي وحدة التحكم (Console) للتفاصيل.
          </p>
          <button
            onClick={() => setDbError(false)}
            className="shrink-0 rounded-lg bg-rose-100 px-2.5 py-1 text-rose-600 transition hover:bg-rose-200"
          >
            إخفاء
          </button>
        </div>
      )}

      <HexNav active={tab} onChange={switchTab} />

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 pb-16 sm:px-6 lg:grid-cols-[270px_1fr]">
        <Sidebar
          tab={tab}
          filter={filter}
          onFilter={setFilter}
          counts={counts}
          total={tab === 'strategies' ? strategies.length : gradePosts.length}
        />

        <section>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl font-extrabold text-gray-800">
              {TABS[tab].emoji} {TABS[tab].label}
              <span className="mr-2 text-sm font-semibold text-pink-400">
                ({tab === 'strategies' ? strategies.length : visiblePosts.length})
              </span>
            </h2>

            {tab !== 'strategies' ? (
              <button
                onClick={() => setModal('add')}
                className="rounded-2xl bg-gradient-to-l from-pink-400 via-rose-400 to-pink-400 px-6 py-3 font-display text-base font-extrabold text-white shadow-lg shadow-pink-300/60 transition hover:scale-105 hover:shadow-pink-400/50"
              >
                ➕ إضافة مشاركة جديدة
              </button>
            ) : isTeacher ? (
              <button
                onClick={() => setModal('strategy')}
                className="rounded-2xl bg-gradient-to-l from-purple-400 via-fuchsia-400 to-pink-400 px-6 py-3 font-display text-base font-extrabold text-white shadow-lg shadow-purple-300/60 transition hover:scale-105"
              >
                ➕ إضافة استراتيجية
              </button>
            ) : (
              <span className="rounded-2xl bg-purple-50 px-5 py-2.5 text-sm font-bold text-purple-600 ring-1 ring-purple-200">
                🔒 للقراءة فقط — النشر للمعلمة
              </span>
            )}
          </div>

          {tab === 'strategies' ? (
            strategies.length === 0 ? (
              <EmptyState
                icon="🟣"
                title="لا توجد استراتيجيات منشورة بعد"
                subtitle={isTeacher ? 'اضغطي "إضافة استراتيجية" لنشر أول استراتيجية' : 'تابعي هذا القسم لاحقاً'}
              />
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {strategies.map((item) => (
                  <StrategyCard
                    key={item.id}
                    item={item}
                    isTeacher={isTeacher}
                    onEdit={() => {
                      setEditing(item)
                      setModal('strategy')
                    }}
                    onDelete={() => handleDeleteStrategy(item)}
                  />
                ))}
              </div>
            )
          ) : visiblePosts.length === 0 ? (
            <EmptyState
              icon={TABS[tab].emoji}
              title="لا توجد مشاركات هنا بعد"
              subtitle='كوني أول من يشارك! اضغطي "إضافة مشاركة جديدة"'
            />
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {visiblePosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  isTeacher={isTeacher}
                  onEdit={() => {
                    setEditing(post)
                    setModal('add')
                  }}
                  onDelete={() => handleDeletePost(post)}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <Scrapbook />

      <footer className="border-t border-pink-100 bg-white/60 py-6 text-center text-sm font-medium text-pink-400">
        <p>أبحاث ومشاريع التربية البدنية — إشراف الأستاذة بدرية المالكي 💖</p>
      </footer>

      {modal === 'add' && (
        <AddPostModal
          initial={editing}
          defaultGrade={tab === 'strategies' ? 'grade2' : tab}
          onClose={closeModal}
          onSubmit={handlePostSubmit}
        />
      )}
      {modal === 'login' && (
        <LoginModal
          demo={store.mode === 'demo'}
          onClose={closeModal}
          onSubmit={handleLogin}
        />
      )}
      {modal === 'strategy' && (
        <StrategyModal
          initial={editing}
          onClose={closeModal}
          onSubmit={handleStrategySubmit}
        />
      )}

      {toast && (
        <div className="animate-modal-in fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-2xl bg-rose-500 px-6 py-3.5 font-display text-sm font-bold text-white shadow-2xl shadow-pink-300/60">
          {toast}
        </div>
      )}
    </div>
  )
}

function Banner({ text, onDismiss }) {
  return (
    <div className="mx-4 mt-4 flex max-w-4xl items-center justify-between gap-3 rounded-2xl bg-amber-50 px-5 py-3 text-sm font-semibold text-amber-800 ring-1 ring-amber-200 sm:mx-auto">
      <p>{text}</p>
      <button
        onClick={onDismiss}
        className="shrink-0 rounded-lg bg-amber-100 px-2.5 py-1 text-amber-700 transition hover:bg-amber-200"
      >
        إخفاء
      </button>
    </div>
  )
}

function EmptyState({ icon, title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-pink-200 bg-white/50 px-6 py-16 text-center">
      <span className="animate-float p-1 text-5xl leading-[1.3]">{icon}</span>
      <p className="font-display text-lg font-extrabold text-pink-800">{title}</p>
      <p className="text-sm font-medium text-pink-500/80">{subtitle}</p>
    </div>
  )
}
