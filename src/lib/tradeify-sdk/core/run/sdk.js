import { PACKAGE_ID } from '../index'
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
    const funName = "mint_test_token";
    return {
      kind: 'moveCall',
      data: {
            packageObjectId: PACKAGE_ID,
            module: 'pool',
            function: funName,
            arguments: [
                tokenId,
                args.amount.toString(),
            ],
            gasBudget: 40000,
            typeArguments: [objectId]
        },
    }
}

export function maybeSplitThenDeposit( typeArgs, args ) {
    return {
        kind: 'moveCall',
        data: {
            packageObjectId: PACKAGE_ID,
            module: 'pool',
            function: 'buy_tlp_',
            typeArguments: [typeArgs[0]],
            arguments: [
                CONFIG.TLPStorageId,
                args.pool,
                args.inputA,
                args.amountA.toString(),
                args.price.toString()
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
            function: 'sell_tlp_',
            typeArguments: [typeArgs.first],
            arguments: [
                CONFIG.TLPStorageId,
                args.pool,
                args.lpIn,
                args.amount.toString(),
                args.price,
            ],
            gasBudget: 40000,
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
            arguments: [
                args.pool, 
                args.input, 
                args.amount.toString(), 
                args.minOut.toString()
            ],
            gasBudget: 10000,
        },
    }
}
export function newSwap(typeArgs, args) {
    return {
        kind: 'moveCall',
        data: {
            packageObjectId: PACKAGE_ID,
            module: 'pool',
            function: 'swap_',
            typeArguments: [typeArgs.first, typeArgs.second],
            arguments: [
                args.inPool, 
                args.outPool, 
                args.tokenPrice1.toString(),
                args.tokenPrice2.toString(),
                args.input, 
                args.amount.toString()
            ],
            gasBudget: 10000,
        },
    }
}
export function stakeTLPSdk(typeArgs, args) {
    return {
        kind: 'moveCall',
        data: {
            packageObjectId: CONFIG.stakingPackageId,
            module: 'pool',
            function: 'stake_tlp_',
            typeArguments: [typeArgs[0], typeArgs[1]],
            arguments: [
                CONFIG.stakingPoolId, 
                args.tlpObjectId, 
                args.stakeAmount.toString(), 
                args.ownerAddress, 
                args.currentTime.toString(), 
                args.lockTime
            ],
            gasBudget: 10000,
        },
    }
}
export function depositTLPStakeSdk(typeArgs, args) {
    return {
        kind: 'moveCall',
        data: {
            packageObjectId: CONFIG.stakingPackageId,
            module: 'pool',
            function: 'deposit_tlp_stake_',
            typeArguments: [typeArgs[0], typeArgs[1]],
            arguments: [
                CONFIG.stakingPoolId, 
                args.stakingMetaId, 
                args.tlpObjectId, 
                args.stakeAmount.toString(), 
                args.currentTime.toString(), 
                args.lockTime
            ],
            gasBudget: 50000,
        },
    }
}
export function rewardStakeSdk(typeArgs, args) {
    return {
        kind: 'moveCall',
        data: {
            packageObjectId: CONFIG.stakingPackageId,
            module: 'pool',
            function: 'get_reward_',
            typeArguments: [
                typeArgs[0], 
                typeArgs[1]
            ],
            arguments: [
                CONFIG.stakingPoolId, 
                args.stakingMetaId, 
                args.currentTime.toString(), 
                args.ownerAddress
            ],
            gasBudget: 10000,
        },
    }
}
export function unStakeSdk(typeArgs, args) {
    return {
        kind: 'moveCall',
        data: {
            packageObjectId: CONFIG.stakingPackageId,
            module: 'pool',
            function: 'unstake_',
            typeArguments: [
                typeArgs[0], 
                typeArgs[1]
            ],
            arguments: [
                CONFIG.stakingPoolId, 
                args.stakingMetaId, 
            ],
            gasBudget: 10000,
        },
    }
}

export function CreateReferralCodeSdk(args) {
    return {
        kind: 'moveCall',
        data: {
            packageObjectId: CONFIG.referralPackageId,
            module: 'pool',
            function: 'create_referral_code_',
            typeArguments: [],
            arguments: [
                args.referralCode.toString(),
                CONFIG.referralStaus,
                CONFIG.referRegistryId
            ],
            gasBudget: 10000,
        },
    }
}
export function SubmitReferralCodeSdk(args) {
    return {
        kind: 'moveCall',
        data: {
            packageObjectId: CONFIG.referralPackageId,
            module: 'pool',
            function: 'submit_referral_code_',
            typeArguments: [],
            arguments: [
                args.referralCode,
                CONFIG.referralStaus,
                CONFIG.refTraderRegistryId,
                CONFIG.referRegistryId,
            ],
            gasBudget: 10000,
        },
    }
}

export function createPositionSdk(typeArgs, args) {
    console.log(args);
    return {
        kind: 'moveCall',
        data: {
            packageObjectId: CONFIG.tradeifyPackageId,
            module: 'pool',
            function: 'create_position_',
            typeArguments: [typeArgs[0], typeArgs[1]],
            arguments: [
                args.inPoolID,
                args.outPoolID,
                CONFIG.tradingPoolID,
                args.coinA,
                args.marketPrice.toString(),
                args.tradingAmount.toString(),
                args.calcAmount,
                args.leverageValue.toString(),
                args.hasRefer.toString(),
                args.referID.toString(),
                args.createdTimeStamp,
                args.tradingType.toString()
            ],
            gasBudget: 10000,
        },
    }
}
export function createPosition2Sdk(typeArgs, args) {
    console.log(args);
    return {
        kind: 'moveCall',
        data: {
            packageObjectId: CONFIG.tradeifyPackageId,
            module: 'pool',
            function: 'create_position2_',
            typeArguments: [typeArgs[0]],
            arguments: [
                args.inPoolID,
                CONFIG.tradingPoolID,
                args.coinA,
                args.marketPrice.toString(),
                args.tradingAmount.toString(),
                args.calcAmount,
                args.leverageValue.toString(),
                args.hasRefer.toString(),
                args.referID.toString(),
                args.createdTimeStamp,
                args.tradingType.toString()
            ],
            gasBudget: 10000,
        },
    }
}
export function closeOrderBSdk(typeArgs, args) {
    return {
        kind: 'moveCall',
        data: {
            packageObjectId: CONFIG.referralPackageId,
            module: 'pool',
            function: 'close_position_',
            typeArguments: [typeArgs[0], typeArgs[1]],
            arguments: [
                args.inPoolID,
                args.outPoolID,
                CONFIG.tradingPoolID,
                args.createdTimeStamp,
                args.tokenPriceA,
                args.tokenPriceB,
            ],
            gasBudget: 10000,
        },
    }
}

export function closeOrder2Sdk(typeArgs, args) {
    return {
        kind: 'moveCall',
        data: {
            packageObjectId: CONFIG.referralPackageId,
            module: 'pool',
            function: 'close_position2_',
            typeArguments: [typeArgs[0]],
            arguments: [
                args.inPoolID,
                CONFIG.tradingPoolID,
                args.createdTimeStamp,                
                args.tokenPriceA,
            ],
            gasBudget: 10000,
        },
    }
}

