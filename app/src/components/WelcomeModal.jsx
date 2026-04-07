import { useState, useEffect, useRef } from 'react'
import { useApp } from '../context/AppContext'

// ── helpers ───────────────────────────────────────────────────────────────────

function toLatinUname(name) {
  const map = { 'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'kh','ц':'ts','ч':'ch','ш':'sh','щ':'sch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya' }
  return name.toLowerCase().split('').map(c => map[c] ?? (c.match(/[a-z0-9]/) ? c : '_')).join('').replace(/_+/g, '_').replace(/^_|_$/g, '').slice(0, 20)
}

const WELCOME_REGIONS = [
  { group: 'Крупные города', items: [
    { value: 'moscow',       label: 'Москва' },
    { value: 'spb',          label: 'Санкт-Петербург' },
    { value: 'novosibirsk',  label: 'Новосибирск' },
    { value: 'ekaterinburg', label: 'Екатеринбург' },
    { value: 'kazan',        label: 'Казань' },
    { value: 'nizhny',       label: 'Нижний Новгород' },
    { value: 'chelyabinsk',  label: 'Челябинск' },
    { value: 'samara',       label: 'Самара' },
    { value: 'omsk',         label: 'Омск' },
    { value: 'rostov',       label: 'Ростов-на-Дону' },
    { value: 'ufa',          label: 'Уфа' },
    { value: 'krasnoyarsk',  label: 'Красноярск' },
    { value: 'voronezh',     label: 'Воронеж' },
    { value: 'perm',         label: 'Пермь' },
    { value: 'volgograd',    label: 'Волгоград' },
  ]},
  { group: 'Области и регионы', items: [
    { value: 'adygeya',         label: 'Республика Адыгея' },
    { value: 'altay_r',         label: 'Республика Алтай' },
    { value: 'altaysky',        label: 'Алтайский край' },
    { value: 'amurskaya',       label: 'Амурская область' },
    { value: 'arhangelskaya',   label: 'Архангельская область' },
    { value: 'astrahanskaya',   label: 'Астраханская область' },
    { value: 'bashkortostan',   label: 'Республика Башкортостан' },
    { value: 'belgorodskaya',   label: 'Белгородская область' },
    { value: 'bryanskaya',      label: 'Брянская область' },
    { value: 'buryatiya',       label: 'Республика Бурятия' },
    { value: 'vladimirskaya',   label: 'Владимирская область' },
    { value: 'volgogradskaya',  label: 'Волгоградская область' },
    { value: 'vologodskaya',    label: 'Вологодская область' },
    { value: 'voronezhskaya',   label: 'Воронежская область' },
    { value: 'dagestan',        label: 'Республика Дагестан' },
    { value: 'zabaykalsky',     label: 'Забайкальский край' },
    { value: 'ivanovskaya',     label: 'Ивановская область' },
    { value: 'irkutskaya',      label: 'Иркутская область' },
    { value: 'kalinigradskaya', label: 'Калининградская область' },
    { value: 'kaluzhskaya',     label: 'Калужская область' },
    { value: 'kamchatsky',      label: 'Камчатский край' },
    { value: 'kareliya',        label: 'Республика Карелия' },
    { value: 'kemerovskaya',    label: 'Кемеровская область' },
    { value: 'kirovskaya',      label: 'Кировская область' },
    { value: 'komi',            label: 'Республика Коми' },
    { value: 'kostromskaya',    label: 'Костромская область' },
    { value: 'krasnodarsky',    label: 'Краснодарский край' },
    { value: 'krasnoyarsky',    label: 'Красноярский край' },
    { value: 'kurganskaya',     label: 'Курганская область' },
    { value: 'kurskaya',        label: 'Курская область' },
    { value: 'leningradskaya',  label: 'Ленинградская область' },
    { value: 'lipetskaya',      label: 'Липецкая область' },
    { value: 'moskovskaya',     label: 'Московская область' },
    { value: 'murmanskaya',     label: 'Мурманская область' },
    { value: 'nizhegorodskaya', label: 'Нижегородская область' },
    { value: 'novgorodskaya',   label: 'Новгородская область' },
    { value: 'novosibirskaya',  label: 'Новосибирская область' },
    { value: 'omskaya',         label: 'Омская область' },
    { value: 'orenburgskaya',   label: 'Оренбургская область' },
    { value: 'orlovskaya',      label: 'Орловская область' },
    { value: 'penzenskaya',     label: 'Пензенская область' },
    { value: 'permsky',         label: 'Пермский край' },
    { value: 'primorsky',       label: 'Приморский край' },
    { value: 'pskovskaya',      label: 'Псковская область' },
    { value: 'rostovskaya',     label: 'Ростовская область' },
    { value: 'ryazanskaya',     label: 'Рязанская область' },
    { value: 'samarskaya',      label: 'Самарская область' },
    { value: 'saratovskaya',    label: 'Саратовская область' },
    { value: 'sakha',           label: 'Республика Саха (Якутия)' },
    { value: 'sakhalinskaya',   label: 'Сахалинская область' },
    { value: 'sverdlovskaya',   label: 'Свердловская область' },
    { value: 'smolenskaya',     label: 'Смоленская область' },
    { value: 'stavropolsky',    label: 'Ставропольский край' },
    { value: 'tambovskaya',     label: 'Тамбовская область' },
    { value: 'tatarstan',       label: 'Республика Татарстан' },
    { value: 'tverskaya',       label: 'Тверская область' },
    { value: 'tomskaya',        label: 'Томская область' },
    { value: 'tulskaya',        label: 'Тульская область' },
    { value: 'tyumenskaya',     label: 'Тюменская область' },
    { value: 'udmurtiya',       label: 'Удмуртская Республика' },
    { value: 'ulyanovskaya',    label: 'Ульяновская область' },
    { value: 'khabarovsk',      label: 'Хабаровский край' },
    { value: 'khakasiya',       label: 'Республика Хакасия' },
    { value: 'khanty',          label: 'Ханты-Мансийский АО' },
    { value: 'chelyabinskaya',  label: 'Челябинская область' },
    { value: 'chechnya',        label: 'Чеченская Республика' },
    { value: 'chuvashiya',      label: 'Чувашская Республика' },
    { value: 'yamalo',          label: 'Ямало-Ненецкий АО' },
    { value: 'yaroslavskaya',   label: 'Ярославская область' },
  ]},
]

const ALL_REGIONS = WELCOME_REGIONS.flatMap(g => g.items)

// ── region search ─────────────────────────────────────────────────────────────

function RegionSearch({ value, onChange }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const selectedLabel = ALL_REGIONS.find(r => r.value === value)?.label || ''

  useEffect(() => {
    if (!open) return
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', handler)
    return () => document.removeEventListener('pointerdown', handler)
  }, [open])

  function handleSelect(r) { onChange(r.value); setQuery(''); setOpen(false) }
  function handleClear() { onChange(''); setQuery(''); setOpen(false) }

  const filtered = query.trim()
    ? ALL_REGIONS.filter(r => r.label.toLowerCase().includes(query.trim().toLowerCase()))
    : ALL_REGIONS

  return (
    <div className="region-search-wrap" ref={ref}>
      <div className="region-search-input-row">
        <input
          className="welcome-input"
          type="text"
          placeholder="Начните вводить город или регион…"
          value={open ? query : selectedLabel}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => { setQuery(''); setOpen(true) }}
          autoComplete="off"
        />
        {value && !open && (
          <button className="region-search-clear" onClick={handleClear} type="button">
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>
      {open && (
        <div className="region-search-dropdown">
          {filtered.length === 0
            ? <div className="region-search-empty">Ничего не найдено</div>
            : filtered.map(r => (
              <button
                key={r.value}
                className={`region-search-option${r.value === value ? ' active' : ''}`}
                onPointerDown={e => { e.preventDefault(); handleSelect(r) }}
                type="button"
              >{r.label}</button>
            ))
          }
        </div>
      )}
    </div>
  )
}

// ── tour illustrations ────────────────────────────────────────────────────────

function WMockup({ title, children }) {
  return (
    <div className="tour-mockup">
      <div className="tour-mockup-bar">
        <span className="tour-mockup-dot"/><span className="tour-mockup-dot"/><span className="tour-mockup-dot"/>
        <span className="tour-mockup-label">{title}</span>
      </div>
      <div className="tour-mockup-body">{children}</div>
    </div>
  )
}

const WIllust1 = () => (
  <WMockup title="SmartSpend / Профиль">
    <div style={{display:'flex',flexDirection:'column',gap:5}}>
      {[['#B8A0C8','Одежда и обувь','12 000 ₽'],['#8DBFA8','Еда и супермаркеты','22 000 ₽'],['#9EA8C0','Дом и техника','8 000 ₽'],['#B8C49A','Здоровье','5 000 ₽']].map(([c,n,a])=>(
        <div key={n} className="tour-mk-env-item" style={{borderLeft:`3px solid ${c}`}}>
          <span className="tour-mk-env-dot" style={{background:c}}/>
          {n}
          <span className="tour-mk-env-amt">{a}</span>
        </div>
      ))}
    </div>
    <div style={{fontSize:10,color:'var(--text-3)',textAlign:'center',paddingTop:2}}>4 конверта · 47 000 ₽/мес</div>
  </WMockup>
)

const WIllust2 = () => (
  <WMockup title="Конверт: Одежда и обувь">
    <div className="tour-mk-env-card" style={{borderColor:'#B8A0C8'}}>
      <div className="tour-mk-env-head"><span className="tour-mk-env-dot" style={{background:'#B8A0C8'}}/>Одежда и обувь<span className="tour-mk-env-amt">12 000 ₽/мес</span></div>
      <div style={{height:4,background:'var(--border)',borderRadius:4,overflow:'hidden',margin:'2px 0 4px'}}>
        <div style={{width:'75%',height:'100%',background:'#B8A0C8',borderRadius:4}}/>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:'var(--text-3)'}}>
        <span>9 000 ₽ отложено</span><span>осталось 3 000 ₽</span>
      </div>
    </div>
    <div className="tour-mk-fin-rows" style={{marginTop:2}}>
      {[['Январь','100%','#4E8268'],['Февраль','100%','#4E8268'],['Март','60%','#B08840']].map(([m,w,c])=>(
        <div key={m} className="tour-mk-fin-row">
          <span className="tour-mk-fin-lbl">{m}</span>
          <span className="tour-mk-fin-bar"><span style={{width:w,background:c}}/></span>
          <span className="tour-mk-fin-val">{w}</span>
        </div>
      ))}
    </div>
  </WMockup>
)

