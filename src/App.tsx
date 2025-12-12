import { useEffect, useState } from 'react'
import './App.css'
import { useStacksWallet } from './hooks/useStacksWallet'
import { claimSpray } from './lib/claimSpray'
import { getTxUrl } from './config/stacks'

interface Distribution {
  contractAddress: string
  network: string
  token: string
  claims: Record<string, { amount: string }>
}

function App() {
  const { isConnected, address, connect, disconnect } = useStacksWallet()
  const [distribution, setDistribution] = useState<Distribution | null>(null)
  const [distributionError, setDistributionError] = useState<string | null>(null)
  const [isLoadingDistribution, setIsLoadingDistribution] = useState(true)
  const [isClaiming, setIsClaiming] = useState(false)
  const [txId, setTxId] = useState<string | null>(null)
  const [claimError, setClaimError] = useState<string | null>(null)

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
    <div className="app">
      <main className="card">
        <header className="card-header">
          <p className="eyebrow">Stacks Spray Claim</p>
          <h1>Stacks Spray Claim</h1>
          <p className="description">
            Minimal interface for checking eligibility and claiming Spray tokens on
            Stacks Testnet.
          </p>
        </header>

        <section className="section">
          <h2>Wallet</h2>
          <p className="network-badge">Network: Stacks Testnet</p>
          {isConnected ? (
            <>
              <p className="section-text address">{address}</p>
              <button onClick={disconnect} className="btn-secondary">
                Disconnect
              </button>
            </>
          ) : (
            <>
              <p className="section-text">Connect your wallet to check eligibility</p>
              <button onClick={connect}>Connect Wallet</button>
            </>
          )}
        </section>

        <section className="section">
          <h2>Eligibility</h2>
          {isLoadingDistribution ? (
            <p className="section-text">Loading distribution...</p>
          ) : distributionError ? (
            <p className="section-text error">{distributionError}</p>
          ) : !isConnected ? (
            <p className="section-text">Connect wallet to check eligibility</p>
          ) : isEligible ? (
            <p className="section-text success">
              You are eligible to claim {eligibleAmount} tokens.
            </p>
          ) : (
            <p className="section-text warning">
              This address is not in the current Spray distribution.
            </p>
          )}
        </section>

        <section className="section">
          <h2>Claim</h2>
          {txId ? (
            <>
              <p className="section-text success">Transaction submitted!</p>
              <a
                href={getTxUrl(txId)}
                target="_blank"
                rel="noopener noreferrer"
                className="tx-link"
              >
                View on Stacks Explorer
              </a>
            </>
          ) : (
            <>
              <p className="section-text">
                {!isConnected
                  ? 'Connect wallet to claim'
                  : !isEligible
                    ? 'You are not eligible to claim'
                    : isClaiming
                      ? 'Waiting for wallet confirmation...'
                      : 'You can claim your Spray tokens'}
              </p>
              {claimError && <p className="section-text error">{claimError}</p>}
              <button
                onClick={handleClaim}
                disabled={!isConnected || !isEligible || isClaiming}
              >
                {isClaiming ? 'Claiming...' : 'Claim my Spray'}
              </button>
            </>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
