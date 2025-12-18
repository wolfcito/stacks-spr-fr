import { useEffect, useState } from 'react'
import { Layout } from '@/components/Layout'
import { useStacksWallet } from '@/hooks/useStacksWallet'
import { claimSpray } from '@/lib/claimSpray'
import { getTxUrl, NETWORK } from '@/config/stacks'
import {
  CheckCircleIcon,
  AlertCircleIcon,
  ExternalLinkIcon,
  GiftIcon,
} from '@/components/Icons'

interface Distribution {
  contractAddress: string
  network: string
  token: string
  claims: Record<string, { amount: string }>
}

export default function ClaimPage() {
  const { isConnected, address, connect } = useStacksWallet()
  const [distribution, setDistribution] = useState<Distribution | null>(null)
  const [distributionError, setDistributionError] = useState<string | null>(null)
  const [isLoadingDistribution, setIsLoadingDistribution] = useState(true)
  const [isClaiming, setIsClaiming] = useState(false)
  const [txId, setTxId] = useState<string | null>(null)
  const [claimError, setClaimError] = useState<string | null>(null)

  const networkLabel = NETWORK === 'mainnet' ? 'Mainnet' : 'Testnet'

  useEffect(() => {
    async function loadDistribution() {
      try {
        const response = await fetch('/spray-distribution.json')
        if (!response.ok) {
          throw new Error('Failed to load distribution data')
        }
        const data = await response.json()
        setDistribution(data)
      } catch (error) {
        setDistributionError(
          error instanceof Error ? error.message : 'Failed to load distribution'
        )
      } finally {
        setIsLoadingDistribution(false)
      }
    }
    loadDistribution()
  }, [])

  const eligibleAmount =
    distribution && address ? distribution.claims[address]?.amount : null
  const isEligible = eligibleAmount !== null && eligibleAmount !== undefined

  const handleClaim = async () => {
    setIsClaiming(true)
    setClaimError(null)
    try {
      await claimSpray({
        onFinish: (txId) => {
          setTxId(txId)
          setIsClaiming(false)
        },
        onCancel: () => {
          setIsClaiming(false)
          setClaimError('Transaction was cancelled')
        },
      })
    } catch (error) {
      setIsClaiming(false)
      setClaimError(error instanceof Error ? error.message : 'Failed to claim')
    }
  }

  return (
    <Layout>
      <div className="page-header">
        <p className="page-eyebrow">STACKS SPRAY</p>
        <h1 className="page-title">Reclamar Tokens</h1>
        <p className="page-subtitle">
          Verifica tu elegibilidad y reclama tokens Spray en Stacks {networkLabel}.
        </p>
      </div>

      {/* Connect wallet prompt */}
      {!isConnected && (
        <div className="card">
          <div className="status-box status-box-warning">
            <AlertCircleIcon className="status-icon status-icon-warning" />
            <div className="status-content">
              <p className="status-title status-title-warning">Wallet no conectada</p>
              <p className="status-message status-message-warning">
                Conecta tu wallet para verificar elegibilidad.
              </p>
            </div>
          </div>
          <button className="btn btn-primary" onClick={connect}>
            Conectar Wallet
          </button>
        </div>
      )}

      {/* Eligibility Card */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Elegibilidad</h2>
          <CheckCircleIcon className="card-icon" />
        </div>

        {isLoadingDistribution ? (
          <div className="status-box status-box-warning">
            <span className="spinner status-icon" />
            <div className="status-content">
              <p className="status-message status-message-warning">
                Cargando datos de distribución...
              </p>
            </div>
          </div>
        ) : distributionError ? (
          <div className="status-box status-box-error">
            <AlertCircleIcon className="status-icon status-icon-error" />
            <div className="status-content">
              <p className="status-title status-title-error">Error al cargar</p>
              <p className="status-message status-message-error">
                No se pudo verificar la elegibilidad en este momento. Intenta más tarde.
              </p>
            </div>
          </div>
        ) : !isConnected ? (
          <p className="page-subtitle">
            Conecta tu wallet para verificar elegibilidad
          </p>
        ) : isEligible ? (
          <div className="status-box status-box-success">
            <CheckCircleIcon className="status-icon status-icon-success" />
            <div className="status-content">
              <p className="status-title status-title-success">¡Elegible!</p>
              <p className="status-message status-message-success">
                Puedes reclamar {eligibleAmount} tokens.
              </p>
            </div>
          </div>
        ) : (
          <div className="status-box status-box-warning">
            <AlertCircleIcon className="status-icon status-icon-warning" />
            <div className="status-content">
              <p className="status-title status-title-warning">No elegible</p>
              <p className="status-message status-message-warning">
                Esta dirección no está en la distribución actual de Spray.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Claim Card */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Reclamar</h2>
          <GiftIcon className="card-icon" />
        </div>

        {txId ? (
          <>
            <div className="status-box status-box-success">
              <CheckCircleIcon className="status-icon status-icon-success" />
              <div className="status-content">
                <p className="status-title status-title-success">
                  ¡Transacción enviada!
                </p>
              </div>
            </div>
            <a
              href={getTxUrl(txId)}
              target="_blank"
              rel="noopener noreferrer"
              className="tx-link"
            >
              Ver en Explorer
              <ExternalLinkIcon />
            </a>
          </>
        ) : (
          <>
            <p className="page-subtitle mb-3">
              {!isConnected
                ? 'Estado: Conecta tu wallet para reclamar'
                : !isEligible
                  ? 'Estado: No elegible para reclamar'
                  : 'Estado: Listo para reclamar'}
            </p>

            {claimError && (
              <div className="status-box status-box-error mb-3">
                <AlertCircleIcon className="status-icon status-icon-error" />
                <div className="status-content">
                  <p className="status-message status-message-error">
                    {claimError}
                  </p>
                </div>
              </div>
            )}

            <button
              className="btn btn-primary"
              onClick={handleClaim}
              disabled={!isConnected || !isEligible || isClaiming}
            >
              {isClaiming && <span className="spinner" />}
              {isClaiming ? 'Reclamando...' : 'Reclamar mi Spray'}
              {!isClaiming && <GiftIcon className="btn-icon" />}
            </button>
          </>
        )}
      </div>
    </Layout>
  )
}
