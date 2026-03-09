import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useApp } from '../context/AppContext'

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
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="12" fill="#FC3F1D"/>
      <path d="M13.32 5H11.4C9.12 5 7.8 6.18 7.8 8.06c0 1.68.72 2.62 2.22 3.62L8.1 19h2.4l1.8-5.1h.72L14.82 19h2.4l-2.1-5.68c1.32-.98 2.04-2.02 2.04-3.66 0-3-1.86-4.66-3.84-4.66zm-.3 7.08h-.66V7.02h.66c1.32 0 2.04.84 2.04 2.52 0 1.62-.72 2.54-2.04 2.54z" fill="white"/>
    </svg>
  )
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="6" fill="#0077FF"/>
      <path d="M12.5 16.5h1.2s.37-.04.56-.25c.17-.19.17-.55.17-.55s-.02-1.68.75-1.93c.76-.24 1.73 1.62 2.76 2.34.78.53 1.37.41 1.37.41l2.75-.04s1.44-.09.76-1.23c-.06-.09-.41-.87-2.13-2.46-1.8-1.66-1.55-1.39.6-4.27 1.3-1.73 1.82-2.79 1.66-3.24-.15-.43-1.08-.32-1.08-.32l-3.1.02s-.23-.03-.4.07c-.17.1-.27.33-.27.33s-.5 1.33-1.17 2.47c-1.41 2.4-1.97 2.52-2.2 2.37-.53-.35-.4-1.4-.4-2.14 0-2.32.35-3.28-.68-3.54-.34-.08-.59-.14-1.46-.14-1.12 0-2.06.01-2.6.27-.36.17-.63.56-.46.58.2.03.67.13.91.48.31.45.3 1.45.3 1.45s.18 2.74-.42 3.07c-.41.22-.97-.23-2.18-2.4-.65-1.12-1.14-2.36-1.14-2.36s-.09-.22-.26-.34c-.2-.14-.48-.19-.48-.19L3.1 7.5s-.46.01-.63.21c-.15.18-.01.55-.01.55s2.4 5.62 5.12 8.45c2.49 2.6 5.32 2.43 5.32 2.43l.5-.05z" fill="white"/>
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

  // Notifications
  const [notifs, setNotifs] = useState({ newSets: true, articles: true, reminders: false, weekly: true })

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

        {/* Header */}
        <div>
          <div className="page-title">Настройки</div>
          <div className="page-subtitle">Управление приложением и аккаунтом</div>
        </div>

        {/* Внешний вид */}
        <div className="settings-section">
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
        <div className="settings-section">
          <div className="settings-section-title">Уведомления</div>
          {[
            { key: 'newSets',   label: 'Новые наборы',          desc: 'Когда добавляются новые наборы в каталог' },
            { key: 'articles',  label: 'Статьи от авторов',     desc: 'Когда выходят новые статьи' },
            { key: 'reminders', label: 'Напоминания',           desc: 'Напоминания обновить инвентарь' },
            { key: 'weekly',    label: 'Еженедельный дайджест', desc: 'Краткая сводка за неделю' },
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

        {/* Конфиденциальность */}
        <div className="settings-section">
          <div className="settings-section-title">Конфиденциальность</div>

          <div className="settings-row settings-row-vert">
            <div>
              <div className="settings-row-label">Кто может видеть мои наборы</div>
              <div className="settings-row-desc">Контролируйте доступ к вашим созданным наборам</div>
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
    </Layout>
  )
}
