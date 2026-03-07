import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { articles } from '../data/mock'

export default function Article() {
  const { id } = useParams()
  const navigate = useNavigate()

  const article = articles.find(a => a.id === id)

  if (!article) {
    return (
      <Layout>
        <main className="article-main">
          <div className="empty-state">
            <div className="empty-state-title">Статья не найдена</div>
            <button className="btn-cancel" onClick={() => navigate('/feed')}>← Лента</button>
          </div>
        </main>
      </Layout>
    )
  }

  return (
    <Layout>
      <main className="article-main">
        <div className="article-page-header">
          <div className="article-page-meta">
            <div className="article-author-avatar" style={{ background: article.authorColor }}>{article.authorInitials}</div>
            <div>
              <div className="article-author-name">{article.author}</div>
              <div className="article-author-date">{article.date} · {article.readTime} чтения</div>
            </div>
          </div>
          <h1 className="article-page-title">{article.title}</h1>
          <div style={{ display: 'flex', gap: 12 }}>
            <span className="a-stat">
              <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
              {article.views.toLocaleString('ru')} просмотров
            </span>
            <span className="a-stat">
              <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              {article.likes}
            </span>
          </div>
        </div>

        <div className="article-content">
          {article.content.split('\n\n').map((para, i) => {
            if (para.startsWith('## ')) return <h2 key={i}>{para.slice(3)}</h2>
            if (para.startsWith('# ')) return <h2 key={i}>{para.slice(2)}</h2>
            if (para.startsWith('> ')) return <blockquote key={i}>{para.slice(2)}</blockquote>
            return <p key={i}>{para}</p>
          })}
        </div>

        {article.setLink && (
          <div className="article-set-card" onClick={() => navigate(`/set/${article.setLink.id}`)}>
            <div className="article-set-accent" style={{ background: article.setLink.color }} />
            <div className="article-set-body">
              <div className="article-set-label">Связанный набор</div>
              <div className="article-set-name">{article.setLink.title}</div>
            </div>
          </div>
        )}
      </main>
    </Layout>
  )
}
