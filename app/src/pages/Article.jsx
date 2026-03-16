import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PublicLayout from '../components/PublicLayout'
import { articles } from '../data/mock'

function fmtNum(n) {
  if (n >= 1000) return (Math.round(n / 100) / 10) + 'k'
  return String(n)
}

function renderBlock(block, i) {
  switch (block.type) {
    case 'h2':
      return <h2 key={i}>{block.text}</h2>
    case 'h3':
      return <h3 key={i}>{block.text}</h3>
    case 'p':
      return <p key={i}>{block.text}</p>
    case 'ul':
      return <ul key={i}>{block.items.map((it, j) => <li key={j}>{it}</li>)}</ul>
    case 'ol':
      return <ol key={i}>{block.items.map((it, j) => <li key={j}>{it}</li>)}</ol>
    case 'note':
      return <div key={i} className="content-note" dangerouslySetInnerHTML={{ __html: block.html }} />
    case 'highlight':
      return <div key={i} className="content-highlight" dangerouslySetInnerHTML={{ __html: block.html }} />
    case 'key-points':
      return (
        <div key={i} className="key-points">
          <div className="key-points-title">{block.title}</div>
          <ul className="key-points-list">
            {block.items.map((it, j) => <li key={j}>{it}</li>)}
          </ul>
        </div>
      )
    default:
      return null
  }
}

function isMyArticle(articleId) {
  try {
    const ids = JSON.parse(localStorage.getItem('ss_my_article_ids')) || []
    return ids.includes(articleId)
  } catch { return false }
}

function ConfirmDeleteModal({ open, onConfirm, onCancel }) {
  if (!open) return null
  return (
    <div className="acc-confirm-overlay" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="acc-confirm-modal">
        <div className="acc-confirm-icon">
          <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
            <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
          </svg>
        </div>
        <div className="acc-confirm-title">Удалить статью?</div>
        <div className="acc-confirm-desc">Статья будет безвозвратно удалена из вашего профиля и ленты.</div>
        <div className="acc-confirm-actions">
          <button className="acc-confirm-cancel" onClick={onCancel}>Отмена</button>
          <button className="acc-confirm-delete" onClick={onConfirm}>Удалить</button>
        </div>
      </div>
    </div>
  )
}

