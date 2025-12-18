import { STACKS_TESTNET, STACKS_MAINNET, type StacksNetwork } from '@stacks/network'

export type NetworkType = 'testnet' | 'mainnet'

export const NETWORK: NetworkType =
  (import.meta.env.VITE_STACKS_NETWORK as NetworkType) || 'testnet'

export const SPRAY_CONTRACT_ADDRESS =
  NETWORK === 'mainnet'
    ? (import.meta.env.VITE_MAINNET_SPRAY_CONTRACT_ADDRESS as string) || ''
    : 'STGFJDY5CPWX17DVFSN0N95Q6T7V8X4NQ8RB7GF6'

export const SPRAY_CONTRACT_NAME = 'spray'

export const stacksNetwork: StacksNetwork =
  NETWORK === 'mainnet'
    ? {
        ...STACKS_MAINNET,
        client: {
          baseUrl: 'https://api.hiro.so',
        },
      }
    : {
        ...STACKS_TESTNET,
        client: {
          baseUrl: 'https://api.testnet.hiro.so',
        },
      }

export const getTxUrl = (txid: string) =>
  `https://explorer.stacks.co/txid/${txid}?chain=${NETWORK}`

export const isMainnet = () => NETWORK === 'mainnet'
export const isTestnet = () => NETWORK === 'testnet'
