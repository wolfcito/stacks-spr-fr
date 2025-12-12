import './App.css'
import { useStacksWallet } from './hooks/useStacksWallet'

function App() {
  const { isConnected, address, connect, disconnect } = useStacksWallet()

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
          <p className="section-text">
            {isConnected
              ? 'Eligibility info placeholder'
              : 'Connect wallet to check eligibility'}
          </p>
        </section>

        <section className="section">
          <h2>Claim</h2>
          <p className="section-text">
            {isConnected ? 'Claim status placeholder' : 'Connect wallet to claim'}
          </p>
          <button disabled={!isConnected}>Claim my Spray</button>
        </section>
      </main>
    </div>
  )
}

export default App