const WIllust3 = () => (
  <WMockup title="SmartSpend / Каталог">
    <div style={{display:'flex',flexDirection:'column',gap:6}}>
      {[['Базовый гардероб на сезон','Одежда','8 000 ₽',true],['Здоровое питание на месяц','Еда','18 000 ₽',false],['Домашняя аптечка','Здоровье','3 500 ₽',false]].map(([n,c,a,added])=>(
        <div key={n} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:8,padding:'8px 10px',display:'flex',alignItems:'center',gap:8}}>
          <div style={{flex:1}}>
            <div style={{fontSize:10,fontWeight:600,color:'var(--text)',letterSpacing:'-0.01em'}}>{n}</div>
            <div style={{fontSize:9,color:'var(--text-3)',marginTop:2}}>{c} · {a}</div>
          </div>
          <div style={{fontSize:9,fontWeight:600,padding:'3px 8px',borderRadius:6,
            background: added ? 'var(--accent-green-light)' : 'var(--surface-2)',
            color: added ? 'var(--accent-green)' : 'var(--text-3)',
            border: `1px solid ${added ? 'var(--accent-green-border)' : 'var(--border)'}`,
            whiteSpace:'nowrap'}}>
            {added ? '✓ Добавлен' : '+ Добавить'}
          </div>
        </div>
      ))}
    </div>
  </WMockup>
)

