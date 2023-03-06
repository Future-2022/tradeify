import {
    ObjectId,
    Provider,
    SignableTransaction,
    SuiObject,
    SuiTransactionResponse,
  } from '@mysten/sui.js'
import { changeBigNumber, getOrCreateCoinOfLargeEnoughBalance, getSwapPrice } from '../../control/main';
import { createPositionSdk, createPosition2Sdk, closeOrderBSdk, closeOrder2Sdk } from './core/run/sdk';

export const createPosition = async (provider, wallet, args) => {  
    console.log(args)
    let tx = undefined;
    const input = await getOrCreateCoinOfLargeEnoughBalance(
        provider,
        wallet,
        args.tokenTypeA,
        BigInt(args.tradingAmount)
    )
    if(args.inPoolID != args.outPoolID) {
        tx = createPositionSdk([args.tokenTypeA, args.tokenTypeB, args.tokenTypeC], {
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
    }
    else {
        tx = createPosition2Sdk([args.tokenTypeA], {
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

export const closeOrderFun = async (tokenPrice, provider, wallet, inPool, outPool, createdTimeStamp, updateCalcAmount, isEarn, tradingAmount) => {
    let tokenA = inPool.metadata[0].typeArg;
    let tokenB = outPool.metadata[0].typeArg;
    let tokenSymbolA = inPool.metadata[0].symbol;
    let tokenPriceA = inPool.metadata[0].symbol;
    let tokenSymbolB = outPool.metadata[0].symbol;
    let tokenPriceB = outPool.metadata[0].symbol;
    let earnType = 0;

    tokenPrice.map(itemValue => {
        if(itemValue.symbol == tokenSymbolA) {
            tokenPriceA = itemValue.value;
        } else if (itemValue.symbol == tokenSymbolB) {
            tokenPriceB = itemValue.value;
        }
    })

    if(inPool.id != outPool.id) {
        let tx = undefined;   
        tx = closeOrderBSdk([tokenA, tokenB], {
            inPoolID: inPool.id,
            outPoolID: outPool.id,
            createdTimeStamp: createdTimeStamp,
            tokenPriceA: Number(tokenPriceA).toFixed(0),
            tokenPriceB: Number(tokenPriceB).toFixed(0),
        })
        console.log(tx);
        return await wallet.signAndExecuteTransaction(tx)
        
    } else {
        let tx = undefined;
        tx = closeOrder2Sdk([tokenA], {
            inPoolID: inPool.id,
            createdTimeStamp: createdTimeStamp,
            tokenPriceA: Number(tokenPriceA).toFixed(0),
        })
        console.log(tx)
        return await wallet.signAndExecuteTransaction(tx)
    }
}