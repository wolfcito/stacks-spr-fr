import { useState, useMemo } from 'react'
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
  CheckCircleIcon,
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
      throw new Error(`Línea ${idx + 1}: usa "STX_ADDRESS, CANTIDAD"`)
    const recipient = parts[0]
    const amountStr = parts[1]

    if (!recipient.startsWith('S'))
      throw new Error(`Línea ${idx + 1}: destinatario inválido (${recipient})`)
    const amount = BigInt(amountStr)
    if (amount <= 0n) throw new Error(`Línea ${idx + 1}: la cantidad debe ser > 0`)

    return { recipient, amount }
  })

  if (rows.length === 0) throw new Error('Agrega al menos 1 destinatario')
  return rows
}

export default function DispersePage() {
  const { isConnected, connect } = useStacksWallet()
  const [txId, setTxId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [stxRowsText, setStxRowsText] = useState<string>(
    'SP33EKM95D6JDVM0PS9W3GM2367NZ4FRCPFN8PHGJ, 1000000\nSPGJZYZSJJ39THGEMDHB2897HMWNGGECPRXNY6K3, 2000000',
  )

  const [tokenAddress, setTokenAddress] = useState<string>(SPRAY_CONTRACT_ADDRESS)
  const [tokenName, setTokenName] = useState<string>('spray-token')
  const [sipRowsText, setSipRowsText] = useState<string>(
    'SP33EKM95D6JDVM0PS9W3GM2367NZ4FRCPFN8PHGJ, 1000000\nSPGJZYZSJJ39THGEMDHB2897HMWNGGECPRXNY6K3, 2000000',
  )

  const networkLabel = NETWORK === 'mainnet' ? 'Mainnet' : 'Testnet'

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
      if (!isConnected) throw new Error('Conecta tu wallet primero')

      const rows = parseCsvLines(stxRowsText)
      if (rows.length > 200)
        throw new Error('Máximo 200 destinatarios para disperse STX')

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
      if (!isConnected) throw new Error('Conecta tu wallet primero')

      const rows = parseCsvLines(sipRowsText)
      if (rows.length > 10)
        throw new Error('Modo directo: máximo 10 destinatarios para disperse-sip010')

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
      <div className="page-header">
        <p className="page-eyebrow">STACKS SPRAY</p>
        <h1 className="page-title">Dispersar Tokens</h1>
        <p className="page-subtitle">
          Envía STX o tokens SIP-010 a múltiples destinatarios en una sola transacción.
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
                Conecta tu wallet para dispersar tokens.
              </p>
            </div>
          </div>
          <button className="btn btn-primary" onClick={connect}>
            Conectar Wallet
          </button>
        </div>
      )}

      {/* Contract info */}
      <div className="card">
        <p className="form-hint">
          <strong>Red:</strong> Stacks {networkLabel}<br />
          <strong>Contrato:</strong> <code>{CONTRACT_ID}</code>
        </p>
      </div>

      {/* STX Disperse */}
      <div className="card">
        <h2 className="card-title mb-3">1) Dispersar STX</h2>
        <p className="page-subtitle mb-2">
          Ingresa los destinatarios (uno por línea):
        </p>
        <p className="form-hint mb-3">
          <code>DIRECCIÓN_STX, CANTIDAD_USTX</code><br />
          1 STX = 1,000,000 uSTX · Máx 200 destinatarios
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
          Enviar disperse-stx
          <ArrowRightIcon className="btn-icon" />
        </button>
      </div>

      {/* SIP-010 Disperse */}
      <div className="card">
        <h2 className="card-title mb-3">2) Dispersar Tokens SIP-010</h2>
        <p className="form-hint mb-3">
          Modo directo: máx 10 destinatarios
        </p>

        <div className="form-grid mb-3">
          <div className="form-group">
            <label className="form-label">Dirección del Token</label>
            <input
              type="text"
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
              className="input"
              placeholder="SP..."
            />
          </div>
          <div className="form-group">
            <label className="form-label">Nombre del Token</label>
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
          Ingresa destinatarios: <code>DIRECCIÓN, CANTIDAD</code> (unidades base)
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
            {sipTotal.toLocaleString()} unidades base
          </span>
        </div>

        <button
          className="btn btn-primary mt-3"
          onClick={callDisperseSip010}
          disabled={!isConnected || isSubmitting}
        >
          {isSubmitting && <span className="spinner" />}
          Enviar disperse-sip010
          <ArrowRightIcon className="btn-icon" />
        </button>
      </div>

      {/* Result Card */}
      {(txId || error) && (
        <div className="card">
          <h2 className="card-title mb-3">Resultado</h2>

          {txId && (
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
    </Layout>
  )
}
