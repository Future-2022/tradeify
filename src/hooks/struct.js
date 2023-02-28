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
import {CONFIG} from '../lib/config';
import { bcs } from '../control/bcs';

export class PoolCreateEvent {
    poolId
  
    constructor(poolId) {
      this.poolId = poolId
    }
  
    static fromBcs(data, encoding) {
      const dec = bcs.de(`${CONFIG.tradeifyPackageId}::pool::PoolCreationEvent`, data, encoding)
      return new PoolCreateEvent(dec.pool_id)
    }
  
    static isPoolCreateEvent(type) {
      return type.startsWith(`${CONFIG.tradeifyPackageId}::pool::PoolCreationEvent<`)
    }
}

export class LP {
  typeArgs

  constructor(typeArgs) {
    this.typeArgs = typeArgs
  }

  static isLp(type) {
    return type.startsWith(`${CONFIG.tradeifyPackageId}::tlp::TLP`)
  }
}