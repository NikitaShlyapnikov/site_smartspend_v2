import { useState, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PublicLayout from '../components/PublicLayout'
import { setDetails, catalogSets } from '../data/mock'

// Category → envelope category (Profile)
const CAT_TO_ENV = {
  clothes: 'clothes', food: 'food', home: 'home',
  health: 'health', transport: 'transport', leisure: 'leisure', gifts: 'other',
}
// Category → inventory group ID
const CAT_TO_GROUP = {
  clothes: 'g1', food: 'g2', home: 'g6', health: 'g4',
  transport: 'g3', leisure: 'g1', gifts: 'g1',
}
// Source → envelope source key
const SRC_TO_ENV = { ss: 'smartspend', community: 'community', own: 'custom' }

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

  const detail  = setDetails[id]
  const catalog = catalogSets.find(s => s.id === id)
  const set     = detail || catalog

  // Расходники (еда) — не амортизируются, закупаются ежемесячно
  const isConsumable = set?.category === 'food'

  // Mutable items state (for editing)
  const defaultItems = useMemo(
    () => (detail?.items || []).filter(i => 'basePrice' in i).map(i => ({ ...i })),
    [detail]
  )
  const [items, setItems]         = useState(() => defaultItems.map(i => ({ ...i })))
  const [added, setAdded]         = useState(() => {
    try {
      const envData = JSON.parse(localStorage.getItem('ss_envelopes') || '{}')
      return Object.values(envData).some(list => list.some(e => e.id === id))
    } catch { return false }
  })
  const [liked, setLiked]         = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('ss_catalog_likes') || '[]')).has(id) } catch { return false }
  })

  function toggleLike(e) {
    e.stopPropagation()
    setLiked(prev => {
      const next = !prev
      try {
        const set_ = new Set(JSON.parse(localStorage.getItem('ss_catalog_likes') || '[]'))
        next ? set_.add(id) : set_.delete(id)
        localStorage.setItem('ss_catalog_likes', JSON.stringify([...set_]))
      } catch {}
      return next
    })
  }
  const [editMode, setEditMode]   = useState(false)
  const [scale, setScaleRaw]      = useState(1.0)
  const [expOpen, setExpOpen]     = useState(false)
  const [showAllArticles, setShowAllArticles] = useState(false)
  const [cmtExpanded, setCmtExpanded] = useState(false)
  const [cmtSort, setCmtSort]     = useState('popular')
  const [cmtText, setCmtText]     = useState('')
  const [likes, setLikes]         = useState({})

  // Modified = scale changed OR any item differs from defaults
  const isDefault = useMemo(() => {
    if (scale !== 1.0) return false
    return items.every(item => {
      const d = defaultItems.find(x => x.id === item.id)
      return d && d.qty === item.qty && d.basePrice === item.basePrice && d.period === item.period
    })
  }, [scale, items, defaultItems])

  // Scale hold-acceleration
  const scaleTimerRef = useRef(null)
  const scaleHoldRef  = useRef(0)
  function stopScale() {
    if (scaleTimerRef.current) { clearTimeout(scaleTimerRef.current); scaleTimerRef.current = null }
  }
  function startScale(dir) {
    stopScale()
    scaleHoldRef.current = Date.now()
    function tick() {
      const elapsed = Date.now() - scaleHoldRef.current
      const step = elapsed < 1200 ? 0.05 : elapsed < 2500 ? 0.1 : 0.25
      setScaleRaw(s => Math.max(0.25, Math.min(5, Math.round((s + dir * step) * 100) / 100)))
      scaleTimerRef.current = setTimeout(tick, elapsed < 400 ? 350 : 80)
    }
    tick()
  }

  function handleAdd() {
    // 1. Build set title (append version label if modified)
    const now = new Date()
    const dd = String(now.getDate()).padStart(2, '0')
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const yy = String(now.getFullYear()).slice(2)
    const setTitle = isDefault ? set.title : `${set.title} v: ${dd}-${mm}-${yy}`

    // 2. Active items only (qty > 0)
    const activeItems = items.filter(i => i.qty > 0)

    // 3. Save to ss_envelopes
    const envCat = CAT_TO_ENV[set.category] || 'other'
    const envEntry = {
      id: set.id,
      source: SRC_TO_ENV[set.source] || 'custom',
      name: setTitle,
      items: activeItems.length,
      amount: totalMonthly != null ? Math.round(totalMonthly) : (set.amount || 0),
      type: 'depreciation',
      period: 'амортизация',
    }
    try {
      const envData = JSON.parse(localStorage.getItem('ss_envelopes') || '{}')
      const catList = envData[envCat] || []
      // Remove previous entry for same set id (re-add replaces)
      envData[envCat] = [...catList.filter(e => e.id !== set.id), envEntry]
      localStorage.setItem('ss_envelopes', JSON.stringify(envData))
    } catch {}

    // 4. Save to ss_inventory_extra
    const groupId = CAT_TO_GROUP[set.category] || 'g1'
    const ts = Date.now()
    const today = now.toISOString().slice(0, 10)

    const invItems = isConsumable
      // Расходники: каждая позиция — consumable с суточным расходом
      ? activeItems.map((item, idx) => {
          let unit = item.unit || 'шт'
          let rawQty = item.qty * scale  // количество за один период закупки

          // Переводим крупные единицы в мелкие для наглядного отображения
          if (unit === 'кг') { rawQty = rawQty * 1000; unit = 'г' }
          else if (unit === 'л') { rawQty = rawQty * 1000; unit = 'мл' }

          const qty = Math.round(rawQty)
          // Суточный расход = кол-во за период / дней в периоде
          // item.period — в годах (1/12 = месяц, 2/12 = 2 месяца)
          const daysInPeriod = item.period * 12 * 30
          const dailyUse = parseFloat((qty / daysInPeriod).toFixed(2))
          const price = Math.round(item.basePrice * item.qty * scale)  // стоимость за период

          return {
            id: `inv_${set.id}_${item.id}_${ts + idx * 1000}`,
            name: item.name,
            type: 'consumable',
            price,
            qty,
            dailyUse,
            unit,
            lastBought: today,
            set: setTitle,
            setId: set.id,
            groupId,
            paused: true,   // замороженный — пользователь активирует вручную
            isExtra: true,
          }
        })
      // Вещи: амортизация по сроку службы
      : activeItems.flatMap((item, idx) => {
          const count = Math.max(1, Math.round(item.qty))
          return Array.from({ length: count }, (_, k) => ({
            id: `inv_${set.id}_${item.id}_${ts + idx * 1000 + k}`,
            name: count > 1 ? `${item.name} #${k + 1}` : item.name,
            type: 'wear',
            price: Math.round(item.basePrice * scale),
            wearLifeWeeks: Math.round(item.period * 52),
            purchaseDate: today,
            set: setTitle,
            setId: set.id,
            groupId,
            paused: true,
            isExtra: true,
          }))
        })
    try {
      const invData = JSON.parse(localStorage.getItem('ss_inventory_extra') || '[]')
      // Remove previous items from same set (re-add replaces)
      const filtered = invData.filter(e => e.setId !== set.id)
      localStorage.setItem('ss_inventory_extra', JSON.stringify([...filtered, ...invItems]))
    } catch {}

    setAdded(true)
    setTimeout(() => navigate('/inventory'), 800)
  }

  function handleRemove() {
    // Удаляем только замороженные (paused) позиции этого набора
    try {
      const invData = JSON.parse(localStorage.getItem('ss_inventory_extra') || '[]')
      const filtered = invData.filter(e => !(e.setId === id && e.paused))
      localStorage.setItem('ss_inventory_extra', JSON.stringify(filtered))
    } catch {}
    // Удаляем запись из ss_envelopes
    try {
      const envData = JSON.parse(localStorage.getItem('ss_envelopes') || '{}')
      Object.keys(envData).forEach(cat => {
        envData[cat] = envData[cat].filter(e => e.id !== id)
      })
      localStorage.setItem('ss_envelopes', JSON.stringify(envData))
    } catch {}
    setAdded(false)
  }

  function handleReset() {
    setItems(defaultItems.map(i => ({ ...i })))
    setScaleRaw(1.0)
    setEditMode(false)
  }

  // Item edit handlers
  function chQty(itemId, delta) {
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, qty: Math.max(0, i.qty + delta) } : i))
  }
  function chPrice(itemId, v) {
    const n = parseFloat(v)
    if (!isNaN(n) && n >= 0) {
      setItems(prev => prev.map(i => i.id === itemId ? { ...i, basePrice: n / scale } : i))
    }
  }
  function chPeriod(itemId, v) {
    const n = parseFloat(v)
    if (!isNaN(n) && n > 0) {
      setItems(prev => prev.map(i => i.id === itemId ? { ...i, period: n } : i))
    }
  }

  if (!set) return (
    <PublicLayout>
      <main className="sd-main">
        <div className="empty-state">
          <div className="empty-state-icon">📦</div>
          <div className="empty-state-title">Набор не найден</div>
          <button className="btn-sm" style={{ marginTop: 8 }} onClick={() => navigate('/catalog')}>← Каталог</button>
        </div>
      </main>
    </PublicLayout>
  )

  const tableItems   = items.length > 0 ? items : null
  const totalMonthly = tableItems
    ? tableItems.reduce((s, i) => s + itemMonthly(i, scale), 0)
    : null

  const color    = set.color || '#4E8268'
  const srcLabel = { ss: 'SmartSpend', community: 'Сообщество', own: 'Мой набор' }[set.source] || 'SmartSpend'

  const authorArticles = detail?.authorArticles || []
  const recArticles    = detail?.recArticles    || []
  const comments       = detail?.comments       || []
  const SHOW_ART = 3
  const SHOW_CMT = 2

  const sortedComments = [...comments].sort(
    cmtSort === 'popular' ? (a, b) => b.likes - a.likes : () => 0
  )

  return (
    <PublicLayout>
      <main className="sd-main">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <span className="breadcrumb-item" onClick={() => navigate('/catalog')}>Каталог</span>
          <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
          <span className="breadcrumb-current">{set.title}</span>
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
              {!isDefault && (
                <span className="sd-modified-badge">
                  <svg width="9" height="9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
                  </svg>
                  Под меня
                </span>
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
                onClick={!added ? handleAdd : undefined}>
                {added ? <><CheckIcon /> Добавлено в конверт</> : <><PlusIcon /> Добавить в конверт</>}
              </button>
              {added && (
                <button className="sd-btn-remove" onClick={handleRemove}>
                  <TrashIcon />
                  Удалить из инвентаря
                </button>
              )}
              <button className={`btn-liked${liked ? ' liked' : ''}`} onClick={toggleLike}>
                <svg width="14" height="14" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                {liked ? 'Понравилось' : 'Нравится'}
              </button>
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
                <div className="sd-scale-desc">{isConsumable ? 'База: 1 человек / месяц' : 'База: мужчина, размер M–L'}</div>
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
              <div className="sd-section-actions">
                {!isDefault && (
                  <button className="sd-btn-sm" onClick={handleReset}>
                    <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                      <path d="M3 3v5h5"/>
                    </svg>
                    Сбросить
                  </button>
                )}
                <button className={`sd-btn-sm${editMode ? ' active' : ''}`}
                  onClick={() => setEditMode(m => !m)}>
                  {editMode ? (
                    <><svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Готово</>
                  ) : (
                    <><svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg> Редактировать</>
                  )}
                </button>
              </div>
            </div>

            {/* Table */}
            <table className="sd-items-table">
              <thead>
                <tr>
                  <th>Позиция</th>
                  <th>Кол-во</th>
                  <th>Цена</th>
                  <th>{isConsumable ? 'Объём / мес' : 'Срок службы'}</th>
                  <th>₽/мес</th>
                </tr>
              </thead>
              <tbody>
                <tr className="sd-divider-row">
                  <td colSpan={5}>{isConsumable ? 'Расходники — ежемесячная закупка' : 'Долгосрочные вещи — амортизация'}</td>
                </tr>
                {tableItems.map(item => {
                  const effectivePrice = item.basePrice * scale
                  const monthly = itemMonthly(item, scale)
                  const periodYears = item.period
                  const periodStr = (periodYears % 1 === 0) ? periodYears + '\u00a0лет' : (periodYears * 12) + '\u00a0мес'

                  if (editMode) {
                    return (
                      <tr key={`${item.id}-e-${scale}`}>
                        <td>
                          <div className="sd-item-name">{item.name}</div>
                          {item.note && <div className="sd-item-note">{item.note}</div>}
                        </td>
                        <td>
                          <div className="sd-qty-ctrl">
                            <button className="sd-qty-btn" onClick={() => chQty(item.id, -1)}>−</button>
                            <span className="sd-qty-n">{item.qty}</span>
                            <button className="sd-qty-btn" onClick={() => chQty(item.id, +1)}>+</button>
                          </div>
                        </td>
                        <td>
                          <input className="sd-inline-input" type="number"
                            defaultValue={Math.round(effectivePrice)} min="0" step="100"
                            onBlur={e => chPrice(item.id, e.target.value)}
                            style={{ width: 80 }} />
                        </td>
                        <td>
                          <div className="sd-period-row">
                            <input className="sd-inline-input" type="number"
                              defaultValue={item.period} min="0.25" step="0.5"
                              onBlur={e => chPeriod(item.id, e.target.value)}
                              style={{ width: 60 }} />
                            <span className="sd-period-unit">лет</span>
                          </div>
                        </td>
                        <td><span className="sd-mono-accent">{Math.round(monthly).toLocaleString('ru')}&thinsp;₽</span></td>
                      </tr>
                    )
                  }
                  const scaledQty = parseFloat((item.qty * scale).toFixed(2))
                  return (
                    <tr key={item.id}>
                      <td>
                        <div className="sd-item-name">{item.name}</div>
                        {item.note && <div className="sd-item-note">{item.note}</div>}
                      </td>
                      <td><span className="sd-mono-val">{scaledQty}&thinsp;{item.unit}</span></td>
                      <td><span className="sd-mono-val">{Math.round(effectivePrice).toLocaleString('ru')}&thinsp;₽</span></td>
                      <td>
                        {isConsumable
                          ? <span className="sd-mono-val" style={{ color: 'var(--text-2)' }}>{scaledQty}&thinsp;{item.unit}/мес</span>
                          : <span className="amort-chip">{periodStr}</span>
                        }
                      </td>
                      <td><span className="sd-mono-accent">{Math.round(monthly).toLocaleString('ru')}&thinsp;₽</span></td>
                    </tr>
                  )
                })}
                <tr className="sd-total-row">
                  <td colSpan={4}>
                    Итого в месяц
                    {scale !== 1.0 && (
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 400, color: 'var(--accent-green)', marginLeft: 6 }}>
                        (×{scale.toFixed(2).replace(/\.?0+$/, '')})
                      </span>
                    )}
                  </td>
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
                  <div className="sd-article-ico"><DocIcon /></div>
                  <div className="sd-article-body">
                    <div className="sd-article-tag">{a.tag}</div>
                    <div className="sd-article-title">{a.title}</div>
                    <div className="sd-article-meta"><EyeIcon /> {a.views} · {detail?.author?.name || ''}</div>
                  </div>
                  <ArrIcon />
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
                  <div className="sd-article-ico"><DocIcon /></div>
                  <div className="sd-article-body">
                    <div className="sd-article-tag">{a.tag}</div>
                    <div className="sd-article-title">{a.title}</div>
                    <div className="sd-article-meta">
                      <EyeIcon /> {a.views}
                      {a.source && <span className="article-source-tag">из «{a.source}»</span>}
                    </div>
                  </div>
                  <ArrIcon />
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
    </PublicLayout>
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
function DocIcon() {
  return <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
}
function EyeIcon() {
  return <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
}
function ArrIcon() {
  return <svg className="sd-article-arr" width="13" height="13" fill="none" stroke="currentColor"
    viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18l6-6-6-6"/>
  </svg>
}
function TrashIcon() {
  return <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
  </svg>
}
