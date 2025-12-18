import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { request } from '@stacks/connect'
import { Cl, contractPrincipalCV } from '@stacks/transactions'
import { useStacksWallet } from '@/hooks/useStacksWallet'
import {
  DISPERSE_CONTRACT_NAME,
  getTxUrl,
  NETWORK,
  SPRAY_CONTRACT_ADDRESS,
} from '@/config/stacks'

const CONTRACT_NAME = DISPERSE_CONTRACT_NAME
const CONTRACT_ID = `${SPRAY_CONTRACT_ADDRESS}.${CONTRACT_NAME}` as const

type ParsedRow = { recipient: string; amount: bigint }

function parseCsvLines(input: string): ParsedRow[] {
  const lines = input
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  const rows: ParsedRow[] = lines.map((line, idx) => {
    const parts = line.split(',').map((p) => p.trim())
    if (parts.length !== 2)
      throw new Error(`Line ${idx + 1}: use "STX_ADDRESS, AMOUNT"`)
    const recipient = parts[0]
    const amountStr = parts[1]

    if (!recipient.startsWith('S'))
      throw new Error(`Line ${idx + 1}: invalid recipient (${recipient})`)
    const amount = BigInt(amountStr)
    if (amount <= 0n) throw new Error(`Line ${idx + 1}: amount must be > 0`)

    return { recipient, amount }
  })

  if (rows.length === 0) throw new Error('Add at least 1 recipient')
  return rows
}

