import { openContractCall } from '@stacks/connect'
import { PostConditionMode } from '@stacks/transactions'
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
    postConditionMode: PostConditionMode.Allow,
    postConditions: [],
    onFinish: (data) => {
      if (onFinish) onFinish(data.txId)
    },
    onCancel: () => {
      if (onCancel) onCancel()
    },
  })
}
