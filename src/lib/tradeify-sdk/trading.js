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
import { createLongPositionBSdk, createLongPositionASdk, closeOrderASdk, closeOrderBSdk } from './core/run/sdk';
import { ceilDiv } from './core/math';
import { CONFIG } from '../config';

export const createLongPositionAOrder = async (provider, wallet, args) => {
    const input = await getOrCreateCoinOfLargeEnoughBalance(
        provider,
        wallet,
        args.tokenTypeA,
        BigInt(args.tradingAmount)
    )
    console.log(args);
    const tx = createLongPositionASdk([args.tokenTypeA, args.tokenTypeB], {
        poolID: args.poolID,
        coinA: input.id,
        marketPrice: args.marketPrice,
        tradingAmount: args.tradingAmount,
        calcAmount: args.calcAmount,
        leverageValue: args.leverageValue,
        hasRefer: args.hasRefer,
        referID: args.referID,
        isDiff: args.isDiff,
        isACS: args.isACS,
        createdTimeStamp: args.createdTimeStamp,
        tradingType: args.tradingType
    })
    console.log(tx);
    return await wallet.signAndExecuteTransaction(tx)
}

export const createLongPositionBOrder = async (provider, wallet, args) => {
    if(args.isDiff == 0) {       
        console.log(args.tokenTypeB); 
        const input = await getOrCreateCoinOfLargeEnoughBalance(
            provider,
            wallet,
            args.tokenTypeB,
            BigInt(args.tradingAmount)
        )
        const tx = createLongPositionBSdk([args.tokenTypeA, args.tokenTypeB], {
            poolID: args.poolID,
            coinB: input.id,
            marketPrice: args.marketPrice,
            tradingAmount: args.tradingAmount,
            calcAmount: args.calcAmount,
            leverageValue: args.leverageValue,
            hasRefer: args.hasRefer,
            referID: args.referID,
            isDiff: args.isDiff,
            isACS: args.isACS,
            createdTimeStamp: args.createdTimeStamp,
            tradingType: args.tradingType
        })
        console.log(tx);
        return await wallet.signAndExecuteTransaction(tx)
    } else {
        const input = await getOrCreateCoinOfLargeEnoughBalance(
            provider,
            wallet,
            args.tokenTypeA,    
            BigInt(args.tradingAmount)
        )
        const tx = createLongPositionBSdk([args.tokenTypeB, args.tokenTypeA], {
            poolID: args.poolID,
            coinB: input.id,
            marketPrice: args.marketPrice,
            tradingAmount: args.tradingAmount,
            calcAmount: args.calcAmount,
            leverageValue: args.leverageValue,
            hasRefer: args.hasRefer,
            referID: args.referID,
            isDiff: args.isDiff,
            isACS: args.isACS,
            createdTimeStamp: args.createdTimeStamp,
            tradingType: args.tradingType
        })
        console.log(tx);
        return await wallet.signAndExecuteTransaction(tx)
    }
}

export const closeOrderFun = async (provider, wallet, index, poolID, value, tokenA, tokenB, isDiff, isACS) => {
    let tx = undefined;
    if(isDiff == 1) {
        if(isACS == 1) {
            tx = closeOrderBSdk([tokenA, tokenB], {
                poolID: poolID,
                createdTimeStamp: index,
                updateAmount: value
            })
        } else {
            tx = closeOrderASdk([tokenA, tokenB], {
                poolID: poolID,
                createdTimeStamp: index,
                updateAmount: value
            })
        }
    } else {
        tx = closeOrderBSdk([tokenA, tokenB], {
            poolID: poolID,
            createdTimeStamp: index,
            updateAmount: value
        })
    }
    
    return await wallet.signAndExecuteTransaction(tx)
}