const WIllust4 = () => (
  <WMockup title="SmartSpend / Инвентарь">
    <div style={{display:'flex',flexDirection:'column',gap:5}}>
      {[
        {name:'Кроссовки Nike',days:'через 180 дней',pct:15,c:'var(--status-ok)'},
        {name:'Зимняя куртка',days:'через 42 дня',pct:72,c:'var(--status-soon)'},
        {name:'Протеин Whey',days:'через 3 дня',pct:92,c:'var(--status-urgent)'},
      ].map(({name,days,pct,c})=>(
        <div key={name} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:8,padding:'7px 10px'}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
            <span style={{fontSize:10,fontWeight:600,color:'var(--text)'}}>{name}</span>
            <span style={{fontSize:9,color:c,fontWeight:500}}>{days}</span>
          </div>
          <div style={{height:3,background:'var(--border)',borderRadius:3,overflow:'hidden'}}>
            <div style={{width:`${pct}%`,height:'100%',background:c,borderRadius:3}}/>
          </div>
        </div>
      ))}
    </div>
    <div style={{fontSize:10,color:'var(--text-3)',textAlign:'center',paddingTop:2}}>Инвентарь предупредит о покупке заранее</div>
  </WMockup>
)

const WIllust5 = () => (
  <WMockup title="SmartSpend / Профиль">
    <div style={{display:'flex',flexDirection:'column',gap:6}}>
      <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:8}}>
        <div style={{flex:1,fontSize:10,color:'var(--text-2)'}}>Конверты (47 000 ₽)</div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="1.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        <div style={{fontSize:10,color:'var(--text-2)'}}>расходы</div>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',background:'var(--accent-green-light)',border:'1px solid var(--accent-green-border)',borderRadius:8}}>
        <div style={{flex:1,fontSize:10,fontWeight:600,color:'var(--accent-green)'}}>Остаток (24 000 ₽)</div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="1.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        <div style={{fontSize:10,fontWeight:600,color:'var(--accent-green)'}}>накопления</div>
      </div>
      <div className="tour-mk-block" style={{textAlign:'center'}}>
        <div className="tour-mk-block-lbl">Размер капитала</div>
        <div className="tour-mk-block-num" style={{fontSize:16}}>186 400 ₽</div>
        <div className="tour-mk-block-sub" style={{color:'var(--accent-green)'}}>↑ растёт каждый месяц</div>
      </div>
    </div>
  </WMockup>
)

