import { useState } from 'react'
import Layout from '../components/Layout'
import { useApp } from '../context/AppContext'

export default function Account() {
  const { username, setUsername } = useApp()
  const [editing, setEditing] = useState(false)
  const [nameVal, setNameVal] = useState(username)

  function saveName() {
    const trimmed = nameVal.trim()
    if (trimmed) {
      setUsername(trimmed)
      localStorage.setItem('ss_username', trimmed)
    }
    setEditing(false)
  }

  return (
    <Layout>
      <main className="account-main">
        <div>
          <div className="page-title">Аккаунт и безопасность</div>
          <div className="page-subtitle">Управление личными данными и безопасностью</div>
        </div>

        <div className="account-section">
          <div className="account-section-title">Личные данные</div>
          <div className="account-row">
            <div>
              <div className="account-row-label">Имя</div>
              {editing ? (
                <input
                  style={{ marginTop: 4, padding: '6px 10px', borderRadius: 8, border: '1px solid var(--accent-green)', background: 'var(--surface-2)', fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--text)', outline: 'none', width: 220 }}
                  value={nameVal}
                  onChange={e => setNameVal(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditing(false) }}
                  autoFocus
                />
              ) : (
                <div className="account-row-value">{username}</div>
              )}
            </div>
            {editing ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-sm" onClick={() => setEditing(false)}>Отмена</button>
                <button className="btn-sm" style={{ background: 'var(--accent-green)', color: 'white', borderColor: 'var(--accent-green)' }} onClick={saveName}>Сохранить</button>
              </div>
            ) : (
              <button className="btn-sm" onClick={() => { setNameVal(username); setEditing(true) }}>Изменить</button>
            )}
          </div>
          <div className="account-row">
            <div>
              <div className="account-row-label">Email</div>
              <div className="account-row-value" style={{ fontSize: 13, color: 'var(--text-2)' }}>demo@smartspend.ru</div>
            </div>
            <button className="btn-sm">Изменить</button>
          </div>
          <div className="account-row">
            <div>
              <div className="account-row-label">Тарифный план</div>
              <div className="account-row-value" style={{ fontSize: 13, color: 'var(--text-2)' }}>Базовый</div>
            </div>
            <button className="btn-sm">Обновить</button>
          </div>
        </div>

        <div className="account-section">
          <div className="account-section-title">Безопасность</div>
          <div className="account-row">
            <div>
              <div className="account-row-label">Пароль</div>
              <div className="account-row-value" style={{ fontSize: 13, color: 'var(--text-2)' }}>Последнее изменение: никогда</div>
            </div>
            <button className="btn-sm">Изменить</button>
          </div>
          <div className="account-row">
            <div>
              <div className="account-row-label">Двухфакторная аутентификация</div>
              <div className="account-row-value" style={{ fontSize: 13, color: 'var(--text-2)' }}>Не включена</div>
            </div>
            <button className="btn-sm">Включить</button>
          </div>
        </div>

        <div className="account-section">
          <div className="account-section-title">Данные</div>
          <div className="account-row">
            <div>
              <div className="account-row-label">Экспорт данных</div>
              <div className="account-row-value" style={{ fontSize: 13, color: 'var(--text-2)' }}>Скачать все ваши данные</div>
            </div>
            <button className="btn-sm">Экспорт</button>
          </div>
          <div className="account-row">
            <div>
              <div className="account-row-label" style={{ color: '#C0392B' }}>Удалить аккаунт</div>
              <div className="account-row-value" style={{ fontSize: 13, color: 'var(--text-2)' }}>Это действие необратимо</div>
            </div>
            <button className="btn-danger">Удалить</button>
          </div>
        </div>
      </main>
    </Layout>
  )
}
