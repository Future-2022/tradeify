import { ObjectId, SignableTransaction } from '@mysten/sui.js'
import { PACKAGE_ID } from '../index'
import { Type } from '../type'
import { CONFIG } from '../../../config'

export const mint_test_token_eth = (args) => {
    let tokenId = null;
    let objectId = null;
    if(args.tokenType == "eth") {
        tokenId = CONFIG.eth_id;
        objectId = CONFIG.eth;
    }  else {
        tokenId = CONFIG.btc_id;
        objectId = CONFIG.btc;
    }
    const funName = "mint_test_token_" + args.tokenType;
    return {
      kind: 'moveCall',
      data: {
            packageObjectId: PACKAGE_ID,
            module: 'pool',
            function: funName,
            arguments: [
                tokenId,
                args.testTokenSupplyId,
                args.amount.toString(),
                args.receiveAddress.toString(),
            ],
            gasBudget: 40000,
            typeArguments: [objectId]
        },
    }
}

export function maybeSplitThenDeposit( typeArgs, args ) {
    // console.log(args.pool);
    return {
        kind: 'moveCall',
        data: {
            packageObjectId: PACKAGE_ID,
            module: 'pool',
            function: 'maybe_split_then_deposit',
            typeArguments: [typeArgs[0], typeArgs[1]],
            arguments: [
                args.pool,
                args.inputA,
                args.amountA.toString(),
                args.inputB,
                args.amountB.toString(),
                args.minLpOut.toString(),
            ],
            gasBudget: 40000,
        },
    }
}
export function maybeSplitThenWithdraw( typeArgs, args ) {
    return {
        kind: 'moveCall',
        data: {
        packageObjectId: PACKAGE_ID,
        module: 'pool',
        function: 'maybe_split_then_withdraw',
        typeArguments: [typeArgs.first, typeArgs.second],
        arguments: [
            args.pool,
            args.lpIn,
            args.amount.toString(),
            args.minAOut.toString(),
            args.minBOut.toString(),
        ],
        gasBudget: 10000,
        },
    }
}
export function maybeSplitThenSwapA(typeArgs, args) {
    return {
        kind: 'moveCall',
        data: {
            packageObjectId: PACKAGE_ID,
            module: 'pool',
            function: 'maybe_split_then_swap_a',
            typeArguments: [typeArgs.first, typeArgs.second],
            arguments: [args.pool, args.input, args.amount.toString(), args.minOut.toString()],
            gasBudget: 10000,
        },
    }
}
export function maybeSplitThenSwapB(typeArgs, args) {
    return {
        kind: 'moveCall',
        data: {
            packageObjectId: PACKAGE_ID,
            module: 'pool',
            function: 'maybe_split_then_swap_b',
            typeArguments: [typeArgs.first, typeArgs.second],
            arguments: [args.pool, args.input, args.amount.toString(), args.minOut.toString()],
            gasBudget: 10000,
        },
    }
}

