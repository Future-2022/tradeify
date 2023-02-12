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
import { CreateReferralCodeSdk, SubmitReferralCodeSdk } from './core/run/sdk';
import { ceilDiv } from './core/math';
import { CONFIG } from '../config';

export const createReferralCode = async (provider, wallet, args) => {
    const tx = CreateReferralCodeSdk({
        referralCode: args.referralCode,
    })
    console.log(tx);
    return await wallet.signAndExecuteTransaction(tx)
}
export const submitReferralCode = async (provider, wallet, args) => {
    const tx = SubmitReferralCodeSdk({
        referralCode: args.referralCode,
    })
    console.log(tx);
    return await wallet.signAndExecuteTransaction(tx)
}