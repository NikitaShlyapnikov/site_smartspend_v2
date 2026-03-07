import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './context/AppContext'

import Landing from './pages/Landing'
import Feed from './pages/Feed'
import Catalog from './pages/Catalog'
import Inventory from './pages/Inventory'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import Account from './pages/Account'
import Notifications from './pages/Notifications'
import SetDetail from './pages/SetDetail'
import Article from './pages/Article'
import CreateSet from './pages/CreateSet'
import CreateArticle from './pages/CreateArticle'

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/account" element={<Account />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/set/:id" element={<SetDetail />} />
          <Route path="/article/:id" element={<Article />} />
          <Route path="/create-set" element={<CreateSet />} />
          <Route path="/create-article" element={<CreateArticle />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AppProvider>
  )
}
