import { openContractCall } from '@stacks/connect'
import {
  stacksNetwork,
  SPRAY_CONTRACT_ADDRESS,
  SPRAY_CONTRACT_NAME,
} from '../config/stacks'

type ClaimOptions = {
  onFinish?: (txId: string) => void
  onCancel?: () => void
}

export async function claimSpray({ onFinish, onCancel }: ClaimOptions) {
  return openContractCall({
    network: stacksNetwork,
    contractAddress: SPRAY_CONTRACT_ADDRESS,
    contractName: SPRAY_CONTRACT_NAME,
    functionName: 'claim',
    functionArgs: [],
    appDetails: {
      name: 'Stacks Spray Claim',
      icon: window.location.origin + '/favicon.ico',
    },
    onFinish: (data) => {
      if (onFinish) onFinish(data.txId)
    },
    onCancel: () => {
      if (onCancel) onCancel()
    },
  })
}