export default function Article() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [liked, setLiked] = useState(false)
  const [disliked, setDisliked] = useState(false)
  const [following, setFollowing] = useState(false)
  const [commentSort, setCommentSort] = useState('new')
  const [commentInput, setCommentInput] = useState('')
  const [likedComments, setLikedComments] = useState(new Set())
  const [dislikedComments, setDislikedComments] = useState(new Set())
  const [showAll, setShowAll] = useState(false)
  const [toast, setToast] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const isMine = isMyArticle(id)

  const article = articles.find(a => a.id === id)

  if (!article) {
    return (
      <PublicLayout>
        <main className="article-main">
          <div className="article-not-found">
            <div className="article-nf-icon">
              <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
                <rect x="14" y="10" width="52" height="66" rx="7" fill="var(--surface)" stroke="var(--border)" strokeWidth="1.5"/>
                <rect x="26" y="26" width="28" height="3" rx="1.5" fill="var(--border)"/>
                <rect x="26" y="35" width="20" height="3" rx="1.5" fill="var(--border)"/>
                <rect x="26" y="44" width="24" height="3" rx="1.5" fill="var(--border)"/>
                <rect x="26" y="53" width="16" height="3" rx="1.5" fill="var(--border)"/>
                <circle cx="72" cy="72" r="20" fill="var(--bg)" stroke="var(--border)" strokeWidth="1.5"/>
                <path d="M64 64l16 16M80 64L64 80" stroke="var(--text-3)" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="article-nf-title">Статья не найдена</div>
            <div className="article-nf-desc">Возможно, она была удалена или вы перешли по неверной ссылке</div>
            <div className="article-nf-actions">
              <button className="btn-secondary" onClick={() => navigate(-1)}>
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
                Назад
              </button>
              <button className="btn-primary-action" onClick={() => navigate('/feed')}>
                Перейти в ленту
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            </div>
          </div>
        </main>
      </PublicLayout>
    )
  }

  const isFollowing = following || article.following
  const set = article.setLink

  const sortedComments = [...(article.comments || [])].sort(
    commentSort === 'top' ? (a, b) => b.likes - a.likes : () => 0
  )
  const displayComments = showAll ? sortedComments : sortedComments.slice(0, 2)

  function toggleLike() {
    setLiked(l => { if (!l) setDisliked(false); return !l })
  }
  function toggleDislike() {
    setDisliked(d => { if (!d) setLiked(false); return !d })
  }

  function toggleCommentLike(idx) {
    setLikedComments(prev => {
      const next = new Set(prev)
      next.has(idx) ? next.delete(idx) : next.add(idx)
      return next
    })
    setDislikedComments(prev => { const next = new Set(prev); next.delete(idx); return next })
  }

  function toggleCommentDislike(idx) {
    setDislikedComments(prev => {
      const next = new Set(prev)
      next.has(idx) ? next.delete(idx) : next.add(idx)
      return next
    })
    setLikedComments(prev => { const next = new Set(prev); next.delete(idx); return next })
  }

  function showToastMsg(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 2200)
  }

  function handleSubmitComment(e) {
    e.preventDefault()
    if (!commentInput.trim()) return
    setCommentInput('')
    showToastMsg('Комментарий отправлен')
  }

  function handleEditArticle() {
    navigate('/create-article')
    showToastMsg('Открыт редактор статьи')
  }

  function handleDeleteArticle() {
    // Remove from account articles and myArticleIds
    try {
      const articles = JSON.parse(localStorage.getItem('ss_account_articles')) || []
      localStorage.setItem('ss_account_articles', JSON.stringify(articles.filter(a => a.id !== id)))
      const ids = JSON.parse(localStorage.getItem('ss_my_article_ids')) || []
      localStorage.setItem('ss_my_article_ids', JSON.stringify(ids.filter(i => i !== id)))
    } catch {}
    setConfirmDelete(false)
    showToastMsg('Статья удалена')
    setTimeout(() => navigate('/account'), 1500)
  }

  return (
    <PublicLayout>
      <main className="article-main">

        {/* Breadcrumb */}
        <div className="breadcrumb">
          <span className="breadcrumb-item" onClick={() => navigate('/feed')}>Лента</span>
          <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
          <span className="breadcrumb-item">{article.catLabel}</span>
          <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
          <span className="breadcrumb-current">{article.title}</span>
        </div>

        {/* Hero card */}
        <div className="hero-card">
          <div className="hero-body">
            <div className="hero-badges">
              {article.articleType && <span className="article-type-badge">{article.articleType}</span>}
              {article.catLabel && <span className="cat-badge">{article.catLabel}</span>}
            </div>
            <div className="hero-title">{article.title}</div>
            <div className="hero-desc">{article.preview}</div>

            <div className="hero-stats">
              <div className="hstat">
                <div className="hstat-val">
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                  {fmtNum(article.views)}
                </div>
                <div className="hstat-lbl">просмотров</div>
              </div>
              <div className="hstat clickable" onClick={toggleLike}>
                <div className="hstat-val" style={liked ? { color: '#4E8268' } : {}}>
                  <svg width="18" height="18" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
                    <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                  </svg>
                  {article.likes + (liked ? 1 : 0)}
                </div>
                <div className="hstat-lbl">нравится</div>
              </div>
              <div className="hstat clickable" onClick={toggleDislike}>
                <div className="hstat-val" style={disliked ? { color: '#B85555' } : {}}>
                  <svg width="18" height="18" fill={disliked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/>
                    <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
                  </svg>
                  {(article.dislikes || 0) + (disliked ? 1 : 0)}
                </div>
                <div className="hstat-lbl">не нравится</div>
              </div>
              <div className="hstat">
                <div className="hstat-val" style={{ fontSize: '15px', color: 'var(--text-2)' }}>{article.date}</div>
                <div className="hstat-lbl">дата публикации</div>
              </div>
            </div>

            <div className="hero-actions">
              <button className={`btn-liked${liked ? ' liked' : ''}`} onClick={toggleLike}>
                <svg width="14" height="14" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
                  <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                </svg>
                Нравится
              </button>
              <button className={`btn-liked btn-disliked${disliked ? ' disliked' : ''}`} onClick={toggleDislike}>
                <svg width="14" height="14" fill={disliked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/>
                  <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
                </svg>
                Не нравится
              </button>
              <button className="btn-secondary" onClick={() => showToastMsg('Ссылка скопирована')}>
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
                Поделиться
              </button>
              <button className="btn-secondary" onClick={() => showToastMsg('Статья сохранена')}>
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
                </svg>
                Сохранить
              </button>
              {/* UC-31 / UC-33: кнопки для своих статей */}
              {isMine && (
                <>
                  <button className="btn-secondary btn-author-edit" onClick={handleEditArticle}>
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                    </svg>
                    Редактировать
                  </button>
                  <button className="btn-secondary btn-author-delete" onClick={() => setConfirmDelete(true)}>
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                    </svg>
                    Удалить
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Author inside hero */}
          <div className="hero-author">
            <div className="author-avatar" style={{ background: article.authorColor, cursor: 'pointer' }}
              onClick={() => navigate('/author/' + (article.authorId || 'unknown'), { state: {
                name: article.author, ini: article.authorInitials,
                handle: '@' + (article.author || '').toLowerCase().replace(/\s+/g, '_'),
                bio: article.authorBio, color: article.authorColor,
                followers: '—', articles: 0, sets: 0, following: false,
              }})}>
              {article.authorInitials}
            </div>
            <div className="author-info" style={{ cursor: 'pointer' }}
              onClick={() => navigate('/author/' + (article.authorId || 'unknown'), { state: {
                name: article.author, ini: article.authorInitials,
                handle: '@' + (article.author || '').toLowerCase().replace(/\s+/g, '_'),
                bio: article.authorBio, color: article.authorColor,
                followers: '—', articles: 0, sets: 0, following: false,
              }})}>
              <div className="author-name">{article.author}</div>
              {article.authorBio && <div className="author-bio">{article.authorBio}</div>}
              {article.authorSetLink && set && (
                <div className="author-set-link" onClick={() => navigate(`/set/${set.id}`)}>
                  <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                  </svg>
                  {article.authorSetLink}
                </div>
              )}
            </div>
            <button
              className={`btn-follow${isFollowing ? ' following' : ''}`}
              onClick={() => setFollowing(f => !f)}
            >
              {isFollowing ? 'Подписан' : 'Подписаться'}
            </button>
          </div>
        </div>

        {/* Article content */}
        <div className="content-card">
          <div className="content-body">
            {article.content.map((block, i) => renderBlock(block, i))}
          </div>
        </div>

        {/* Products */}
        {article.products && article.products.length > 0 && (
          <div className="products-card">
            <div className="products-title">Продукты из набора</div>
            <div className="products-grid">
              {article.products.map((p, i) => (
                <span key={i} className="product-tag">{p}</span>
              ))}
            </div>
          </div>
        )}

        {/* Linked set as catalog card */}
        {set && (
          <div className="catalog-card" onClick={() => navigate(`/set/${set.id}`)}>
            <div className="card-accent-bar" style={{ background: set.color }} />
            <div className="card-body">
              <div className="card-badges">
                <span className={`source-badge ${set.source}`}>
                  {set.source === 'ss' ? 'SmartSpend' : set.source === 'community' ? 'Сообщество' : 'Моё'}
                </span>
                <span className="base-badge">{set.type === 'base' ? 'Основа' : 'Дополнение'}</span>
              </div>
              <div className="card-title">{set.title}</div>
              <div className="card-desc">{set.desc}</div>
            </div>
            <div className="card-footer">
              <div className="card-amount-left">
                <div className="card-amount">{set.amount.toLocaleString('ru')}&thinsp;₽</div>
                <div className="card-amount-label">{set.amountLabel}</div>
              </div>
              <div className="card-meta-right">
                {set.users != null && (
                  <div className="users-count">
                    <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
                    </svg>
                    {fmtNum(set.users)}
                  </div>
                )}
                {set.added && (
                  <div className="card-date">
                    с {new Date(set.added).toLocaleDateString('ru', { month: 'short', year: 'numeric' })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Comments */}
        {article.comments && article.comments.length > 0 && (
          <div className="section-card">
            <div className="section-header">
              <div className="section-title">
                Комментарии
                <span className="section-count">{article.comments.length}</span>
              </div>
            </div>
            <div className="comments-subheader">
              <div className="csort">
                <button className={`c-sort-btn${commentSort === 'new' ? ' active' : ''}`} onClick={() => setCommentSort('new')}>Новые</button>
                <button className={`c-sort-btn${commentSort === 'top' ? ' active' : ''}`} onClick={() => setCommentSort('top')}>Популярные</button>
              </div>
            </div>
            <div className="comments-list">
              {displayComments.map((c, i) => (
                <div key={i} className="comment-item">
                  <div className="c-avatar">{c.ini}</div>
                  <div className="c-body">
                    <div className="c-header">
                      <span className="c-name">{c.name}</span>
                      <span className="c-date">{c.date}</span>
                    </div>
                    <div className="c-text">{c.text}</div>
                    <div className="c-actions">
                      <button
                        className={`c-like${likedComments.has(i) ? ' liked' : ''}`}
                        onClick={() => toggleCommentLike(i)}
                      >
                        <svg width="11" height="11" fill={likedComments.has(i) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
                          <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                        </svg>
                        {c.likes + (likedComments.has(i) ? 1 : 0)}
                      </button>
                      <button
                        className={`c-like c-dislike${dislikedComments.has(i) ? ' disliked' : ''}`}
                        onClick={() => toggleCommentDislike(i)}
                      >
                        <svg width="11" height="11" fill={dislikedComments.has(i) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/>
                          <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
                        </svg>
                        {(c.dislikes || 0) + (dislikedComments.has(i) ? 1 : 0)}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {!showAll && article.comments.length > 2 && (
              <div className="show-more-row">
                <button className="btn-show" onClick={() => setShowAll(true)}>
                  Показать ещё {article.comments.length - 2}
                  <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
              </div>
            )}
            <form className="comments-input" onSubmit={handleSubmitComment}>
              <input
                className="c-input"
                placeholder="Написать комментарий..."
                value={commentInput}
                onChange={e => setCommentInput(e.target.value)}
              />
              <button type="submit" className="c-submit">Отправить</button>
            </form>
          </div>
        )}

        {/* Toast */}
        <div className={`toast${toast ? ' show' : ''}`}>
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          {toast}
        </div>

      </main>

      <ConfirmDeleteModal
        open={confirmDelete}
        onConfirm={handleDeleteArticle}
        onCancel={() => setConfirmDelete(false)}
      />

    </PublicLayout>
  )
}
