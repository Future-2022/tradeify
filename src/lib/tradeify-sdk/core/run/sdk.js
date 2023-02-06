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