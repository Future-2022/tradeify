import {
    ObjectId,
    Provider,
    SignableTransaction,
    SuiObject,
    SuiTransactionResponse,
    Ed25519Keypair, JsonRpcProvider, RawSigner
  } from '@mysten/sui.js'
import { mint_test_token_eth } from './core/run/sdk'
import { WalletAdapter } from '@mysten/wallet-adapter-base'
import { Type } from './core/type'
import { CoinMetadataLoader } from './core/run/MetaDataLoader';
import { Pool as PoolObj } from './core/run/pool';
import { getOrCreateCoinOfLargeEnoughBalance } from '../../control/main';
import { stakeTLPSdk, depositTLPStakeSdk, rewardStakeSdk, unStakeSdk } from './core/run/sdk';
import { ceilDiv } from './core/math';
import { CONFIG } from '../config';

export const stakeTLP = async (provider, wallet, args) => {
    const input = await getOrCreateCoinOfLargeEnoughBalance(
        provider,
        wallet,
        args.tlpType,
        args.tlpAmount
    )
    const tx = stakeTLPSdk([args.tlpType, CONFIG.try], {
        tlpObjectId: input.id,
        stakeAmount: args.tlpAmount,
        ownerAddress: localStorage.getItem('walletAddress'),
        currentTime: args.currentTimestamp,
        lockTime:args.lockTime.toString()
    })
    console.log(tx);
    return await wallet.signAndExecuteTransaction(tx)
}
export const depositTLPStake = async (provider, wallet, args) => {
    const input = await getOrCreateCoinOfLargeEnoughBalance(
        provider,
        wallet,
        args.tlpType,
        args.tlpAmount
    )
    const tx = depositTLPStakeSdk([args.tlpType, args.tryType], {
        stakingMetaId: args.stakingMetaId,
        tlpObjectId: input.id,
        stakeAmount: args.tlpAmount,
        ownerAddress: localStorage.getItem('walletAddress'),
        currentTime: args.currentTimestamp,
        lockTime:args.lockTime.toString()
    })
    return await wallet.signAndExecuteTransaction(tx)
}
export const getStakingReward = async (provider, wallet, args) => {
    const tx = rewardStakeSdk([args.tlpType, args.tryType], {
        stakingMetaId: args.stakingMetaId,
        stakeAmount: args.tlpAmount,
        ownerAddress: localStorage.getItem('walletAddress'),
        currentTime: args.currentTimestamp,
    })
    console.log(tx);
    return await wallet.signAndExecuteTransaction(tx)
}
export const UnStakeTLP = async (provider, wallet, args) => {
    const tx = unStakeSdk([args.tlpType, args.tryType], {
        stakingMetaId: args.stakingMetaId,
    })
    console.log(tx);
    return await wallet.signAndExecuteTransaction(tx)
}