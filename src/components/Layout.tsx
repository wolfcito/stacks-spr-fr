import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LogoIcon,
  MoonIcon,
  SunIcon,
  WalletIcon,
  BroadcastIcon,
  GiftIcon,
} from './Icons'

interface LayoutProps {
  children: ReactNode
  showNav?: boolean
}

export function Layout({ children, showNav = true }: LayoutProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme')
      if (saved === 'dark' || saved === 'light') return saved
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'light'
  })

  const location = useLocation()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="logo">
          <LogoIcon className="logo-icon" />
          <span>STACKS SPRAY</span>
        </div>
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? <MoonIcon /> : <SunIcon />}
        </button>
      </header>

      <main className="main-content">
        {children}
      </main>

      <footer className="app-footer">
        STACKS SPRAY V1.0.2
      </footer>

      {showNav && (
        <nav className="bottom-nav" aria-label="Main navigation">
          <NavLink
            to="/disperse"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <BroadcastIcon />
            <span>Dispersar</span>
          </NavLink>
          <NavLink
            to="/claim"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <GiftIcon />
            <span>Reclamar</span>
          </NavLink>
          <NavLink
            to="/"
            className={() => `nav-item ${location.pathname === '/' ? 'active' : ''}`}
          >
            <WalletIcon />
            <span>Wallet</span>
          </NavLink>
        </nav>
      )}
    </div>
  )
}
