import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Apply theme before first render to avoid flash
const theme = localStorage.getItem('ss_theme') || 'light'
if (theme === 'dark') document.body.classList.add('dark')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
