import './App.css'

function App() {
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
          <p className="section-text">Wallet connection placeholder</p>
          <button disabled>Connect Wallet</button>
        </section>

        <section className="section">
          <h2>Eligibility</h2>
          <p className="section-text">Eligibility info placeholder</p>
        </section>

        <section className="section">
          <h2>Claim</h2>
          <p className="section-text">Claim status placeholder</p>
          <button disabled>Claim my Spray</button>
        </section>
      </main>
    </div>
  )
}

export default App
