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
import { CoinMetadataLoader } from './core/run/MetaDataLoader';
import { Pool as PoolObj } from './core/run/pool';
import { getOrCreateCoinOfLargeEnoughBalance } from '../../control/main';
import { maybeSplitThenDeposit } from './core/run/sdk';
import { ceilDiv } from './core/math';

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
  
export const mint_test_token_fun = async (provider, wallet, args) => {
  const tx = mint_test_token_eth({
      tokenType: args.tokenType,
      testTokenSupplyId: args.testTokenSupplyId,
      amount: args.amount,
      receiveAddress: args.receiveAddress
  })
  return await wallet.signAndExecuteTransaction(tx)
}
export const buyTLPSdk = async (provider, wallet, args) => {
  console.log(args.pool);
  const [inputA, inputB] = await Promise.all([
    await getOrCreateCoinOfLargeEnoughBalance(
      provider,
      wallet,
      args.pool.data.balanceA.type,
      args.amountA
    ),
    await getOrCreateCoinOfLargeEnoughBalance(
      provider,
      wallet,
      args.pool.data.balanceB.type,
      args.amountB
    ),
  ])
  
  const minLpOut = ceilDiv(BigInt(args.lpAmount.toFixed(0)) * BigInt(100 - args.maxSlippagePct), 100n);
  console.log(args.pool.id);
  const tx = maybeSplitThenDeposit([args.pool.data.balanceA.type, args.pool.data.balanceB.type], {
    pool: args.pool.id,
    inputA: inputA.id,
    amountA: args.amountA,
    inputB: inputB.id,
    amountB: args.amountB,
    minLpOut,
  })
  console.log(tx);
  return await wallet.signAndExecuteTransaction(tx)
}
