import {
    getMoveObject,
    getObjectExistsResponse,
    ObjectId,
    Provider,
    StructTag,
    SuiMoveObject,
    SuiObject,
    TypeTag,
} from '@mysten/sui.js'
import { CONFIG } from '../../../config'
import { typeToTag, tagToType } from '../type';
import { Balance, Supply } from '../../balance';

const BPS_IN_100_PCT = BigInt(100 * 100);

export class Pool {
    typeArgs  
    id
    balanceA
    balanceB
    lpSupply
    lpFeeBps
    adminFeePct
    adminFeeBalance
  
    constructor(typeArgs, fields) {
      this.typeArgs = typeArgs
      this.id = fields.id
      this.balanceA = fields.balanceA
      this.balanceB = fields.balanceB
      this.lpSupply = fields.lpSupply
      this.lpFeeBps = fields.lpFeeBps
      this.adminFeePct = fields.adminFeePct
      this.adminFeeBalance = fields.adminFeeBalance
    }
  
    static isPool(type) {
      return type.startsWith(`${CONFIG.tradeifyPackageId}::pool::Pool<`)
    }

    
  
    static fromSuiObject(obj) {
      const id = obj.reference.objectId;
      const moveObj = getMoveObject(obj)
      if (moveObj === undefined) {
        throw new Error(`'${id}' is not a valid Pool object`)
      }
      return this.fromMoveObjectField(moveObj)
    }
  
    static fromMoveObjectField(field) {
        if (!Pool.isPool(field.type)) {
            throw new Error(`not a Pool type`)
        }
        // console.log(field);
        
        const struct = (typeToTag(field.type)).struct
        const [typeA] = (struct.typeParams).map(tagToType);
        return {
            typeArgs: [typeA],
            id: field.fields.id.id,
            balanceA: Balance.fromMoveObjectField(typeA, field.fields.balance_a),
            lpSupply: field.fields.lp_supply,
            lpFeeBps: BigInt(field.fields.lp_fee_bps),
        }
    }
  }