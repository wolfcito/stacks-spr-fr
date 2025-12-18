import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import HomePage from './pages/HomePage'
import ClaimPage from './pages/ClaimPage'
import DispersePage from './pages/DispersePage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/claim" element={<ClaimPage />} />
        <Route path="/disperse" element={<DispersePage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
