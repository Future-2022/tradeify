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
import { maybeSplitThenDeposit, maybeSplitThenWithdraw, newSwap } from './core/run/sdk';
import { ceilDiv } from './core/math';
import { CONFIG } from '../config';
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
    console.log(state);
    const metadata = await Promise.all([
      CoinMetadataLoader.loadMetadata(state.typeArgs[0]),
    ])
    return new Pool(state, metadata)
  }

}
  
export const mint_test_token_fun = async (provider, wallet, args) => {
  const currentTimestamp = Date.now();
  let isAvaiable = false;
  if(localStorage.getItem(`${args.tokenType}_faucet`) == null) {
    localStorage.setItem(`${args.tokenType}_faucet`, currentTimestamp);  
    isAvaiable = true;
  } else {
    if(currentTimestamp - Number(localStorage.getItem(`${args.tokenType}_faucet`)) >= CONFIG.faucetDurationTime) {
      isAvaiable = true;
    }
  }
  if(isAvaiable == true) {
    const tx = mint_test_token_eth({
      tokenType: args.tokenType,
      amount: args.amount,
      receiveAddress: args.receiveAddress
    })
    localStorage.setItem(`${args.tokenType}_faucet`, currentTimestamp); 
    return await wallet.signAndExecuteTransaction(tx)
  } else {
    const remainTime = ((CONFIG.faucetDurationTime - currentTimestamp + Number(localStorage.getItem(`${args.tokenType}_faucet`))) / (60 * 1000)).toFixed(0);
    return [false, remainTime];
  }
}



const calcLpValue = (lpAmount, pool) => {
  const [balanceA, balanceB, poolLpAmount] = [
    pool.data.balanceA.value,
    pool.data.balanceB.value,
    pool.data.lpSupply.value,
  ]
  if (lpAmount === 0n || balanceA === 0n || balanceB === 0n) {
    return [
      fromInt(0n, pool.metadata[0].decimals),
      fromInt(0n, pool.metadata[1].decimals),
    ]
  }

  const amountA = (balanceA * BigInt(lpAmount)) / poolLpAmount
  const amountB = (balanceB * BigInt(lpAmount)) / poolLpAmount
  return [
    amountA, amountB
  ]
}

export const calcSwapOut = (pool, inValue, isACS) => {
  let inPoolValue = 0;
  let outPoolValue = 0;

  if(isACS == true) {
    inPoolValue = pool.data.balanceA.value;
    outPoolValue = pool.data.balanceB.value;
  } else {
    inPoolValue = pool.data.balanceB.value;
    outPoolValue = pool.data.balanceA.value;
  }
  
  const lpFeeValue = ceilDiv(BigInt(inValue) * pool.data.lpFeeBps, BPS_IN_100_PCT)
  
  const inAfterLpFee = BigInt(inValue) - lpFeeValue
  const outValue = (inAfterLpFee * outPoolValue) / (inPoolValue + inAfterLpFee)

  return Number(outValue)
}

// Sell tlp function
export const sellTLPSdk = async (provider, wallet, args) => {
  console.log(args.amount);
  const [inputTLP] = await Promise.all([
    await getOrCreateCoinOfLargeEnoughBalance(
      provider,
      wallet,
      CONFIG.tlp,
      args.amount
    )])
  
  let tx = maybeSplitThenWithdraw({first: args.pool.data.typeArgs[0]}, {
    pool: args.pool.id,
    lpIn: inputTLP.id,
    price: Number(args.price).toFixed(0),
    amount: args.amount,
  })
  console.log(tx);
  return await wallet.signAndExecuteTransaction(tx)
}

// Buy tlp function
export const buyTLPSdk = async (provider, wallet, args) => {
  const [inputA] = await Promise.all([
    await getOrCreateCoinOfLargeEnoughBalance(
      provider,
      wallet,
      args.pool.data.balanceA.type,
      args.amountA
    )])
  const tx = maybeSplitThenDeposit([args.pool.data.balanceA.type], {
    pool: args.pool.id,
    inputA: inputA.id,
    amountA: args.amountA,
    price: Number(args.price).toFixed(0),
  })
  console.log(tx)
  return await wallet.signAndExecuteTransaction(tx)
}

// const sellTLPSdk
export const swap = async (provider, wallet, args) => {
  const input = await getOrCreateCoinOfLargeEnoughBalance(
    provider,
    wallet,
    args.inputType1,
    args.amount
  )

  const tx = newSwap({first: args.inputType1, second: args.inputType2}, {
    inPool: args.inPoolId.id,
    outPool: args.outPoolId.id,
    input: input.id,
    amount: args.amount,
    tokenPrice1: Number(args.tokenPrice1).toFixed(0),
    tokenPrice2: Number(args.tokenPrice2).toFixed(0),
  })
  console.log(tx);
  return await wallet.signAndExecuteTransaction(tx)
  
}