import {
    ObjectId,
    Provider,
    Coin as SuiCoin,
    GetObjectDataResponse,
    JsonRpcProvider,
  } from '@mysten/sui.js'
import { Amount } from './amount'
  

  
export class CoinMetadata {
    typeArg
    id
    decimals
    name
    symbol
    description
    iconUrl
  
    constructor(typeArg, fields) {
      this.typeArg = typeArg
      this.id = fields.id
      this.decimals = fields.decimals
      this.name = fields.name
      this.symbol = fields.symbol
      this.description = fields.description
      this.iconUrl = fields.iconUrl
    }
  
    newAmount(value) {
      return Amount.fromInt(value, this.decimals)
    }
}