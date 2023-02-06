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
      const dec = bcs.de(`${CONFIG.tradeifyPackageId}::pool::PoolCreateEvent`, data, encoding)
      return new PoolCreateEvent(dec.pool_id)
    }
  
    static isPoolCreateEvent(type) {
      return type.startsWith(`${CONFIG.tradeifyPackageId}::pool::PoolCreateEvent<`)
    }
}