import { Link } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { useStacksWallet } from '@/hooks/useStacksWallet'
import { NETWORK } from '@/config/stacks'
import {
  WalletIcon,
  BroadcastIcon,
  CheckCircleIcon,
  CopyIcon,
  LogOutIcon,
  ArrowRightIcon,
  CubeIcon,
} from '@/components/Icons'
import { useState } from 'react'

export default function HomePage() {
  const { isConnected, address, connect, disconnect } = useStacksWallet()
  const [copied, setCopied] = useState(false)

  const networkLabel = NETWORK === 'mainnet' ? 'Mainnet' : 'Testnet'
  const badgeClass = NETWORK === 'mainnet' ? 'badge-mainnet' : 'badge-testnet'

  const truncateAddress = (addr: string) => {
    if (!addr) return ''
    return `${addr.slice(0, 10)}...${addr.slice(-8)}`
  }

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">Wallet &<br />Tokens</h1>
        <p className="page-subtitle">
          Administra tus activos digitales en la red Stacks de forma sencilla.
        </p>
      </div>

      {/* Wallet Card */}
      <div className="card card-lg card-gradient">
        <div className="card-watermark">
          <CubeIcon />
        </div>

        <div className="card-header">
          {isConnected ? (
            <div className="connected-indicator">
              <span className="connected-dot" />
              Wallet Conectada
            </div>
          ) : (
            <h2 className="card-title">
              <WalletIcon className="card-icon" />
              Wallet
            </h2>
          )}
          <span className={`badge ${badgeClass}`}>
            STACKS {networkLabel.toUpperCase()}
          </span>
        </div>

        {isConnected ? (
          <>
            <div className="address-display">
              <span className="address-text">{truncateAddress(address || '')}</span>
              <button
                className="copy-btn"
                onClick={copyAddress}
                aria-label={copied ? 'Copiado' : 'Copiar dirección'}
              >
                {copied ? <CheckCircleIcon /> : <CopyIcon />}
              </button>
            </div>
            <button className="btn btn-secondary" onClick={disconnect}>
              <LogOutIcon className="btn-icon" />
              Desconectar
            </button>
          </>
        ) : (
          <>
            <p className="page-subtitle mb-3">
              Conecta tu wallet para acceder a todas las funciones.
            </p>
            <button className="btn btn-primary" onClick={connect}>
              Conectar Wallet
            </button>
          </>
        )}
      </div>

      {/* Action Cards */}
      <div className="action-card">
        <div className="action-icon">
          <BroadcastIcon />
        </div>
        <h3 className="action-title">Dispersar Tokens</h3>
        <p className="action-description">
          Envía STX o tokens SIP-010 a múltiples destinatarios en una sola transacción.
        </p>
        <Link to="/disperse" className="btn btn-primary">
          Ir a Dispersar
          <ArrowRightIcon className="btn-icon" />
        </Link>
      </div>

      <div className="action-card">
        <div className="action-icon">
          <CheckCircleIcon />
        </div>
        <h3 className="action-title">Reclamar Tokens</h3>
        <p className="action-description">
          Verifica tu elegibilidad y reclama tus tokens de Stacks Spray.
        </p>
        <Link to="/claim" className="btn btn-outline">
          Ir a Reclamar
          <ArrowRightIcon className="btn-icon" />
        </Link>
      </div>
    </Layout>
  )
}
