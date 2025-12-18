import { useState, useEffect, useCallback } from 'react'
import {
  connect,
  disconnect as disconnectWallet,
  isConnected as checkIsConnected,
  getLocalStorage,
  AppConfig,
  UserSession,
} from '@stacks/connect'
import { NETWORK } from '@/config/stacks'

const appConfig = new AppConfig()
const userSession = new UserSession({ appConfig })

const getAddressPrefix = () => (NETWORK === 'mainnet' ? 'SP' : 'ST')

export function useStacksWallet() {
  const [isConnected, setIsConnected] = useState(false)
  const [address, setAddress] = useState<string | null>(null)

  const loadConnectionState = useCallback(() => {
    const prefix = getAddressPrefix()

    // Check new connect API first
    if (checkIsConnected()) {
      const storage = getLocalStorage()
      if (storage?.addresses?.stx?.length) {
        // Find address matching current network
        const networkAddr = storage.addresses.stx.find((a) => a.address.startsWith(prefix))
        if (networkAddr) {
          setAddress(networkAddr.address)
          setIsConnected(true)
          return
        }
      }
    }

    // Fallback to legacy UserSession
    if (userSession.isUserSignedIn()) {
      const userData = userSession.loadUserData()
      const networkKey = NETWORK === 'mainnet' ? 'mainnet' : 'testnet'
      const networkAddress = userData.profile?.stxAddress?.[networkKey]
      if (networkAddress) {
        setAddress(networkAddress)
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
    const prefix = getAddressPrefix()

    try {
      const response = await connect()
      if (response?.addresses?.length) {
        // Find address matching current network
        const networkAddr = response.addresses.find((a) => a.address.startsWith(prefix))
        if (networkAddr) {
          setAddress(networkAddr.address)
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
