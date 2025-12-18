import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { request } from '@stacks/connect'
import { Cl, contractPrincipalCV } from '@stacks/transactions'
import { Layout } from '@/components/Layout'
import { useStacksWallet } from '@/hooks/useStacksWallet'
import {
  DISPERSE_CONTRACT_NAME,
  getTxUrl,
  NETWORK,
  SPRAY_CONTRACT_ADDRESS,
} from '@/config/stacks'
import {
  WalletIcon,
  CheckCircleIcon,
  CopyIcon,
  LogOutIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  AlertCircleIcon,
  ExternalLinkIcon,
} from '@/components/Icons'

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
  const [copied, setCopied] = useState(false)

  const [stxRowsText, setStxRowsText] = useState<string>(
    'SP33EKM95D6JDVM0PS9W3GM2367NZ4FRCPFN8PHGJ, 1000000\nSPGJZYZSJJ39THGEMDHB2897HMWNGGECPRXNY6K3, 2000000',
  )

  const [tokenAddress, setTokenAddress] = useState<string>(SPRAY_CONTRACT_ADDRESS)
  const [tokenName, setTokenName] = useState<string>('spray-token')
  const [sipRowsText, setSipRowsText] = useState<string>(
    'SP33EKM95D6JDVM0PS9W3GM2367NZ4FRCPFN8PHGJ, 1000000\nSPGJZYZSJJ39THGEMDHB2897HMWNGGECPRXNY6K3, 2000000',
  )

  const networkLabel = NETWORK === 'mainnet' ? 'Mainnet' : 'Testnet'
  const badgeClass = NETWORK === 'mainnet' ? 'badge-mainnet' : 'badge-testnet'

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
        throw new Error('Direct mode: maximum 10 recipients for disperse-sip010')

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
    <Layout>
      <Link to="/" className="back-link">
        <ArrowLeftIcon />
        Back to Claim
      </Link>

      <div className="page-header">
        <p className="page-eyebrow">STACKS SPRAY</p>
        <h1 className="page-title">Disperse Tokens</h1>
        <p className="page-subtitle">
          Send STX or SIP-010 tokens to multiple recipients in a single transaction.
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
              <LogOutIcon className="btn-icon" />
              Disconnect
            </button>
          </>
        ) : (
          <>
            <p className="page-subtitle mt-3 mb-3">
              Connect your wallet to disperse tokens
            </p>
            <button className="btn btn-primary" onClick={connect}>
              Connect Wallet
            </button>
          </>
        )}

        <p className="contract-info">
          <strong>Contract:</strong> <code>{CONTRACT_ID}</code>
        </p>
      </div>

      {/* STX Disperse */}
      <div className="card">
        <h2 className="card-title mb-3">1) Disperse STX</h2>
        <p className="page-subtitle mb-2">
          Enter recipients (one per line):
        </p>
        <p className="form-hint mb-3">
          <code>STX_ADDRESS, AMOUNT_USTX</code><br />
          1 STX = 1,000,000 uSTX · Max 200 recipients
        </p>

        <div className="form-group">
          <textarea
            value={stxRowsText}
            onChange={(e) => setStxRowsText(e.target.value)}
            rows={5}
            className="input input-mono"
            placeholder="SP..., 1000000"
          />
        </div>

        <div className="form-total">
          <span className="form-total-label">Total:</span>
          <span className="form-total-value">
            {(Number(stxTotal) / 1_000_000).toLocaleString()} STX
          </span>
        </div>

        <button
          className="btn btn-primary mt-3"
          onClick={callDisperseStx}
          disabled={!isConnected || isSubmitting}
        >
          {isSubmitting && <span className="spinner" />}
          Send disperse-stx
          <ArrowRightIcon className="btn-icon" />
        </button>
      </div>

      {/* SIP-010 Disperse */}
      <div className="card">
        <h2 className="card-title mb-3">2) Disperse SIP-010 Tokens</h2>
        <p className="form-hint mb-3">
          Direct mode: max 10 recipients
        </p>

        <div className="form-grid mb-3">
          <div className="form-group">
            <label className="form-label">Token Address</label>
            <input
              type="text"
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
              className="input"
              placeholder="SP..."
            />
          </div>
          <div className="form-group">
            <label className="form-label">Token Name</label>
            <input
              type="text"
              value={tokenName}
              onChange={(e) => setTokenName(e.target.value)}
              className="input"
              placeholder="token-name"
            />
          </div>
        </div>

        <p className="page-subtitle mb-2">
          Enter recipients: <code>ADDRESS, AMOUNT</code> (base units)
        </p>

        <div className="form-group">
          <textarea
            value={sipRowsText}
            onChange={(e) => setSipRowsText(e.target.value)}
            rows={5}
            className="input input-mono"
            placeholder="SP..., 1000000"
          />
        </div>

        <div className="form-total">
          <span className="form-total-label">Total:</span>
          <span className="form-total-value">
            {sipTotal.toLocaleString()} base units
          </span>
        </div>

        <button
          className="btn btn-primary mt-3"
          onClick={callDisperseSip010}
          disabled={!isConnected || isSubmitting}
        >
          {isSubmitting && <span className="spinner" />}
          Send disperse-sip010
          <ArrowRightIcon className="btn-icon" />
        </button>
      </div>

      {/* Result Card */}
      {(txId || error) && (
        <div className="card">
          <h2 className="card-title mb-3">Result</h2>

          {txId && (
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
          )}

          {error && (
            <div className="status-box status-box-error">
              <AlertCircleIcon className="status-icon status-icon-error" />
              <div className="status-content">
                <p className="status-message status-message-error">{error}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Eligibility status at bottom (as shown in design) */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Eligibility</h2>
        </div>
        <div className="status-box status-box-error">
          <AlertCircleIcon className="status-icon status-icon-error" />
          <div className="status-content">
            <p className="status-title status-title-error">Failed to fetch eligibility status</p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Claim</h2>
        </div>
        <p className="page-subtitle mb-3">You are not eligible to claim at this time.</p>
        <Link to="/claim" className="btn btn-primary">
          Claim my Spray
        </Link>
      </div>
    </Layout>
  )
}
