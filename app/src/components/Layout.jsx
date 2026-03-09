import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import Sidebar from './Sidebar'
import MobileNav from './MobileNav'

export default function Layout({ children }) {
  const { collapsed } = useApp()
  const navigate = useNavigate()

  useEffect(() => {
    const auth = localStorage.getItem('ss_auth')
    if (auth !== 'true') {
      navigate('/?auth=1', { replace: true })
    }
  }, [navigate])

  useEffect(() => {
    document.body.classList.add('app-body')
    return () => document.body.classList.remove('app-body')
  }, [])

  useEffect(() => {
    document.body.classList.toggle('sidebar-collapsed', collapsed)
  }, [collapsed])

  return (
    <>
      <Sidebar />
      <MobileNav />
      {children}
    </>
  )
}