const WIllust6 = () => (
  <WMockup title="SmartSpend / EmoSpend">
    <div style={{display:'flex',flexDirection:'column',gap:6}}>
      <div style={{display:'flex',gap:6}}>
        <div className="tour-mk-block" style={{flex:1}}>
          <div className="tour-mk-block-lbl">Капитал</div>
          <div className="tour-mk-block-num">186 400 ₽</div>
          <div className="tour-mk-block-sub">доходность 5%</div>
        </div>
        <div style={{display:'flex',alignItems:'center',color:'var(--text-3)'}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </div>
        <div className="tour-mk-block tour-mk-block--emo" style={{flex:1}}>
          <div className="tour-mk-block-lbl">EmoSpend</div>
          <div className="tour-mk-block-num">775 ₽</div>
          <div className="tour-mk-block-sub">в месяц</div>
        </div>
      </div>
      <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:8,padding:'8px 10px',fontSize:10,color:'var(--text-2)',lineHeight:1.5}}>
        Трать на <strong style={{color:'var(--text)'}}>импульсивные покупки</strong> и <strong style={{color:'var(--text)'}}>непредвиденные расходы</strong> — капитал продолжит расти
      </div>
    </div>
  </WMockup>
)

const WIllust7 = () => {
  const points = [18,22,20,26,24,30,28,36,34,42]
  const max = 42, min = 18, w = 300, h = 70
  const xs = points.map((_,i) => (i/(points.length-1))*w)
  const ys = points.map(v => h - ((v-min)/(max-min))*(h-8) - 4)
  const d = points.map((_, i) => `${i===0?'M':'L'}${xs[i].toFixed(1)},${ys[i].toFixed(1)}`).join(' ')
  const fill = `${d} L${w},${h} L0,${h} Z`
  return (
    <WMockup title="Рост накоплений">
      <div style={{position:'relative',borderRadius:8,overflow:'hidden',background:'var(--surface)',border:'1px solid var(--border)',padding:'10px 12px 8px'}}>
        <div style={{marginBottom:8}}>
          <div><div style={{fontSize:9,color:'var(--text-3)'}}>Капитал через 3 года</div><div style={{fontFamily:'var(--mono)',fontSize:14,fontWeight:600,color:'var(--accent-green)',letterSpacing:'-0.02em'}}>320 000 ₽</div></div>
        </div>
        <svg viewBox={`0 0 ${w} ${h}`} style={{width:'100%',height:70,display:'block'}}>
          <defs>
            <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent-green)" stopOpacity="0.18"/>
              <stop offset="100%" stopColor="var(--accent-green)" stopOpacity="0"/>
            </linearGradient>
          </defs>
          <path d={fill} fill="url(#wg)"/>
          <path d={d} fill="none" stroke="var(--accent-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx={xs[xs.length-1]} cy={ys[ys.length-1]} r="4" fill="var(--accent-green)"/>
        </svg>
        <div style={{display:'flex',justifyContent:'space-between',fontSize:9,color:'var(--text-3)',marginTop:2}}>
          <span>Сейчас</span><span>+1 год</span><span>+2 года</span><span>+3 года</span>
        </div>
      </div>
    </WMockup>
  )
}

