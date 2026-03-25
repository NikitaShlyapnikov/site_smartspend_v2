import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import SpotlightTour, { HelpButton } from '../components/SpotlightTour'
import { useApp } from '../context/AppContext'

const SETTINGS_SPOTLIGHT = [
  { targetId: 'sp-settings-appear',  btnId: null,                  title: 'Внешний вид',          desc: 'Переключай тёмную и светлую тему — настройка сохраняется автоматически.' },
  { targetId: 'sp-settings-notifs',  btnId: null,                  title: 'Уведомления',          desc: 'Управляй какие уведомления получать: новые наборы, ответы на статьи и напоминания.' },
  { targetId: 'sp-settings-privacy', btnId: null,                  title: 'Конфиденциальность',   desc: 'Выбирай кто видит твой профиль, статьи и наборы — все пользователи, подписчики или только ты.' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }) {
  return (
    <label className="toggle-wrap">
      <input className="toggle-input" type="checkbox" checked={checked} onChange={onChange} />
      <span className="toggle-track"><span className="toggle-thumb" /></span>
    </label>
  )
}

function VisibilitySelect({ value, onChange }) {
  const opts = [
    { id: 'all',       label: 'Все' },
    { id: 'followers', label: 'Подписчики' },
    { id: 'only_me',   label: 'Только я' },
  ]
  return (
    <div className="vis-select">
      {opts.map(o => (
        <button key={o.id} className={`vis-btn${value === o.id ? ' active' : ''}`} onClick={() => onChange(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

function SocialIcon({ provider }) {
  if (provider === 'yandex') return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2.04 12c0-5.523 4.476-10 10-10 5.522 0 10 4.477 10 10s-4.478 10-10 10c-5.524 0-10-4.477-10-10z" fill="#FC3F1D"/>
      <path d="M13.32 7.666h-.924c-1.694 0-2.585.858-2.585 2.123 0 1.43.616 2.1 1.881 2.959l1.045.704-3.003 4.487H7.49l2.695-4.014c-1.55-1.111-2.42-2.19-2.42-4.015 0-2.288 1.595-3.85 4.62-3.85h3.003v11.868H13.32V7.666z" fill="#fff"/>
    </svg>
  )
  return (
    <svg width="18" height="18" viewBox="0 0 1024 1024" fill="none">
      <path d="M179.929 32h664.142C925.767 32 992 98.23 992 179.929v664.142C992 925.767 925.767 992 844.071 992H179.929C98.23 992 32 925.767 32 844.071V179.929C32 98.23 98.23 32 179.929 32z" fill="#4c75a3"/>
      <path d="M503.946 704.029h39.269s11.859-1.307 17.922-7.831c5.573-5.997 5.395-17.25 5.395-17.25s-.768-52.692 23.683-60.451c24.113-7.648 55.07 50.924 87.879 73.448 24.812 17.039 43.667 13.31 43.667 13.31l87.739-1.226s45.895-2.832 24.132-38.918c-1.781-2.947-12.678-26.693-65.238-75.479-55.019-51.063-47.643-42.802 18.627-131.129 40.359-53.79 56.49-86.628 51.449-100.691-5.003-13.4-34.69-9.86-34.69-9.86l-98.785.611s-7.329-.997-12.757 2.251c-5.309 3.176-8.717 10.598-8.717 10.598s-15.641 41.622-36.486 77.025c-43.988 74.693-61.58 78.647-68.77 74.002-16.729-10.811-12.549-43.422-12.549-66.596 0-72.389 10.98-102.57-21.381-110.383-10.737-2.591-18.647-4.305-46.11-4.585-35.25-.358-65.078.109-81.971 8.384-11.239 5.504-19.91 17.765-14.626 18.471 6.531.87 21.314 4.99 29.152 15.656 10.126 13.777 9.772 44.703 9.772 44.703s5.818 85.212-13.585 95.794c-13.314 7.26-31.581-7.56-70.799-75.327-20.09-34.711-35.264-73.085-35.264-73.085s-2.922-7.169-8.141-11.007c-6.33-4.65-15.174-6.124-15.174-6.124l-93.876.613s-14.089.393-19.267 6.522c-4.606 5.455-.368 16.724-.368 16.724s73.49 171.942 156.711 258.591c76.315 79.454 162.957 74.24 162.957 74.24z" fill="#fff"/>
    </svg>
  )
}

// ── Modals ────────────────────────────────────────────────────────────────────

function ConfirmModal({ open, title, body, confirmLabel, danger, onConfirm, onClose, requireWord }) {
  const [inputVal, setInputVal] = useState('')
  const canConfirm = !requireWord || inputVal === requireWord

  if (!open) return null
  return (
    <div className="inv-modal-overlay" onClick={onClose}>
      <div className="inv-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 380 }}>
        <div className="inv-modal-title">{title}</div>
        <div className="inv-modal-body">{body}</div>
        {requireWord && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 6 }}>
              Введите <strong>{requireWord}</strong> для подтверждения:
            </div>
            <input
              className="auth-input"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              placeholder={requireWord}
              autoFocus
            />
          </div>
        )}
        <div className="inv-modal-actions">
          <button className="inv-modal-btn" onClick={onClose}>Отмена</button>
          <button className={`inv-modal-btn${danger ? ' danger' : ''}`} onClick={onConfirm} disabled={!canConfirm}
            style={{ opacity: canConfirm ? 1 : 0.4 }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function ChangeEmailModal({ open, onClose }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [done, setDone] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (!email || !password) return
    setDone(true)
  }

  function handleClose() {
    setEmail(''); setPassword(''); setDone(false)
    onClose()
  }

  if (!open) return null
  return (
    <div className="inv-modal-overlay" onClick={handleClose}>
      <div className="inv-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 380 }}>
        <div className="inv-modal-title">{done ? 'Письмо отправлено' : 'Изменить email'}</div>
        {done ? (
          <>
            <div className="inv-modal-body">
              Ссылка для подтверждения нового адреса отправлена на <strong>{email}</strong>. Перейдите по ссылке, чтобы завершить смену.
            </div>
            <div className="inv-modal-actions">
              <button className="inv-modal-btn" onClick={handleClose}>Понятно</button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="inv-modal-body" style={{ paddingBottom: 0 }}>
              <div className="auth-field" style={{ marginBottom: 10 }}>
                <label className="auth-label">Новый email</label>
                <input className="auth-input" type="email" placeholder="new@email.com"
                  value={email} onChange={e => setEmail(e.target.value)} autoFocus />
              </div>
              <div className="auth-field">
                <label className="auth-label">Текущий пароль</label>
                <input className="auth-input" type="password" placeholder="Для подтверждения"
                  value={password} onChange={e => setPassword(e.target.value)} />
              </div>
            </div>
            <div className="inv-modal-actions">
              <button type="button" className="inv-modal-btn" onClick={handleClose}>Отмена</button>
              <button type="submit" className="inv-modal-btn" disabled={!email || !password}
                style={{ opacity: email && password ? 1 : 0.4 }}>
                Отправить письмо
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

function ChangePasswordModal({ open, onClose }) {
  const [form, setForm] = useState({ current: '', next: '', confirm: '' })
  const [show, setShow] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const set = k => v => setForm(p => ({ ...p, [k]: v }))

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.current || !form.next) return
    if (form.next !== form.confirm) { setError('Пароли не совпадают'); return }
    if (form.next.length < 8) { setError('Минимум 8 символов'); return }
    setError('')
    setDone(true)
  }

  function handleClose() {
    setForm({ current: '', next: '', confirm: '' }); setDone(false); setError('')
    onClose()
  }

  if (!open) return null
  return (
    <div className="inv-modal-overlay" onClick={handleClose}>
      <div className="inv-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 380 }}>
        <div className="inv-modal-title">{done ? 'Пароль изменён' : 'Сменить пароль'}</div>
        {done ? (
          <>
            <div className="inv-modal-body">Пароль успешно обновлён. Используйте новый пароль при следующем входе.</div>
            <div className="inv-modal-actions">
              <button className="inv-modal-btn" onClick={handleClose}>Готово</button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="inv-modal-body" style={{ paddingBottom: 0 }}>
              {[
                { key: 'current', label: 'Текущий пароль', ph: 'Введите текущий пароль' },
                { key: 'next',    label: 'Новый пароль',   ph: 'Минимум 8 символов' },
                { key: 'confirm', label: 'Повторите новый', ph: 'Повторите новый пароль' },
              ].map(({ key, label, ph }) => (
                <div key={key} className="auth-field" style={{ marginBottom: 10 }}>
                  <label className="auth-label">{label}</label>
                  <div className="auth-pass-wrap">
                    <input className="auth-input" type={show ? 'text' : 'password'}
                      placeholder={ph} value={form[key]} onChange={e => set(key)(e.target.value)} />
                    <button type="button" className="auth-pass-toggle" onClick={() => setShow(v => !v)} tabIndex={-1}>
                      {show
                        ? <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        : <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      }
                    </button>
                  </div>
                </div>
              ))}
              {error && <div style={{ fontSize: 12, color: '#C84848', marginBottom: 8 }}>{error}</div>}
            </div>
            <div className="inv-modal-actions">
              <button type="button" className="inv-modal-btn" onClick={handleClose}>Отмена</button>
              <button type="submit" className="inv-modal-btn"
                disabled={!form.current || !form.next || !form.confirm}
                style={{ opacity: form.current && form.next && form.confirm ? 1 : 0.4 }}>
                Изменить пароль
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Settings() {
  const navigate = useNavigate()
  const { dark, toggleTheme } = useApp()
  const [showSpotlight, setShowSpotlight] = useState(false)

  // Notifications
  const [notifs, setNotifs] = useState({ newSets: true, articles: true, reminders: false })

  // Timezone
  const [timezone, setTimezone] = useState(() => localStorage.getItem('ss_timezone') || 'Europe/Moscow')

  // Location
  const [location, setLocation] = useState(() => localStorage.getItem('ss_location') || '')

  // Privacy
  const [privacy, setPrivacy] = useState({ sets: 'all', articles: 'all', profile: 'all' })
  const setPriv = k => v => setPrivacy(p => ({ ...p, [k]: v }))

  // Security
  const currentEmail = localStorage.getItem('ss_email') || 'user@example.com'
  const [socials, setSocials] = useState({ yandex: false, vk: false })

  // Modals
  const [emailModal, setEmailModal]   = useState(false)
  const [passModal,  setPassModal]    = useState(false)
  const [logoutModal, setLogoutModal] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)

  function logout() {
    localStorage.removeItem('ss_auth')
    localStorage.removeItem('ss_username')
    navigate('/', { replace: true })
  }

  function deleteAccount() {
    localStorage.clear()
    navigate('/', { replace: true })
  }

  function toggleSocial(provider) {
    setSocials(p => ({ ...p, [provider]: !p[provider] }))
  }

  return (
    <Layout>
      <main className="settings-main">
      <div className="settings-inner">

        {/* Header */}
        <div>
          <div className="page-title" style={{display:'flex',alignItems:'center',gap:10}}>
            Настройки
            <HelpButton seenKey="ss_spl_settings" onOpen={() => setShowSpotlight(true)} />
          </div>
          <div className="page-subtitle">Управление приложением и аккаунтом</div>
        </div>

        {/* Лента — Промо */}
        <div className="settings-section">
          <div className="settings-section-title">Лента — Промо</div>
          <div className="settings-row">
            <div>
              <div className="settings-row-label">Мои компании</div>
              <div className="settings-row-desc">Компании, чьи акции и рассылку вы видите в ленте</div>
            </div>
            <button
              className="settings-link-btn"
              onClick={() => navigate('/company-picker', { state: { edit: true } })}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Изменить
            </button>
          </div>
        </div>

        {/* Внешний вид */}
        <div id="sp-settings-appear" className="settings-section">
          <div className="settings-section-title">Внешний вид</div>
          <div className="settings-row">
            <div>
              <div className="settings-row-label">Тёмная тема</div>
              <div className="settings-row-desc">Переключить оформление приложения</div>
            </div>
            <Toggle checked={dark} onChange={toggleTheme} />
          </div>
        </div>

        {/* Уведомления */}
        <div id="sp-settings-notifs" className="settings-section">
          <div className="settings-section-title">Уведомления</div>
          {[
            { key: 'newSets',   label: 'Новые наборы',      desc: 'Когда добавляются новые наборы в каталог' },
            { key: 'articles',  label: 'Статьи от авторов', desc: 'Когда выходят новые статьи' },
            { key: 'reminders', label: 'Напоминания',       desc: 'Напоминания обновить инвентарь' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="settings-row">
              <div>
                <div className="settings-row-label">{label}</div>
                <div className="settings-row-desc">{desc}</div>
              </div>
              <Toggle checked={notifs[key]} onChange={() => setNotifs(n => ({ ...n, [key]: !n[key] }))} />
            </div>
          ))}
        </div>

        {/* Часовой пояс + Локация */}
        <div className="settings-section">
          <div className="settings-section-title">Региональные настройки</div>
          <div className="settings-row">
            <div>
              <div className="settings-row-label">Часовой пояс</div>
              <div className="settings-row-desc">Используется для расчёта напоминаний и временных меток</div>
            </div>
            <select
              className="settings-tz-select"
              value={timezone}
              onChange={e => { setTimezone(e.target.value); localStorage.setItem('ss_timezone', e.target.value) }}
            >
              <option value="Europe/Kaliningrad">UTC+2 — Калининград</option>
              <option value="Europe/Moscow">UTC+3 — Москва, Санкт-Петербург</option>
              <option value="Europe/Samara">UTC+4 — Самара, Ижевск</option>
              <option value="Asia/Yekaterinburg">UTC+5 — Екатеринбург</option>
              <option value="Asia/Omsk">UTC+6 — Омск</option>
              <option value="Asia/Krasnoyarsk">UTC+7 — Красноярск, Новосибирск</option>
              <option value="Asia/Irkutsk">UTC+8 — Иркутск</option>
              <option value="Asia/Yakutsk">UTC+9 — Якутск</option>
              <option value="Asia/Vladivostok">UTC+10 — Владивосток</option>
              <option value="Asia/Magadan">UTC+11 — Магадан</option>
              <option value="Asia/Kamchatka">UTC+12 — Камчатка</option>
            </select>
          </div>
          <div className="settings-row">
            <div>
              <div className="settings-row-label">Местоположение</div>
              <div className="settings-row-desc">Влияет на локальные акции и предложения в вашем регионе</div>
            </div>
            <select
              className="settings-tz-select"
              value={location}
              onChange={e => { setLocation(e.target.value); localStorage.setItem('ss_location', e.target.value) }}
            >
              <option value="">Не указано</option>
              <optgroup label="Крупные города">
                <option value="moscow">Москва</option>
                <option value="spb">Санкт-Петербург</option>
                <option value="novosibirsk">Новосибирск</option>
                <option value="ekaterinburg">Екатеринбург</option>
                <option value="kazan">Казань</option>
                <option value="nizhny">Нижний Новгород</option>
                <option value="chelyabinsk">Челябинск</option>
                <option value="samara">Самара</option>
                <option value="omsk">Омск</option>
                <option value="rostov">Ростов-на-Дону</option>
                <option value="ufa">Уфа</option>
                <option value="krasnoyarsk">Красноярск</option>
                <option value="voronezh">Воронеж</option>
                <option value="perm">Пермь</option>
                <option value="volgograd">Волгоград</option>
              </optgroup>
              <optgroup label="Области и регионы">
                <option value="adygeya">Республика Адыгея</option>
                <option value="altay_r">Республика Алтай</option>
                <option value="altaysky">Алтайский край</option>
                <option value="amurskaya">Амурская область</option>
                <option value="arhangelskaya">Архангельская область</option>
                <option value="astrahanskaya">Астраханская область</option>
                <option value="bashkortostan">Республика Башкортостан</option>
                <option value="belgorodskaya">Белгородская область</option>
                <option value="bryanskaya">Брянская область</option>
                <option value="buryatiya">Республика Бурятия</option>
                <option value="vladimirskaya">Владимирская область</option>
                <option value="volgogradskaya">Волгоградская область</option>
                <option value="vologodskaya">Вологодская область</option>
                <option value="voronezhskaya">Воронежская область</option>
                <option value="dagestan">Республика Дагестан</option>
                <option value="evrey">Еврейская автономная область</option>
                <option value="zabaykalsky">Забайкальский край</option>
                <option value="ivanovskaya">Ивановская область</option>
                <option value="ingushetiya">Республика Ингушетия</option>
                <option value="irkutskaya">Иркутская область</option>
                <option value="kabardino">Кабардино-Балкарская Республика</option>
                <option value="kalinigradskaya">Калининградская область</option>
                <option value="kalmykiya">Республика Калмыкия</option>
                <option value="kaluzhskaya">Калужская область</option>
                <option value="kamchatsky">Камчатский край</option>
                <option value="karachayevo">Карачаево-Черкесская Республика</option>
                <option value="kareliya">Республика Карелия</option>
                <option value="kemerovskaya">Кемеровская область</option>
                <option value="kirovskaya">Кировская область</option>
                <option value="komi">Республика Коми</option>
                <option value="kostromskaya">Костромская область</option>
                <option value="krasnodarsky">Краснодарский край</option>
                <option value="krasnoyarsky">Красноярский край</option>
                <option value="kurganskaya">Курганская область</option>
                <option value="kurskaya">Курская область</option>
                <option value="leningradskaya">Ленинградская область</option>
                <option value="lipetskaya">Липецкая область</option>
                <option value="magadanskaya">Магаданская область</option>
                <option value="mariy_el">Республика Марий Эл</option>
                <option value="mordoviya">Республика Мордовия</option>
                <option value="moskovskaya">Московская область</option>
                <option value="murmanskaya">Мурманская область</option>
                <option value="nenets">Ненецкий автономный округ</option>
                <option value="nizhegorodskaya">Нижегородская область</option>
                <option value="novgorodskaya">Новгородская область</option>
                <option value="novosibirskaya">Новосибирская область</option>
                <option value="omskaya">Омская область</option>
                <option value="orenburgskaya">Оренбургская область</option>
                <option value="orlovskaya">Орловская область</option>
                <option value="penzenskaya">Пензенская область</option>
                <option value="permsky">Пермский край</option>
                <option value="primorsky">Приморский край</option>
                <option value="pskovskaya">Псковская область</option>
                <option value="rostovskaya">Ростовская область</option>
                <option value="ryazanskaya">Рязанская область</option>
                <option value="samarskaya">Самарская область</option>
                <option value="saratovskaya">Саратовская область</option>
                <option value="sakha">Республика Саха (Якутия)</option>
                <option value="sakhalinskaya">Сахалинская область</option>
                <option value="sverdlovskaya">Свердловская область</option>
                <option value="severnaya_osetiya">Республика Северная Осетия — Алания</option>
                <option value="smolenskaya">Смоленская область</option>
                <option value="stavropolsky">Ставропольский край</option>
                <option value="tambovskaya">Тамбовская область</option>
                <option value="tatarstan">Республика Татарстан</option>
                <option value="tverskaya">Тверская область</option>
                <option value="tomskaya">Томская область</option>
                <option value="tulskaya">Тульская область</option>
                <option value="tyva">Республика Тыва</option>
                <option value="tyumenskaya">Тюменская область</option>
                <option value="udmurtiya">Удмуртская Республика</option>
                <option value="ulyanovskaya">Ульяновская область</option>
                <option value="khabarovsk">Хабаровский край</option>
                <option value="khakasiya">Республика Хакасия</option>
                <option value="khanty">Ханты-Мансийский автономный округ</option>
                <option value="chelyabinskaya">Челябинская область</option>
                <option value="chechnya">Чеченская Республика</option>
                <option value="chuvashiya">Чувашская Республика</option>
                <option value="chukotka">Чукотский автономный округ</option>
                <option value="yamalo">Ямало-Ненецкий автономный округ</option>
                <option value="yaroslavskaya">Ярославская область</option>
              </optgroup>
            </select>
          </div>
        </div>

        {/* Конфиденциальность */}
        <div id="sp-settings-privacy" className="settings-section">
          <div className="settings-section-title">Конфиденциальность</div>

          <div className="settings-row settings-row-vert">
            <div>
              <div className="settings-row-label">Кто может видеть мои наборы</div>
              <div className="settings-row-desc">Личные наборы всегда видны только вам</div>
            </div>
            <VisibilitySelect value={privacy.sets} onChange={setPriv('sets')} />
          </div>

          <div className="settings-row settings-row-vert">
            <div>
              <div className="settings-row-label">Кто может видеть мои статьи</div>
              <div className="settings-row-desc">Статьи в черновике всегда видны только вам</div>
            </div>
            <VisibilitySelect value={privacy.articles} onChange={setPriv('articles')} />
          </div>

          <div className="settings-row settings-row-vert">
            <div>
              <div className="settings-row-label">Кто может видеть мой профиль</div>
              <div className="settings-row-desc">Имя, аватар, подписки и активность</div>
            </div>
            <VisibilitySelect value={privacy.profile} onChange={setPriv('profile')} />
          </div>
        </div>

        {/* Аккаунт и безопасность */}
        <div className="settings-section">
          <div className="settings-section-title">Аккаунт и безопасность</div>

          {/* Email */}
          <div className="settings-row">
            <div>
              <div className="settings-row-label">Электронная почта</div>
              <div className="settings-row-desc settings-row-value">{currentEmail}</div>
            </div>
            <button className="settings-action-btn" onClick={() => setEmailModal(true)}>
              Изменить
            </button>
          </div>

          {/* Password */}
          <div className="settings-row">
            <div>
              <div className="settings-row-label">Пароль</div>
              <div className="settings-row-desc">
                <span className="pass-dots">••••••••</span> Последнее изменение: недавно
              </div>
            </div>
            <button className="settings-action-btn" onClick={() => setPassModal(true)}>
              Сменить
            </button>
          </div>

          {/* Connected accounts */}
          <div className="settings-conn-accounts">
            <div className="settings-conn-title">Привязанные аккаунты</div>

            <div className="settings-conn-row">
              <div className="settings-conn-left">
                <SocialIcon provider="yandex" />
                <div>
                  <div className="settings-row-label">Яндекс ID</div>
                  <div className="settings-row-desc">
                    {socials.yandex
                      ? <span className="conn-status connected">Привязан</span>
                      : <span className="conn-status">Не привязан</span>}
                  </div>
                </div>
              </div>
              <button
                className={`settings-action-btn${socials.yandex ? ' disconnect' : ''}`}
                onClick={() => toggleSocial('yandex')}
              >
                {socials.yandex ? 'Отвязать' : 'Привязать'}
              </button>
            </div>

            <div className="settings-conn-row">
              <div className="settings-conn-left">
                <SocialIcon provider="vk" />
                <div>
                  <div className="settings-row-label">VK (Max)</div>
                  <div className="settings-row-desc">
                    {socials.vk
                      ? <span className="conn-status connected">Привязан</span>
                      : <span className="conn-status">Не привязан</span>}
                  </div>
                </div>
              </div>
              <button
                className={`settings-action-btn${socials.vk ? ' disconnect' : ''}`}
                onClick={() => toggleSocial('vk')}
              >
                {socials.vk ? 'Отвязать' : 'Привязать'}
              </button>
            </div>
          </div>
        </div>

        {/* Опасная зона */}
        <div className="settings-section settings-danger-zone">
          <div className="settings-section-title">Опасная зона</div>

          <div className="settings-row">
            <div>
              <div className="settings-row-label">Выйти из аккаунта</div>
              <div className="settings-row-desc">Завершить сеанс на этом устройстве</div>
            </div>
            <button className="btn-danger" onClick={() => setLogoutModal(true)}>Выйти</button>
          </div>

          <div className="settings-row">
            <div>
              <div className="settings-row-label settings-row-label-danger">Удалить аккаунт</div>
              <div className="settings-row-desc">Все данные, наборы и статьи будут удалены без возможности восстановления</div>
            </div>
            <button className="btn-danger btn-danger-ghost" onClick={() => setDeleteModal(true)}>Удалить</button>
          </div>
        </div>

      </div>
      </main>

      {/* Modals */}
      <ChangeEmailModal open={emailModal} onClose={() => setEmailModal(false)} />
      <ChangePasswordModal open={passModal} onClose={() => setPassModal(false)} />

      <ConfirmModal
        open={logoutModal}
        title="Выйти из аккаунта?"
        body="Вы будете перенаправлены на страницу входа. Все несохранённые данные будут потеряны."
        confirmLabel="Выйти"
        danger
        onConfirm={logout}
        onClose={() => setLogoutModal(false)}
      />

      <ConfirmModal
        open={deleteModal}
        title="Удалить аккаунт?"
        body="Это действие необратимо. Все ваши наборы, статьи, инвентарь и настройки будут удалены навсегда."
        confirmLabel="Удалить навсегда"
        danger
        requireWord="УДАЛИТЬ"
        onConfirm={deleteAccount}
        onClose={() => setDeleteModal(false)}
      />
      {showSpotlight && <SpotlightTour steps={SETTINGS_SPOTLIGHT} onClose={() => setShowSpotlight(false)} />}
    </Layout>
  )
}
