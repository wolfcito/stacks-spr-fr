import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { useStacksWallet } from '@/hooks/useStacksWallet'
import { claimSpray } from '@/lib/claimSpray'
import { getTxUrl, NETWORK } from '@/config/stacks'
import {
  WalletIcon,
  CheckCircleIcon,
  CopyIcon,
  ArrowLeftIcon,
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
  const { isConnected, address, connect, disconnect } = useStacksWallet()
  const [distribution, setDistribution] = useState<Distribution | null>(null)
  const [distributionError, setDistributionError] = useState<string | null>(null)
  const [isLoadingDistribution, setIsLoadingDistribution] = useState(true)
  const [isClaiming, setIsClaiming] = useState(false)
  const [txId, setTxId] = useState<string | null>(null)
  const [claimError, setClaimError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const networkLabel = NETWORK === 'mainnet' ? 'Mainnet' : 'Testnet'
  const badgeClass = NETWORK === 'mainnet' ? 'badge-mainnet' : 'badge-testnet'

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

  const truncateAddress = (addr: string) => {
    if (!addr) return ''
    return `${addr.slice(0, 20)}...`
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
      <Link to="/" className="back-link">
        <ArrowLeftIcon />
        Go to Disperse
      </Link>

      <div className="page-header">
        <p className="page-eyebrow">STACKS SPRAY</p>
        <h1 className="page-title">Claim Tokens</h1>
        <p className="page-subtitle">
          Check your eligibility and claim Spray tokens on Stacks {networkLabel}.
        </p>
      </div>

      {/* Wallet Card */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Wallet</h2>
          <WalletIcon className="card-icon" />
        </div>

        <span className={`badge ${badgeClass}`}>
          STACKS {networkLabel.toUpperCase()}
        </span>

        {isConnected ? (
          <>
            <div className="address-display">
              <span className="address-text">{truncateAddress(address || '')}</span>
              <button
                className="copy-btn"
                onClick={copyAddress}
                aria-label={copied ? 'Copied' : 'Copy address'}
              >
                {copied ? <CheckCircleIcon /> : <CopyIcon />}
              </button>
            </div>
            <button className="btn btn-secondary" onClick={disconnect}>
              Disconnect
            </button>
          </>
        ) : (
          <>
            <p className="page-subtitle mt-3 mb-3">
              Connect your wallet to check eligibility
            </p>
            <button className="btn btn-primary" onClick={connect}>
              Connect Wallet
            </button>
          </>
        )}
      </div>

      {/* Eligibility Card */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Eligibility</h2>
          <CheckCircleIcon className="card-icon" />
        </div>

        {isLoadingDistribution ? (
          <div className="status-box status-box-warning">
            <span className="spinner status-icon" />
            <div className="status-content">
              <p className="status-message status-message-warning">
                Loading distribution data...
              </p>
            </div>
          </div>
        ) : distributionError ? (
          <div className="status-box status-box-error">
            <AlertCircleIcon className="status-icon status-icon-error" />
            <div className="status-content">
              <p className="status-title status-title-error">Failed to fetch</p>
              <p className="status-message status-message-error">
                Unable to verify token eligibility at this time. Please try again later.
              </p>
            </div>
          </div>
        ) : !isConnected ? (
          <p className="page-subtitle">
            Connect wallet to check eligibility
          </p>
        ) : isEligible ? (
          <div className="status-box status-box-success">
            <CheckCircleIcon className="status-icon status-icon-success" />
            <div className="status-content">
              <p className="status-title status-title-success">Eligible!</p>
              <p className="status-message status-message-success">
                You can claim {eligibleAmount} tokens.
              </p>
            </div>
          </div>
        ) : (
          <div className="status-box status-box-warning">
            <AlertCircleIcon className="status-icon status-icon-warning" />
            <div className="status-content">
              <p className="status-title status-title-warning">Not eligible</p>
              <p className="status-message status-message-warning">
                This address is not in the current Spray distribution.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Claim Card */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Claim</h2>
          <GiftIcon className="card-icon" />
        </div>

        {txId ? (
          <>
            <div className="status-box status-box-success">
              <CheckCircleIcon className="status-icon status-icon-success" />
              <div className="status-content">
                <p className="status-title status-title-success">
                  Transaction submitted!
                </p>
              </div>
            </div>
            <a
              href={getTxUrl(txId)}
              target="_blank"
              rel="noopener noreferrer"
              className="tx-link"
            >
              View on Explorer
              <ExternalLinkIcon />
            </a>
          </>
        ) : (
          <>
            <p className="page-subtitle mb-3">
              {!isConnected
                ? 'Status: Connect wallet to claim'
                : !isEligible
                  ? 'Status: Not eligible to claim'
                  : 'Status: Ready to claim'}
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
              {isClaiming ? 'Claiming...' : 'Claim my Spray'}
              {!isClaiming && <GiftIcon className="btn-icon" />}
            </button>
          </>
        )}
      </div>
    </Layout>
  )
}
