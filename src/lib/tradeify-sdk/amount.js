function isNumeric(value: string) {
    if (/^-?\d+(\.\d+)?$/.test(value)) {
      return true
    }
    if (/^-?\d+\.$/.test(value)) {
      return true
    }
    if (/^\.\d+$/.test(value)) {
      return true
    }
    return false
  }
  
  export class Amount {
    constructor(int, decimals) {}

    static fromInt(amount, decimals) {
      if (typeof amount === 'number' && (!Number.isInteger(amount) || amount < 0)) {
        throw new Error('the amount argument must be a non-negative integer')
      } else if (typeof amount === 'bigint' && amount < 0) {
        throw new Error('the amount argument must be a non-negative integer')
      }
      if (!Number.isInteger(decimals) || decimals < 0) {
        throw new Error('the decimals argument must be a non-negative integer')
      }
      return new Amount(BigInt(amount), decimals)
    }
    
    static fromNum(amount, decimals) {
      if (typeof amount === 'number') {
        amount = amount.toString()
      }
      console.log(amount, isNumeric(amount))
      if (!isNumeric(amount)) {
        throw new Error('the amount argument must be a number')
      }
      const [int, dec] = amount.split('.')
      if (int.startsWith('-')) {
        throw new Error('the amount argument must be non-negative')
      }
      const decTrimmed = dec.replace(/0+$/, '')
      if (decTrimmed.length > decimals) {
        throw new Error(
          'the amount cannot be correctly represented with the provided number of decimals'
        )
      }
  
      return new Amount(BigInt(int + decTrimmed), decimals)
    }

    equals(other) {
      return this.int === other.int && this.decimals === other.decimals
    }
  }
  