import { StructTag, SuiMoveObject } from '@mysten/sui.js'
import { tagToType, typeToTag } from './core/type'

export class Balance {
  type
  balance
  constructor(typeArg, value) {
    this.type = typeArg
    this.value = value
  }

  static fromMoveObjectField(type, field) {
    const news = new Balance(type, BigInt(field))
    return new Balance(type, BigInt(field))
  }
}

export class Supply {
  type
  balance
  constructor(typeArg, value) {
    this.type = typeArg
    this.value = value
  }
  static fromMoveObjectField(field) {
    console.log(field);
    if (!field.type.startsWith('0x2::balance::Supply<')) {
      throw new Error('error parsing Supply')
    }
    const type = typeToTag(field.type)
    return new Supply(tagToType(type.struct.typeParams[0]), BigInt(field.fields.value))
  }
}
