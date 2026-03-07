import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'

export default function CreateArticle() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')

  return (
    <Layout>
      <main className="editor-main">
        <div className="editor-toolbar">
          <div className="editor-format-bar">
            {['B', 'I', 'H2', 'H3', '"', '—'].map(fmt => (
              <button key={fmt} className="fmt-btn">{fmt}</button>
            ))}
          </div>
          <span className="editor-toolbar-title" />
          <button className="btn-cancel" style={{ padding: '7px 16px' }} onClick={() => navigate('/feed')}>Отмена</button>
          <button className="btn-publish" style={{ padding: '7px 16px' }} onClick={() => navigate('/feed')}>Опубликовать</button>
        </div>

        <div className="editor-scroll">
          <textarea
            className="editor-title-input"
            placeholder="Заголовок статьи..."
            value={title}
            onChange={e => setTitle(e.target.value)}
            rows={1}
          />
          <textarea
            className="editor-body-input"
            placeholder="Начните писать свою статью..."
            value={body}
            onChange={e => setBody(e.target.value)}
          />
        </div>
      </main>
    </Layout>
  )
}
