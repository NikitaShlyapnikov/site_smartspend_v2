import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { articles } from '../data/mock'

function parseContent(content) {
  return content.split('\n\n').map((para, i) => {
    if (para.startsWith('## ')) return <h2 key={i} className="article-h2">{para.slice(3)}</h2>
    if (para.startsWith('# ')) return <h2 key={i} className="article-h2">{para.slice(2)}</h2>
    if (para.startsWith('> ')) return <blockquote key={i} className="article-blockquote">{para.slice(2)}</blockquote>
    return <p key={i} className="article-para">{para}</p>
  })
}

export default function Article() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)

  const article = articles.find(a => a.id === id)

  if (!article) {
    return (
      <Layout>
        <main className="article-main">
          <div className="empty-state">
            <div className="empty-icon">📄</div>
            <div className="empty-title">Статья не найдена</div>
            <button className="btn-sm" style={{ marginTop: 8 }} onClick={() => navigate('/feed')}>← Лента</button>
          </div>
        </main>
      </Layout>
    )
  }

  return (
    <Layout>
      <main className="article-main">
        {/* Хлебные крошки */}
        <div className="breadcrumb">
          <span className="breadcrumb-item" onClick={() => navigate('/feed')}>Лента</span>
          <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
          <span className="breadcrumb-item breadcrumb-current">Статья</span>
        </div>

        {/* Герой-карточка */}
        <div className="article-hero">
          <div className="article-hero-badges">
            <span className="cat-badge">{article.category}</span>
          </div>
          <h1 className="article-hero-title">{article.title}</h1>
          <p className="article-hero-preview">{article.preview}</p>

          <div className="article-hero-stats">
            <span className="article-stat-item">
              <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
              {article.views.toLocaleString('ru')}
            </span>
            <span className="article-stat-divider" />
            <span className="article-stat-item">
              <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              {article.readTime} чтения
            </span>
            <span className="article-stat-divider" />
            <span className="article-stat-item">{article.date}</span>
            <span style={{ flex: 1 }} />
            <button
              className={`article-like-btn${liked ? ' liked' : ''}`}
              onClick={() => setLiked(l => !l)}
            >
              <svg width="14" height="14" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              {article.likes + (liked ? 1 : 0)}
            </button>
            <button
              className={`article-save-btn${saved ? ' saved' : ''}`}
              onClick={() => setSaved(s => !s)}
            >
              <svg width="14" height="14" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
              </svg>
              Сохранить
            </button>
          </div>
        </div>

        {/* Автор */}
        <div className="article-author-card">
          <div className="article-author-avatar" style={{ background: article.authorColor }}>
            {article.authorInitials}
          </div>
          <div className="article-author-info">
            <div className="article-author-name">{article.author}</div>
            {article.authorBio && <div className="article-author-bio">{article.authorBio}</div>}
          </div>
          <button className="article-follow-btn">Подписаться</button>
        </div>

        {/* Тело статьи */}
        <div className="article-content-card">
          <div className="article-content">
            {parseContent(article.content)}
          </div>
        </div>

        {/* Связанный набор */}
        {article.setLink && (
          <div className="article-set-card" onClick={() => navigate(`/set/${article.setLink.id}`)}>
            <div className="article-set-accent" style={{ background: article.setLink.color }} />
            <div className="article-set-body">
              <div className="article-set-eyebrow">Связанный набор</div>
              <div className="article-set-name">{article.setLink.title}</div>
            </div>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        )}
      </main>
    </Layout>
  )
}
