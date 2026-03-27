import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import MobileNav from './MobileNav'
import AuthModal from './AuthModal'

export default function Layout({ children }) {
  const { collapsed, setUsername } = useApp()
  const navigate = useNavigate()
  const [authed, setAuthed] = useState(localStorage.getItem('ss_auth') === 'true')

  useEffect(() => {
    document.body.classList.add('app-body')
    return () => document.body.classList.remove('app-body')
  }, [])

  useEffect(() => {
    document.body.classList.toggle('sidebar-collapsed', collapsed)
  }, [collapsed])

  function handleAuth(name) {
    localStorage.setItem('ss_auth', 'true')
    localStorage.setItem('ss_username', name)
    setUsername(name)
    setAuthed(true)
  }

  if (!authed) {
    return (
      <AuthModal
        open={true}
        dismissable={false}
        onClose={() => navigate(-1)}
        onAuth={handleAuth}
        defaultTab="login"
      />
    )
  }

  return (
    <>
      <Sidebar />
      <MobileNav />
      <div className="app-content">{children}</div>
    </>
  )
}
