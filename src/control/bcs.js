import { BCS, getSuiMoveConfig } from '@mysten/bcs'
import { CONFIG } from '../lib/config'

export const bcs = new BCS(getSuiMoveConfig())

bcs.registerStructType(`${CONFIG.tradeifyPackageId}::pool::PoolCreationEvent`, { pool_id: 'address' })