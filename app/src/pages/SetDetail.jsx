import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { setDetails, catalogSets } from '../data/mock'

const fmtRub = n => Math.round(n).toLocaleString('ru') + '\u00a0₽'
const fmtNum = n => {
  if (!n && n !== 0) return '—'
  if (n >= 10000) return (Math.round(n / 100) / 10) + 'k'
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'k'
  return String(n)
}
const fmtDate = iso => new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })

function itemMonthly(item, scale) {
  return (item.basePrice * scale * item.qty) / (item.period * 12)
}

export default function SetDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [added, setAdded]         = useState(false)
  const [scale, setScale]         = useState(1.0)
  const [expOpen, setExpOpen]     = useState(false)
  const [showAllArticles, setShowAllArticles] = useState(false)
  const [cmtExpanded, setCmtExpanded] = useState(false)
  const [cmtSort, setCmtSort]     = useState('popular')
  const [cmtText, setCmtText]     = useState('')
  const [likes, setLikes]         = useState({})

  // Scale hold-acceleration
  const scaleTimerRef = useRef(null)
  const scaleHoldRef  = useRef(0)
  function stopScale() { if (scaleTimerRef.current) { clearTimeout(scaleTimerRef.current); scaleTimerRef.current = null } }
  function startScale(dir) {
    stopScale()
    scaleHoldRef.current = Date.now()
    function tick() {
      const elapsed = Date.now() - scaleHoldRef.current
      const step = elapsed < 1200 ? 0.05 : elapsed < 2500 ? 0.1 : 0.25
      setScale(s => Math.max(0.25, Math.min(5, Math.round((s + dir * step) * 100) / 100)))
      scaleTimerRef.current = setTimeout(tick, elapsed < 400 ? 350 : 80)
    }
    tick()
  }

  // Resolve set data
  const detail = setDetails[id]
  const catalog = catalogSets.find(s => s.id === id)
  const set = detail || catalog

  if (!set) return (
    <Layout>
      <main className="sd-main">
        <div className="empty-state">
          <div className="empty-state-icon">📦</div>
          <div className="empty-state-title">Набор не найден</div>
          <button className="btn-sm" style={{ marginTop: 8 }} onClick={() => navigate('/catalog')}>← Каталог</button>
        </div>
      </main>
    </Layout>
  )

  const richItems  = detail?.items?.length > 0 && typeof detail.items[0] === 'object' && 'basePrice' in detail.items[0]
  const tableItems = richItems ? detail.items : null

  const totalMonthly = tableItems
    ? tableItems.reduce((s, i) => s + itemMonthly(i, scale), 0)
    : null

  const color = set.color || '#4E8268'
  const srcLabel = { ss: 'SmartSpend', community: 'Сообщество', own: 'Мой набор' }[set.source] || 'SmartSpend'
  const catLabel = set.categoryLabel || set.category || ''

  const authorArticles = detail?.authorArticles || []
  const recArticles    = detail?.recArticles || []
  const comments       = detail?.comments || []
  const SHOW_ART = 3
  const SHOW_CMT = 2

  const sortedComments = [...comments].sort(
    cmtSort === 'popular' ? (a, b) => b.likes - a.likes : (a, b) => 0
  )

  return (
    <Layout>
      <main className="sd-main">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <span className="breadcrumb-item" onClick={() => navigate('/catalog')}>Каталог</span>
          <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
          {catLabel && <>
            <span className="breadcrumb-item" onClick={() => navigate(`/catalog?cat=${set.category}`)}>{catLabel}</span>
            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
          </>}
          <span className="breadcrumb-item breadcrumb-current">{set.title}</span>
        </div>

        {/* ── HERO CARD ── */}
        <div className="sd-hero-card">
          <div className="sd-hero-bar" style={{ background: color }} />
          <div className="sd-hero-body">
            <div className="sd-hero-badges">
              <span className={`source-badge ${set.source}`}>{srcLabel}</span>
              <span className={set.type === 'base' ? 'base-badge' : 'extra-badge'}>
                {set.type === 'base' ? 'Основа' : 'Дополнение'}
              </span>
              {catLabel && (
                <span className="cat-badge" style={{ background: color }}>{catLabel}</span>
              )}
            </div>
            <div className="sd-hero-title">{set.title}</div>
            <div className="sd-hero-desc">{set.desc}</div>

            {/* Stats row */}
            <div className="sd-hstats">
              {totalMonthly != null ? (
                <div className="sd-hstat">
                  <div className="sd-hstat-val">{fmtRub(totalMonthly)}</div>
                  <div className="sd-hstat-lbl">в месяц (амортизация)</div>
                </div>
              ) : set.amount ? (
                <div className="sd-hstat">
                  <div className="sd-hstat-val">{fmtRub(set.amount)}</div>
                  <div className="sd-hstat-lbl">{set.amountLabel || 'стоимость'}</div>
                </div>
              ) : null}
              {tableItems && (
                <div className="sd-hstat">
                  <div className="sd-hstat-val">{tableItems.length}</div>
                  <div className="sd-hstat-lbl">позиций в наборе</div>
                </div>
              )}
              {set.users != null && (
                <div className="sd-hstat">
                  <div className="sd-hstat-val">{fmtNum(set.users)}</div>
                  <div className="sd-hstat-lbl">пользователей добавили</div>
                </div>
              )}
              {set.added && (
                <div className="sd-hstat">
                  <div className="sd-hstat-val" style={{ fontSize: 15 }}>{fmtDate(set.added)}</div>
                  <div className="sd-hstat-lbl">дата добавления</div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="sd-hero-actions">
              <button className={`sd-btn-primary${added ? ' added' : ''}`}
                onClick={() => { setAdded(true); setTimeout(() => navigate('/inventory'), 700) }}>
                {added ? (
                  <><CheckIcon /> Добавлено</>
                ) : (
                  <><PlusIcon /> Добавить в конверт</>
                )}
              </button>
              {added && (
                <button className="sd-btn-secondary">
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                  </svg>
                  Дублировать
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── ITEMS SECTION CARD ── */}
        {tableItems ? (
          <div className="sd-section-card">
            {/* Scale stepper */}
            <div className="sd-scale-row">
              <div>
                <div className="sd-scale-title">Масштаб набора</div>
                <div className="sd-scale-desc">База: мужчина, размер M–L</div>
              </div>
              <div className="sd-scale-right">
                <span className="sd-scale-val">×{scale.toFixed(2)}</span>
                <div className="sd-scale-stepper">
                  <button className="sd-scale-btn"
                    onMouseDown={() => startScale(-1)} onMouseUp={stopScale}
                    onMouseLeave={stopScale} onTouchStart={() => startScale(-1)} onTouchEnd={stopScale}>−</button>
                  <button className="sd-scale-btn"
                    onMouseDown={() => startScale(1)} onMouseUp={stopScale}
                    onMouseLeave={stopScale} onTouchStart={() => startScale(1)} onTouchEnd={stopScale}>+</button>
                </div>
              </div>
            </div>

            {/* Section header */}
            <div className="sd-section-header">
              <div className="sd-section-title">
                Состав набора
                <span className="sd-section-count">{tableItems.length} позиций</span>
              </div>
            </div>

            {/* Table */}
            <table className="sd-items-table">
              <thead>
                <tr>
                  <th>Позиция</th>
                  <th>Кол-во</th>
                  <th>Цена</th>
                  <th>Срок службы</th>
                  <th>₽/мес</th>
                </tr>
              </thead>
              <tbody>
                {tableItems.map(item => {
                  const effectivePrice = item.basePrice * scale
                  const monthly = itemMonthly(item, scale)
                  return (
                    <tr key={item.id}>
                      <td>
                        <div className="sd-item-name">{item.name}</div>
                        {item.note && <div className="sd-item-note">{item.note}</div>}
                      </td>
                      <td className="sd-mono-val">{item.qty}&thinsp;{item.unit}</td>
                      <td className="sd-mono-val">{Math.round(effectivePrice).toLocaleString('ru')}&thinsp;₽</td>
                      <td className="sd-mono-val">{item.period}&thinsp;г.</td>
                      <td className="sd-mono-accent">{Math.round(monthly).toLocaleString('ru')}&thinsp;₽</td>
                    </tr>
                  )
                })}
                <tr className="sd-total-row">
                  <td colSpan={4}>Итого в месяц</td>
                  <td className="sd-total-amt">{fmtRub(totalMonthly)}</td>
                </tr>
              </tbody>
            </table>

            {/* How it's calculated accordion */}
            <div className="sd-explainer">
              <button className={`sd-explainer-btn${expOpen ? ' open' : ''}`} onClick={() => setExpOpen(o => !o)}>
                <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
                Как считается сумма?
                <svg className="sd-exp-chevron" width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 9l-7 7-7-7"/></svg>
              </button>
              {expOpen && (
                <div className="sd-explainer-body">
                  <div className="sd-exp-text">
                    Набор показывает не «сколько потратить», а <strong>сколько откладывать ежемесячно</strong> — чтобы деньги
                    были в нужный момент. Стоимость каждой вещи делится на срок службы в месяцах.
                  </div>
                  <div className="sd-exp-formula">
                    <span className="sd-fa">Амортизация:</span> цена × кол-во / (срок_лет × 12)<br />
                    <span className="sd-fa">Цена с масштабом:</span> базовая_цена × коэффициент<br />
                    <span className="sd-fa">Итог:</span> сумма амортизаций всех позиций
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Simple items list for sets without rich data */
          <div className="sd-section-card">
            <div className="sd-section-header">
              <div className="sd-section-title">
                Состав набора
                <span className="sd-section-count">{(set.items || []).length + (set.more || 0)} позиций</span>
              </div>
            </div>
            <div className="sd-simple-list">
              {(set.items || []).map((name, i) => (
                <div key={i} className="sd-simple-row">{name}</div>
              ))}
              {set.more > 0 && (
                <div className="sd-simple-row sd-simple-more">+{set.more} позиций</div>
              )}
            </div>
            <div className="sd-items-footer">
              <span className="sd-items-amount">{(set.amount || 0).toLocaleString('ru')}&thinsp;₽</span>
              <span className="sd-items-period">{set.amountLabel}</span>
            </div>
          </div>
        )}

        {/* ── AUTHOR / ABOUT CARD ── */}
        {detail?.author && (
          <div className="sd-intro-card">
            <div className="sd-author-row">
              <div className="sd-author-avatar" style={{ background: `linear-gradient(135deg, ${color}, #B8A0C8)` }}>
                {detail.author.initials}
              </div>
              <div className="sd-author-info">
                <div className="sd-author-name">{detail.author.name}</div>
                <div className="sd-author-bio">{detail.author.bio}</div>
              </div>
              <button className="sd-author-link">
                Все наборы
                <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            </div>
            {detail.about && <>
              <div className="sd-intro-divider" />
              <div className="sd-intro-label">О наборе</div>
              <div className="sd-intro-title">{detail.about.title}</div>
              <div className="sd-intro-text">
                {detail.about.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
              </div>
            </>}
          </div>
        )}

        {/* ── AUTHOR ARTICLES ── */}
        {authorArticles.length > 0 && (
          <div className="sd-section-card">
            <div className="sd-section-header">
              <div className="sd-section-title">
                Гайды от автора
                <span className="sd-section-count">{authorArticles.length} статей</span>
              </div>
            </div>
            <div className="sd-articles-list">
              {(showAllArticles ? authorArticles : authorArticles.slice(0, SHOW_ART)).map((a, i) => (
                <div key={i} className="sd-article-row" onClick={() => navigate('/article/a1')}>
                  <div className="sd-article-ico">
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"
                      strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                  </div>
                  <div className="sd-article-body">
                    <div className="sd-article-tag">{a.tag}</div>
                    <div className="sd-article-title">{a.title}</div>
                    <div className="sd-article-meta">{a.views} просмотров</div>
                  </div>
                  <svg className="sd-article-arr" width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                </div>
              ))}
            </div>
            {authorArticles.length > SHOW_ART && (
              <div className="sd-show-more-row">
                <button className={`sd-btn-show${showAllArticles ? ' open' : ''}`}
                  onClick={() => setShowAllArticles(o => !o)}>
                  {showAllArticles ? 'Скрыть' : `Показать все (${authorArticles.length})`}
                  <svg className="sd-chev" width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 9l-7 7-7-7"/></svg>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── RECOMMENDED ARTICLES ── */}
        {recArticles.length > 0 && (
          <div className="sd-section-card">
            <div className="sd-section-header">
              <div className="sd-section-title">
                Рекомендуемые статьи
                <span className="sd-section-count">{recArticles.length} статьи</span>
              </div>
              <span className="sd-section-subtitle">из похожих наборов</span>
            </div>
            <div className="sd-articles-list">
              {recArticles.map((a, i) => (
                <div key={i} className="sd-article-row" onClick={() => navigate('/article/a1')}>
                  <div className="sd-article-ico">
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"
                      strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                  </div>
                  <div className="sd-article-body">
                    <div className="sd-article-tag">{a.tag}</div>
                    <div className="sd-article-title">{a.title}</div>
                    <div className="sd-article-meta">
                      {a.views} просмотров
                      {a.source && <><span style={{ opacity: 0.4 }}>·</span> {a.source}</>}
                    </div>
                  </div>
                  <svg className="sd-article-arr" width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── COMMENTS ── */}
        {comments.length > 0 && (
          <div className="sd-section-card">
            <div className="sd-section-header">
              <div className="sd-section-title">
                Комментарии
                <span className="sd-section-count">{comments.length}</span>
              </div>
            </div>
            <div className="sd-comments-subheader">
              <div className="sd-csort">
                {[['popular', 'Популярные'], ['new', 'Новые']].map(([k, l]) => (
                  <button key={k} className={`sd-sort-btn${cmtSort === k ? ' active' : ''}`}
                    onClick={() => setCmtSort(k)}>{l}</button>
                ))}
              </div>
            </div>
            <div className="sd-comments-list">
              {(cmtExpanded ? sortedComments : sortedComments.slice(0, SHOW_CMT)).map((c, i) => (
                <div key={i} className="sd-comment-item">
                  <div className="sd-c-avatar">{c.ini}</div>
                  <div className="sd-c-body">
                    <div className="sd-c-header">
                      <span className="sd-c-name">{c.name}</span>
                      <span className="sd-c-date">{c.date}</span>
                    </div>
                    <div className="sd-c-text">{c.text}</div>
                    <div className="sd-c-actions">
                      <button className="sd-c-like" onClick={() => setLikes(p => ({ ...p, [i]: !p[i] }))}>
                        <svg width="12" height="12" fill={likes[i] ? 'currentColor' : 'none'} stroke="currentColor"
                          viewBox="0 0 24 24" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
                        {c.likes + (likes[i] ? 1 : 0)}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {comments.length > SHOW_CMT && (
              <div className="sd-show-more-row">
                <button className={`sd-btn-show${cmtExpanded ? ' open' : ''}`}
                  onClick={() => setCmtExpanded(o => !o)}>
                  {cmtExpanded ? 'Скрыть' : `Показать все комментарии (${comments.length})`}
                  <svg className="sd-chev" width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 9l-7 7-7-7"/></svg>
                </button>
              </div>
            )}
            <div className="sd-comments-input">
              <input className="sd-c-input" placeholder="Написать комментарий…"
                value={cmtText} onChange={e => setCmtText(e.target.value)} />
              <button className="sd-c-submit">Отправить</button>
            </div>
          </div>
        )}
      </main>
    </Layout>
  )
}

function PlusIcon() {
  return <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
}
function CheckIcon() {
  return <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
}