const TOUR_STEPS = [
  { illust: <WIllust1/>, title: 'Система конвертов', desc: 'SmartSpend построен на конвертах. Конверт — это направление трат: еда, одежда, техника и другие. Каждый месяц вы откладываете нужную сумму в каждый конверт.' },
  { illust: <WIllust2/>, title: 'Откладывайте регулярно', desc: 'Каждый месяц откладывайте нужную сумму в каждый конверт через своё банковское приложение. SmartSpend показывает сколько нужно — остальное делаете вы.' },
  { illust: <WIllust3/>, title: 'Наборы определяют суммы', desc: 'Выбирайте наборы из каталога, которые описывают ваш образ жизни, или создавайте собственные. Наборы автоматически рассчитают нужную сумму для каждого конверта.' },
  { illust: <WIllust4/>, title: 'Планирование покупок', desc: 'Наборы и инвентарь помогают планировать покупки заранее. Система предупредит, когда подходит время заменить вещь — никаких сюрпризов и импульсивных трат.' },
  { illust: <WIllust5/>, title: 'Остаток идёт в накопления', desc: 'Всё, что остаётся после конвертов, автоматически уходит в накопления. Чем точнее спланированы конверты — тем быстрее растёт ваш капитал.' },
  { illust: <WIllust6/>, title: 'EmoSpend — осознанные траты', desc: 'EmoSpend — это сумма, которую вы разрешаете себе забрать из накоплений. Чем меньше EmoSpend — тем быстрее растёт капитал. Используй его для импульсивных желаний или непредвиденных расходов.' },
  { illust: <WIllust7/>, title: 'Капитал растёт предсказуемо', desc: 'Придерживайтесь системы — и накопления будут расти стабильно каждый месяц. Через несколько лет капитал начнёт работать на вас самостоятельно.' },
]

// ── main component ────────────────────────────────────────────────────────────

