import { STACKS_TESTNET, type StacksNetwork } from '@stacks/network'

export const SPRAY_CONTRACT_ADDRESS = 'ST23SRWT9A0CYMPW4Q32D0D7KT2YY07PQAVJY3NJZ'
export const SPRAY_CONTRACT_NAME = 'spray'

export const stacksNetwork: StacksNetwork = {
  ...STACKS_TESTNET,
  client: {
    baseUrl: 'https://api.testnet.hiro.so',
  },
}

export const getTxUrl = (txid: string) =>
  `https://explorer.stacks.co/txid/${txid}?chain=testnet`
