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
import { changeBigNumber, getOrCreateCoinOfLargeEnoughBalance, getSwapPrice } from '../../control/main';
import { createPositionSdk, createPosition2Sdk, closeOrderBSdk, closeOrder2Sdk } from './core/run/sdk';
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

export const createPosition = async (provider, wallet, args) => {  
    let tx = undefined;
    const input = await getOrCreateCoinOfLargeEnoughBalance(
        provider,
        wallet,
        args.tokenTypeA,
        BigInt(args.tradingAmount)
    )
    if(args.inPoolID != args.outPoolID) {
        tx= createPositionSdk([args.tokenTypeA, args.tokenTypeB, args.tokenTypeC], {
            inPoolID: args.inPoolID,
            outPoolID: args.outPoolID,
            coinA: input.id,
            marketPrice: args.marketPrice,
            tradingAmount: args.tradingAmount,
            calcAmount: args.calcAmount,
            leverageValue: args.leverageValue,
            hasRefer: args.hasRefer,
            referID: args.referID,
            createdTimeStamp: args.createdTimeStamp,
            tradingType: args.tradingType
        })
    } else {
        tx= createPosition2Sdk([args.tokenTypeA, args.tokenTypeC], {
            inPoolID: args.inPoolID,
            coinA: input.id,
            marketPrice: args.marketPrice,
            tradingAmount: args.tradingAmount,
            calcAmount: args.calcAmount,
            leverageValue: args.leverageValue,
            hasRefer: args.hasRefer,
            referID: args.referID,
            createdTimeStamp: args.createdTimeStamp,
            tradingType: args.tradingType
        })
    }
    console.log(tx);
    return await wallet.signAndExecuteTransaction(tx)
    
}

export const closeOrderFun = async (provider, wallet, inPool, outPool, createdTimeStamp, updateCalcAmount, isEarn, tradingAmount) => {
    let tokenA = inPool.metadata[0].typeArg;
    let tokenB = outPool.metadata[0].typeArg;
    let tokenC = outPool.metadata[1].typeArg;
    let earnType = 0;

    if(inPool.id != outPool.id) {
        let tx = undefined;    
        if(isEarn == "+") {
            earnType = 1;
        } else {
            earnType = 2;
        }

        let earnAmount = getSwapPrice(outPool, inPool, updateCalcAmount);
        console.log(earnAmount);
        if(earnType == 2) {
            if(earnAmount < tradingAmount) {
                tx = closeOrderBSdk([tokenA, tokenB, tokenC], {
                    inPoolID: inPool.id,
                    outPoolID: outPool.id,
                    createdTimeStamp: createdTimeStamp,
                    updateAmount: changeBigNumber(earnAmount).toFixed(0),
                    earnType: earnType
                })
                console.log(tx);
                return await wallet.signAndExecuteTransaction(tx)
            } else {
                return false;
            }
        } else {
            tx = closeOrderBSdk([tokenA, tokenB, tokenC], {
                inPoolID: inPool.id,
                outPoolID: outPool.id,
                createdTimeStamp: createdTimeStamp,
                updateAmount: changeBigNumber(earnAmount).toFixed(0),
                earnType: earnType
            })
            return await wallet.signAndExecuteTransaction(tx)
        }
    } else {
        let tx = undefined;    
        if(isEarn == "+") {
            earnType = 1;
        } else {
            earnType = 2;
        }

        let earnAmount = getSwapPrice(outPool, inPool, updateCalcAmount);
        console.log(earnAmount);
        if(earnType == 2) {
            if(earnAmount < tradingAmount) {
                tx = closeOrder2Sdk([tokenA, tokenC], {
                    inPoolID: inPool.id,
                    outPoolID: outPool.id,
                    createdTimeStamp: createdTimeStamp,
                    updateAmount: changeBigNumber(earnAmount).toFixed(0),
                    earnType: earnType
                })
                console.log(tx);
                return await wallet.signAndExecuteTransaction(tx)
            } else {
                return false;
            }
        } else {
            tx = closeOrder2Sdk([tokenA, tokenC], {
                inPoolID: inPool.id,
                outPoolID: outPool.id,
                createdTimeStamp: createdTimeStamp,
                updateAmount: changeBigNumber(earnAmount).toFixed(0),
                earnType: earnType
            })
            return await wallet.signAndExecuteTransaction(tx)
        }
    }
}