export default function DispersePage() {
  const { isConnected, address, connect, disconnect } = useStacksWallet()
  const [txId, setTxId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // STX disperse input - using valid testnet addresses
  const [stxRowsText, setStxRowsText] = useState<string>(
    'SP33EKM95D6JDVM0PS9W3GM2367NZ4FRCPFN8PHGJ, 1000000\nSPGJZYZSJJ39THGEMDHB2897HMWNGGECPRXNY6K3, 2000000',
  )

  // SIP-010 disperse input
  const [tokenAddress, setTokenAddress] = useState<string>(
    SPRAY_CONTRACT_ADDRESS,
  )
  const [tokenName, setTokenName] = useState<string>('spray-token')
  const [sipRowsText, setSipRowsText] = useState<string>(
    'SP33EKM95D6JDVM0PS9W3GM2367NZ4FRCPFN8PHGJ, 1000000\nSPGJZYZSJJ39THGEMDHB2897HMWNGGECPRXNY6K3, 2000000',
  )

  const stxTotal = useMemo(() => {
    try {
      const rows = parseCsvLines(stxRowsText)
      return rows.reduce((acc, r) => acc + r.amount, 0n)
    } catch {
      return 0n
    }
  }, [stxRowsText])

  const sipTotal = useMemo(() => {
    try {
      const rows = parseCsvLines(sipRowsText)
      return rows.reduce((acc, r) => acc + r.amount, 0n)
    } catch {
      return 0n
    }
  }, [sipRowsText])

  async function callDisperseStx() {
    setError(null)
    setTxId(null)
    setIsSubmitting(true)

    try {
      if (!isConnected) throw new Error('Connect wallet first')

      const rows = parseCsvLines(stxRowsText)
      if (rows.length > 200)
        throw new Error('Maximum 200 recipients for STX disperse')

      const recipients = rows.map((r) => Cl.standardPrincipal(r.recipient))
      const amounts = rows.map((r) => Cl.uint(r.amount))

      const functionArgs = [Cl.list(recipients), Cl.list(amounts)]

      const resp = await request('stx_callContract', {
        contract: CONTRACT_ID,
        functionName: 'disperse-stx',
        functionArgs,
        network: NETWORK,
        postConditionMode: 'allow',
      })

      setTxId(resp?.txid ?? JSON.stringify(resp))
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function callDisperseSip010() {
    setError(null)
    setTxId(null)
    setIsSubmitting(true)

    try {
      if (!isConnected) throw new Error('Connect wallet first')

      const rows = parseCsvLines(sipRowsText)
      if (rows.length > 10)
        throw new Error(
          'Direct mode: maximum 10 recipients for disperse-sip010',
        )

      const tokenCv = contractPrincipalCV(tokenAddress.trim(), tokenName.trim())
      const recipients = rows.map((r) => Cl.standardPrincipal(r.recipient))
      const amounts = rows.map((r) => Cl.uint(r.amount))

      const functionArgs = [tokenCv, Cl.list(recipients), Cl.list(amounts)]

      const resp = await request('stx_callContract', {
        contract: CONTRACT_ID,
        functionName: 'disperse-sip010',
        functionArgs,
        network: NETWORK,
        postConditionMode: 'allow',
      })

      setTxId(resp?.txid ?? JSON.stringify(resp))
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="app">
      <main className="card" style={{ maxWidth: 600 }}>
        <header className="card-header">
          <p className="eyebrow">Spray Disperse</p>
          <h1>Disperse Tokens</h1>
          <p className="description">
            Send STX or SIP-010 tokens to multiple recipients in a single
            transaction.
          </p>
        </header>

        <nav style={{ display: 'flex', gap: 12 }}>
          <Link to="/" className="tx-link">
            &larr; Back to Claim
          </Link>
        </nav>

        <section className="section">
          <h2>Wallet</h2>
          <p className="network-badge">
            Network: Stacks {NETWORK === 'mainnet' ? 'Mainnet' : 'Testnet'}
          </p>
          {isConnected ? (
            <>
              <p className="section-text address">{address}</p>
              <button onClick={disconnect} className="btn-secondary">
                Disconnect
              </button>
            </>
          ) : (
            <>
              <p className="section-text">
                Connect your wallet to disperse tokens
              </p>
              <button onClick={connect}>Connect Wallet</button>
            </>
          )}
          <p style={{ marginTop: 12, fontSize: '0.85rem', color: '#475467' }}>
            <strong>Contract:</strong> {CONTRACT_ID}
          </p>
        </section>

        <section className="section">
          <h2>1) Disperse STX</h2>
          <p className="section-text">
            Enter recipients (one per line):{' '}
            <code>STX_ADDRESS, AMOUNT_USTX</code>
            <br />
            <small style={{ color: '#667085' }}>
              1 STX = 1,000,000 uSTX &middot; Max 200 recipients
            </small>
          </p>
          <textarea
            value={stxRowsText}
            onChange={(e) => setStxRowsText(e.target.value)}
            rows={5}
            style={{
              width: '100%',
              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
              padding: 10,
              borderRadius: 8,
              border: '1px solid #e4e7ec',
              fontSize: '0.9rem',
            }}
          />
          <p style={{ margin: '8px 0', fontSize: '0.85rem', color: '#344054' }}>
            <strong>Total:</strong>{' '}
            {(Number(stxTotal) / 1_000_000).toLocaleString()} STX
          </p>
          <button
            onClick={callDisperseStx}
            disabled={!isConnected || isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Send disperse-stx'}
          </button>
        </section>

        <section className="section">
          <h2>2) Disperse SIP-010 Tokens</h2>
          <p className="section-text">
            <small style={{ color: '#667085' }}>
              Direct mode: max 10 recipients
            </small>
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
              marginBottom: 12,
            }}
          >
            <label style={{ fontSize: '0.9rem' }}>
              Token Address
              <input
                value={tokenAddress}
                onChange={(e) => setTokenAddress(e.target.value)}
                style={{
                  width: '100%',
                  padding: 8,
                  borderRadius: 8,
                  border: '1px solid #e4e7ec',
                  marginTop: 4,
                }}
              />
            </label>
            <label style={{ fontSize: '0.9rem' }}>
              Token Name
              <input
                value={tokenName}
                onChange={(e) => setTokenName(e.target.value)}
                style={{
                  width: '100%',
                  padding: 8,
                  borderRadius: 8,
                  border: '1px solid #e4e7ec',
                  marginTop: 4,
                }}
              />
            </label>
          </div>

          <p className="section-text">
            Enter recipients: <code>STX_ADDRESS, AMOUNT</code> (in token base
            units)
          </p>
          <textarea
            value={sipRowsText}
            onChange={(e) => setSipRowsText(e.target.value)}
            rows={5}
            style={{
              width: '100%',
              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
              padding: 10,
              borderRadius: 8,
              border: '1px solid #e4e7ec',
              fontSize: '0.9rem',
            }}
          />
          <p style={{ margin: '8px 0', fontSize: '0.85rem', color: '#344054' }}>
            <strong>Total:</strong> {sipTotal.toLocaleString()} base units
          </p>
          <button
            onClick={callDisperseSip010}
            disabled={!isConnected || isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Send disperse-sip010'}
          </button>
        </section>

        {(txId || error) && (
          <section className="section">
            <h2>Result</h2>
            {txId && (
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
            )}
            {error && <p className="section-text error">{error}</p>}
          </section>
        )}
      </main>
    </div>
  )
}
