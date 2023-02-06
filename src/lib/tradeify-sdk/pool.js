import {
    ObjectId,
    Provider,
    SignableTransaction,
    SuiObject,
    SuiTransactionResponse,
  } from '@mysten/sui.js'
import { mint_test_token_eth } from './core/run/sdk'
import { WalletAdapter } from '@mysten/wallet-adapter-base'
import { Type } from './core/type'
// import { ceilDiv, min, sqrt } from '../bigint-math'
// import { Amount } from './framework/amount'
import { CoinMetadataLoader } from './core/run/MetaDataLoader';
import { Pool as PoolObj } from './core/run/pool'

// import { CoinMetadata } from './framework/coin'
// import { getOrCreateCoinOfLargeEnoughBalance } from './framework/coin'

const BPS_IN_100_PCT = BigInt(100 * 100)

export class Pool {
  id
  data
  metadata
  constructor(state,  coinMetadata) {
    this.id = state.id
    this.data = state
    this.metadata = coinMetadata
  }

  static async fromSuiObject(obj) {
    const state = PoolObj.fromSuiObject(obj)
    // console.log(state);
    const metadata = await Promise.all([
      CoinMetadataLoader.loadMetadata(state.typeArgs[0]),
      CoinMetadataLoader.loadMetadata(state.typeArgs[1]),
    ])
    return new Pool(state, metadata)
  }

}
  
export const  mint_test_token_fun = async (provider, wallet, args) => {
  const tx = mint_test_token_eth({
      tokenType: args.tokenType,
      testTokenSupplyId: args.testTokenSupplyId,
      amount: args.amount,
      receiveAddress: args.receiveAddress
  })
  return await wallet.signAndExecuteTransaction(tx)
}
