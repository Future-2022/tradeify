import { BigNumber } from 'big-number';

export class Balance {
  constructor(typeArg, value) {
    this.typeArg = typeArg;
    this.value = value;
  }

  static fromMoveObjectField(type, field) {
    return new Balance(type, BigInt(field))
  }
}


  

