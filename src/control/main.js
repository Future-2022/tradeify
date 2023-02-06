import {
    ObjectId,
    Provider,
    Coin as SuiCoin,
    getObjectExistsResponse,
    JsonRpcProvider,
    getCreatedObjects,
    TransactionEffects
} from '@mysten/sui.js'
import { WalletAdapter } from '@mysten/wallet-adapter-base';
import { Balance } from '../control/balance';
import { CONFIG } from '../lib/config';
import { PoolCreateEvent } from '../hooks/struct';
import { Pool } from '../lib/tradeify-sdk/pool';
import { importImage } from './importModule';
export class Coin {
    typeArg
    id
    balance
  
    constructor(typeArg, id, balance) {
        this.typeArg = typeArg
        this.id = id
        this.balance = new Balance(typeArg, balance)
    }
}

export const isLoggedIn = () => {
    const account = localStorage.getItem('walletAddress');
    if(account == undefined || account == "null" || account == "undefined") {
      return false;
    } else {
      return true;
    }
}

export const ExportAddress = (address) => {
    const value = address.slice(0, 5) + '...' + address.slice(address.length - 5, address.length);
    return value
}

export const LPMetaData = (totalLPValue, metaValue) => {
    let MetaValue = {
        "meta": []
    }; 
    metaValue.map(item => {
      const LPSymbol = item.metadata[0].symbol + '-' + item.metadata[1].symbol;
      let LPFirstIcon = importImage(item.metadata[0].symbol);
      let LPSecondIcon = importImage(item.metadata[1].symbol);

      const LPTokenValue = Number(item.data.lpSupply.value);
      const LPPercentage = Number(LPTokenValue/totalLPValue * 100);
      const LPPrice = (Number(item.data.balanceA.value) / Number(item.data.balanceB.value)).toFixed(2);
      const LPFee = Number(Number(item.data.lpFeeBps) / 1000 * 100).toFixed(2);

      const newItem = {
        LPFirstTokenSymbol: item.metadata[0].symbol,
        LPSecondTokenSymbol: item.metadata[1].symbol,
        LPFirstTokenValue: Number(item.data.balanceA.value) / (10 ** Number(item.metadata[0].decimals)).toFixed(4),
        LPSecondTokenValue: Number(item.data.balanceB.value) / (10 ** Number(item.metadata[1].decimals)).toFixed(4),
        LPSymbol: LPSymbol,
        LPTokenValue: LPTokenValue,
        LPPercentage: LPPercentage,
        LPFirstIcon: LPFirstIcon,
        LPSecondIcon: LPSecondIcon,
        LPPrice: LPPrice,
        LPFee: LPFee
      }
      MetaValue = { "meta" : MetaValue['meta'] ? [...MetaValue['meta'], newItem] : [newItem] }
    })
    return MetaValue;
}
export function getUniqueCoinTypes(coins) {
    return [...new Set(coins.map(coin => coin.typeArg))]
}
export function suiCoinToCoin(coin) {
    const balance = SuiCoin.getBalance(coin) | BigInt(0);
    if (!SuiCoin.isCoin(coin)) {
      throw new Error('Not a Coin')
    }
    return new Coin(SuiCoin.getCoinTypeArg(coin), SuiCoin.getID(coin), balance)
}
export function changeDecimal(value) {
  const balance = (Number(value)/(10**CONFIG.MainDecimal).toString()).toFixed(3);
  return balance
}


export async function fetchLPCoins(provider, wallet) {
    const poolIDs = [];
    // console.log(`${CONFIG.tradeifyPackageId}::pool::PoolCreationEvent`);
    const events = await provider.getEvents(
        { MoveEvent: `${CONFIG.tradeifyPackageId}::pool::PoolCreationEvent` },
        null,
        null,
        'descending'
    )
    // console.log(events);
  events.data.forEach(envelope => {
    const event = envelope.event
    if (!('moveEvent' in event)) {
      throw new Error('Not a MoveEvent')
    }

    const dec = PoolCreateEvent.fromBcs(event.moveEvent.bcs, 'base64');
    poolIDs.push(dec.poolId)
  })
  const poolObjs = await provider.getObjectBatch(poolIDs);
  // console.log(poolObjs);
  return await Promise.all(
    poolObjs.map(async res => {
      const obj = getObjectExistsResponse(res)
      if (obj == undefined) {
        throw new Error(`object does not exist`)
      }
      // console.log(obj);
      return Pool.fromSuiObject(obj)
    })
  )
}


export async function getUserCoins(provider, wallet) {
    const addr = await getWalletAddress(wallet);
    const coinInfos = (await provider.getObjectsOwnedByAddress(addr)).filter(SuiCoin.getCoinTypeArg);
    // console.log(coinInfos);
    const coins = (await (provider).getObjectBatch(coinInfos.map(obj => (obj.objectId)))).map(coin => {
      return suiCoinToCoin(coin)
    })
    return coins;
}

export async function getWalletAddress(wallet) {
    const accs = await wallet.getAccounts()
    return accs[0]
}
export function getCoinBalances(coins){
    const balances = new Map;
    for (const coin of coins) {
      const balance = balances.get(coin.typeArg)
      if (balance === undefined) {
        balances.set(coin.typeArg, coin.balance.value)
      } else {
        balances.set(coin.typeArg, balance + coin.balance.value)
      }
    }
    return balances
}
export function getCoinSymbols(coins){
    const balances = new Map;
    for (const coin of coins) {
      const symbol = SuiCoin.getCoinSymbol(coin.typeArg);
      balances.set(coin.typeArg, symbol)
    }
    return balances
}