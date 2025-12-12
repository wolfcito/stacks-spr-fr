import { useState, useEffect, useCallback } from 'react'
import {
  connect,
  disconnect as disconnectWallet,
  isConnected as checkIsConnected,
  getLocalStorage,
  AppConfig,
  UserSession,
} from '@stacks/connect'

const appConfig = new AppConfig()
const userSession = new UserSession({ appConfig })

export function useStacksWallet() {
  const [isConnected, setIsConnected] = useState(false)
  const [address, setAddress] = useState<string | null>(null)

  const loadConnectionState = useCallback(() => {
    // Check new connect API first
    if (checkIsConnected()) {
      const storage = getLocalStorage()
      if (storage?.addresses?.stx?.length) {
        // Find testnet address (starts with ST)
        const testnetAddr = storage.addresses.stx.find((a) => a.address.startsWith('ST'))
        if (testnetAddr) {
          setAddress(testnetAddr.address)
          setIsConnected(true)
          return
        }
      }
    }

    // Fallback to legacy UserSession
    if (userSession.isUserSignedIn()) {
      const userData = userSession.loadUserData()
      const testnetAddress = userData.profile?.stxAddress?.testnet
      if (testnetAddress) {
        setAddress(testnetAddress)
        setIsConnected(true)
        return
      }
    }

    setIsConnected(false)
    setAddress(null)
  }, [])

  useEffect(() => {
    loadConnectionState()
  }, [loadConnectionState])

  const handleConnect = useCallback(async () => {
    try {
      const response = await connect()
      if (response?.addresses?.length) {
        // Find testnet address (starts with ST)
        const testnetAddr = response.addresses.find((a) => a.address.startsWith('ST'))
        if (testnetAddr) {
          setAddress(testnetAddr.address)
          setIsConnected(true)
        }
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error)
    }
  }, [])

  const handleDisconnect = useCallback(() => {
    disconnectWallet()
    userSession.signUserOut()
    setIsConnected(false)
    setAddress(null)
  }, [])

  return {
    isConnected,
    address,
    connect: handleConnect,
    disconnect: handleDisconnect,
    userSession,
  }
}