export default function WelcomeModal({ open, onDone }) {
  const { dark, toggleTheme } = useApp()
  const [phase, setPhase] = useState('setup') // 'setup' | 'tour'
  const [step, setStep] = useState(0)
  const [tourStep, setTourStep] = useState(0)
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [nameError, setNameError] = useState('')
  const [region, setRegion] = useState('')

  useEffect(() => {
    if (open) { setPhase('setup'); setStep(0); setTourStep(0); setName(''); setUsername(''); setNameError(''); setRegion('') }
  }, [open])

  function handleNameChange(v) {
    setName(v)
    setUsername(toLatinUname(v))
    setNameError('')
  }

  function handleSetupNext() {
    if (step === 0) { setStep(1); return }
    if (step === 1) { setStep(2); return }
    if (step === 2) {
      if (!name.trim()) { setNameError('Введите имя'); return }
      setStep(3); return
    }
    // step 3 → save region and go to tour
    if (region) localStorage.setItem('ss_location', region)
    setPhase('tour')
    setTourStep(0)
  }

  function handleTourFinish() {
    localStorage.setItem('ss_tour_welcome', '1')
    onDone(name.trim(), username || toLatinUname(name.trim()))
  }

  function handleSkipRegion() {
    setPhase('tour')
    setTourStep(0)
  }

  if (!open) return null

  // ── tour phase ─────────────────────────────────────────────────────────────
  if (phase === 'tour') {
    const current = TOUR_STEPS[tourStep]
    const isLast = tourStep === TOUR_STEPS.length - 1
    return (
      <div className="tour-overlay" onClick={handleTourFinish}>
        <div className="tour-modal tour-modal--wide" onClick={e => e.stopPropagation()}>
          <button className="tour-close" onClick={handleTourFinish} aria-label="Закрыть">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="2" y1="2" x2="10" y2="10"/><line x1="10" y1="2" x2="2" y2="10"/>
            </svg>
          </button>
          <div className="tour-illust">{current.illust}</div>
          <div className="tour-step-dots">
            {TOUR_STEPS.map((_, i) => (
              <span key={i} className={`tour-dot${i === tourStep ? ' active' : ''}`} onClick={() => setTourStep(i)} />
            ))}
          </div>
          <div className="tour-title">{current.title}</div>
          <div className="tour-desc">{current.desc}</div>
          <div className="tour-actions">
            {tourStep > 0
              ? <button className="tour-btn-back" onClick={() => setTourStep(s => s - 1)}>Назад</button>
              : <button className="tour-btn-back" onClick={handleTourFinish}>Пропустить</button>
            }
            <button className="tour-btn-next" onClick={isLast ? handleTourFinish : () => setTourStep(s => s + 1)}>
              {isLast ? 'Начать' : 'Далее'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── setup phase ────────────────────────────────────────────────────────────
  return (
    <div className="welcome-overlay">
      <div className="welcome-modal">
        <div className="welcome-dots">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className={`welcome-dot${step === i ? ' active' : step > i ? ' done' : ''}`} />
          ))}
        </div>

        {step === 0 && (
          <div className="welcome-screen">
            <div className="welcome-title">Добро пожаловать!</div>
            <div className="welcome-hint-card">
              <div className="welcome-hint-body">
                <div className="welcome-hint-desc">
                  В самом верху каждой страницы есть кнопка&nbsp;
                  <span className="welcome-hint-demo-btn help-btn--new">?</span>
                  &nbsp;— нажми, чтобы узнать как устроен раздел и что где находится.
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="welcome-screen">
            <div className="welcome-title">Выбери тему</div>
            <div className="welcome-theme-row">
              <button className={`welcome-theme-card${!dark ? ' active' : ''}`} onClick={() => { if (dark) toggleTheme() }}>
                <div className="welcome-theme-preview wtp--light">
                  <div className="wtp-topbar" />
                  <div className="wtp-lines">
                    <div className="wtp-line wtp-line--wide" />
                    <div className="wtp-line" />
                    <div className="wtp-line wtp-line--mid" />
                  </div>
                </div>
                <div className="welcome-theme-label">Светлая</div>
                {!dark && <div className="welcome-theme-check">
                  <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>}
              </button>
              <button className={`welcome-theme-card${dark ? ' active' : ''}`} onClick={() => { if (!dark) toggleTheme() }}>
                <div className="welcome-theme-preview wtp--dark">
                  <div className="wtp-topbar" />
                  <div className="wtp-lines">
                    <div className="wtp-line wtp-line--wide" />
                    <div className="wtp-line" />
                    <div className="wtp-line wtp-line--mid" />
                  </div>
                </div>
                <div className="welcome-theme-label">Тёмная</div>
                {dark && <div className="welcome-theme-check">
                  <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>}
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="welcome-screen">
            <div className="welcome-title">Как тебя зовут?</div>
            <div className="welcome-fields">
              <div className="welcome-field">
                <label className="welcome-label">Имя</label>
                <input
                  className={`welcome-input${nameError ? ' error' : ''}`}
                  type="text" placeholder="Никита"
                  value={name} onChange={e => handleNameChange(e.target.value)}
                  autoFocus
                />
                {nameError && <div className="welcome-error">{nameError}</div>}
              </div>
              <div className="welcome-field">
                <label className="welcome-label">Имя пользователя</label>
                <div className="welcome-input-wrap">
                  <span className="welcome-at">@</span>
                  <input
                    className="welcome-input welcome-input--at"
                    type="text" placeholder="nikita"
                    value={username}
                    onChange={e => setUsername(e.target.value.replace(/[^a-z0-9_]/g, '').slice(0, 20))}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="welcome-screen">
            <div className="welcome-title">Твой регион</div>
            <div className="welcome-sub">Влияет на локальные акции и предложения. Можно пропустить.</div>
            <div className="welcome-fields">
              <div className="welcome-field">
                <label className="welcome-label">Местоположение</label>
                <RegionSearch value={region} onChange={setRegion} />
              </div>
            </div>
          </div>
        )}

        <div className="welcome-footer">
          {step > 0 && (
            <button className="welcome-btn-back" onClick={() => setStep(s => s - 1)}>← Назад</button>
          )}
          {step === 3 && (
            <button className="welcome-btn-skip" onClick={handleSkipRegion}>Пропустить</button>
          )}
          <button className="welcome-btn-next" onClick={handleSetupNext}>
            {step < 3 ? 'Далее →' : 'Продолжить →'}
          </button>
        </div>
      </div>
    </div>
  )
}
