import {
    ObjectId,
    Provider,
    Coin as SuiCoin,
    getObjectExistsResponse,
} from '@mysten/sui.js'
import { WalletAdapter } from '@mysten/wallet-adapter-base';
import { Balance } from '../control/balance';
import { CONFIG } from '../lib/config';
import { PoolCreateEvent } from '../hooks/struct';
import { calcSwapOut, Pool } from '../lib/tradeify-sdk/pool';
import { importImage } from './importModule';
import { LP } from '../hooks/struct';

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
export const getTraderMetaData = (lpCoin, value) => {
  let returnValue = [];
  let iconType = undefined;
  let colletral = undefined;
  let type = undefined;
  let markPrice = 0;
  let entryPrice = 0;
  let earnType = undefined;
  let earnAmount = undefined;
  let netValue = undefined;
  console.log(value);
  // console.log(lpCoin);
  value.map(valueItem => {
    lpCoin.map(item => {
      if(item.id == valueItem.poolID) {
        if(valueItem.tradingType == 0) {
          type = "LONG";
        } else {
          type = "SHORT";
        }
        if(valueItem.isDiff == 1) {
          if(valueItem.isACS == 1) {
            colletral = item.metadata[1].symbol;
            iconType = item.metadata[0].symbol;
            markPrice = Number(item.data.balanceB.value) / Number(item.data.balanceA.value);  
            netValue = calcSwapOut(item, (valueItem.tradingAmount), false) * valueItem.leverageValue;
            console.log(netValue); 
          }
          else {
            colletral = item.metadata[0].symbol;
            iconType = item.metadata[1].symbol;
            markPrice = Number(item.data.balanceA.value) / Number(item.data.balanceB.value);   
          }
        } else {
          colletral = item.metadata[1].symbol;
          iconType = item.metadata[1].symbol;
          markPrice = Number(item.data.balanceA.value) / Number(item.data.balanceB.value);           
        }
        if(valueItem.isDiff == 1) {
          entryPrice = (1 / (valueItem.marketPrice / 1000)).toFixed(4);
        } else {
          entryPrice = (valueItem.marketPrice / 1000).toFixed(4);
        }
        let MarketIcon = importImage(iconType);
        let colletralIcon = importImage(colletral);
        if(valueItem.tradingType == 0) {
          if(entryPrice > markPrice) {
            earnType = "-";            
            earnAmount = changeDecimal5Fix((entryPrice - markPrice) * valueItem.calcAmount);
            netValue = Number(changeDecimal5Fix(valueItem.calcAmount)) - Number(earnAmount);
          } else {
            earnType = "+";
            earnAmount = changeDecimal5Fix((markPrice - entryPrice) * valueItem.calcAmount);
            netValue = Number(changeDecimal5Fix(valueItem.calcAmount)) + Number(earnAmount);
          }
        } else {
          if(entryPrice > markPrice) {
            earnType = "+";            
            earnAmount = changeDecimal5Fix((entryPrice - markPrice) * valueItem.calcAmount);
            netValue = Number(changeDecimal5Fix(valueItem.calcAmount)) + Number(earnAmount);
          } else {
            earnType = "-";
            earnAmount = changeDecimal5Fix((markPrice - entryPrice) * valueItem.calcAmount);
            netValue = Number(changeDecimal5Fix(valueItem.calcAmount)) - Number(earnAmount);
          }
        }
        let value = {
          MarketIcon: MarketIcon,
          coinType: iconType,
          tokenA: item.metadata[0].typeArg,
          tokenB: item.metadata[1].typeArg,
          calcAmount: changeDecimal5Fix(valueItem.calcAmount),
          entryPrice: entryPrice,
          tradingStatus: valueItem.tradingStatus,
          colletral: colletral,
          colletralIcon: colletralIcon,
          tradingAmount: changeDecimal5Fix(valueItem.tradingAmount),
          leverageValue: valueItem.leverageValue,
          type: type,
          isDiff: valueItem.isDiff,
          isACS: valueItem.isACS,
          markPrice: markPrice.toFixed(4),
          earnType: earnType,
          earnAmount: earnAmount,
          netValue: Number(netValue).toFixed(4),
          createdTimeStamp: valueItem.createdTimeStamp,
          poolID: valueItem.poolID
        }
        returnValue.push(value);
      }
    })
  }) 
  console.log(returnValue);
  return returnValue;
}
export const LPMetaData = (totalLPValue, metaValue) => {
    let MetaValue = {
        "meta": []
    }; 
    metaValue.map(item => {
      const PoolId = item.id;

      const LPSymbol = item.metadata[0].symbol + '-' + item.metadata[1].symbol;
      let LPFirstIcon = importImage(item.metadata[0].symbol);
      let LPSecondIcon = importImage(item.metadata[1].symbol);

      const LPTokenValue = Number(item.data.lpSupply.value);
      const LPPercentage = Number(LPTokenValue/totalLPValue * 100);
      const LPPrice = (Number(item.data.balanceA.value) / Number(item.data.balanceB.value)).toFixed(2);
      const LPFee = Number(Number(item.data.lpFeeBps) / 1000 * 100).toFixed(2);

      const newItem = {
        PoolId: PoolId,
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
export function changeDecimal5Fix(value) {
  const balance = (Number(value)/(10**CONFIG.MainDecimal).toString()).toFixed(5);
  return balance
}

export function totalBalance(coins) {
  return coins.reduce((acc, coin) => acc + coin.balance.value, BigInt(0))
}

export function selectCoinWithBalanceGreaterThanOrEqual(coins,  balance){
  return coins.find(coin => coin.balance.value >= balance)
}

export async function getOrCreateCoinOfLargeEnoughBalance(
  provider,
  wallet,
  coinType,
  balance
) {
  const coins = (await getUserCoins(provider, wallet)).filter(coin => coin.typeArg === coinType)
  if (totalBalance(coins) < balance) {
    throw new Error(
      `Balances of ${coinType} Coins in the wallet don't amount to ${balance.toString()}`
    )
  }
  const coin = selectCoinWithBalanceGreaterThanOrEqual(coins, balance)
  
  if (coin !== undefined) {
    console.log(coin);
    return coin
  }

  const inputCoins = selectCoinSetWithCombinedBalanceGreaterThanOrEqual(coins, balance)
  console.log(inputCoins);
  const addr = await getWalletAddress(wallet)
  console.log(addr);
  const res = await wallet.signAndExecuteTransaction({
    kind: 'pay',
    data: {
      inputCoins: inputCoins.map(coin => coin.id),
      recipients: [addr],
      amounts: [Number(balance)],
      gasBudget: 10000,
    },
  })  
  if (!res.effects.created) {
    throw new Error('transaction failed')
  }
  const createdId = res.effects.created[0].reference.objectId
  const newCoin = await provider.getObject(createdId)
  console.log(createdId);
  return suiCoinToCoin(newCoin)
}
export function sortByBalance(coins) {
  return coins.sort((a, b) => {
    if (a.balance.value < b.balance.value) {
      return -1
    } else if (a.balance.value > b.balance.value) {
      return 1
    } else {
      return 0
    }
  })
}
export function selectCoinSetWithCombinedBalanceGreaterThanOrEqual(
  coins,
  amount
) {
  const sortedCoins = sortByBalance(coins)
  const total = totalBalance(sortedCoins)
  // return empty set if the aggregate balance of all coins is smaller than amount
  if (total < amount) {
    return []
  } else if (total === amount) {
    return sortedCoins
  }

  let sum = BigInt(0)
  const ret = []
  while (sum < total) {
    // prefer to add a coin with smallest sufficient balance
    const target = amount - sum
    const coinWithSmallestSufficientBalance = sortedCoins.find(c => c.balance.value >= target)
    if (coinWithSmallestSufficientBalance) {
      ret.push(coinWithSmallestSufficientBalance)
      break
    }
    const coinWithLargestBalance = sortedCoins.pop();
    ret.push(coinWithLargestBalance)
    sum += coinWithLargestBalance.balance.value
  }
  return sortByBalance(ret)
}


export async function fetchUserLpCoins(provider, addr) {
  const infos = (await provider.getObjectsOwnedByAddress(addr)).filter(obj => {
    return SuiCoin.isCoin(obj) && LP.isLp(SuiCoin.getCoinTypeArg(obj))
  })

  return (await (provider).getObjectBatch(infos.map(info => info.objectId))).map(
    suiCoinToCoin
  )
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
    // console.log(dec)
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

export async function getCoins(provider, address) {
    const coinInfos = (await provider.getObjectsOwnedByAddress(address)).filter(SuiCoin.getCoinTypeArg);
    // console.log(coinInfos);
    const coins = (await (provider).getObjectBatch(coinInfos.map(obj => (obj.objectId)))).map(coin => {
      return suiCoinToCoin(coin)
    })
    return coins;
}

export async function getTradeDatas(provider, address) {
  const tradingID = [];
  tradingID.push(CONFIG.tradingPoolID);
  const traderBatch = await provider.getObjectBatch(tradingID);
  // console.log(traderBatch);

  const traderData = traderBatch[0].details.data.fields.data.fields.contents;
  // // get Referral Code
  // let referralCode = undefined;
  let ownData = [];
  traderData.map(item => {
    if(item.fields.key.fields.trader == address) {
      ownData.push(item.fields.key.fields);
    }
  })
  return ownData;
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
export const getStakingPoolStatus = async (provider) => {
    const poolIDs = [];
    // console.log(`${CONFIG.tradeifyPackageId}::pool::PoolCreationEvent`);
    const events = await provider.getEvents(
        { MoveEvent: `${CONFIG.stakingPackageId}::pool::StakingPoolCreationEvent` },
        null,
        null,
        'descending'
    )
    events.data.forEach(envelope => {
      const event = envelope.event
      if (!('moveEvent' in event)) {
        throw new Error('Not a MoveEvent')
      }
      const dec = PoolCreateEvent.fromBcs(event.moveEvent.bcs, 'base64');
      // console.log(dec)
      poolIDs.push(dec.poolId)
    })
    const stakingPoolObjs = await provider.getObjectBatch(poolIDs);
    return stakingPoolObjs[0];
}
export const findStakingMeta = async ( provider, walletAddress ) => {
  const poolIDs = [];
  // console.log(`${CONFIG.tradeifyPackageId}::pool::PoolCreationEvent`);
  const events = await provider.getEvents(
      { MoveEvent: `${CONFIG.stakingPackageId}::pool::StakeCreationEvent` },
      null,
      null,
      'descending'
  )
  events.data.forEach(envelope => {
    const event = envelope.event
    if (!('moveEvent' in event)) {
      throw new Error('Not a MoveEvent')
    }
    const dec = PoolCreateEvent.fromBcs(event.moveEvent.bcs, 'base64');
    poolIDs.push(dec.poolId)
  })
  const poolObjs = await provider.getObjectBatch(poolIDs);
  return await Promise.all(
    poolObjs.filter(async res => res.details.owner.AddressOwner === walletAddress).map(item => {
      const obj = getObjectExistsResponse(item)
      return obj
    })
  )
}

export const getReferralStatus = async (provider, wallet) => {
  const referralStatusAddress = [];
  referralStatusAddress.push(CONFIG.referRegistryId);
  referralStatusAddress.push(CONFIG.refTraderRegistryId);
  referralStatusAddress.push(CONFIG.referralStaus);
  const refer = await provider.getObjectBatch(referralStatusAddress);
  
  const referData = refer[0].details.data.fields.data.fields.contents;

  // get Referral Code
  let referralCode = undefined;
  referData.map(item => {
    if(item.fields.key.fields.refer == wallet) {
      referralCode = item.fields.key.fields.referralCode;
    }
  })

  // get Trader Info
  let traderNum = 0;
  const traderData = refer[1].details.data.fields.data.fields.contents;
  traderData.map(item => {
    if(item.fields.key.fields.referralCode == referralCode) {
      traderNum++;
    }
  })

  // create referral link
  let referralLink = CONFIG.link + 'referral?ref=' + referralCode;
  return {referralCode, traderNum, referralLink};
}
export const getReferralIDByCode = async (provider, wallet, referralCode) => {
  const referralStatusAddress = [];
  referralStatusAddress.push(CONFIG.referRegistryId);
  const referralStatus = await provider.getObjectBatch(referralStatusAddress);
  const referData = await referralStatus[0].details.data.fields.data.fields.contents
  let referID = undefined;
  referData.map(item => {
    if(referralCode == item.fields.key.fields.referralCode) {
      referID = item.fields.key.fields.refer;
    } 
  })
  return referID;
}


export const getTraderStatus = async (provider, wallet) => {
  const referralStatusAddress = [];
  referralStatusAddress.push(CONFIG.referRegistryId);
  referralStatusAddress.push(CONFIG.refTraderRegistryId);
  referralStatusAddress.push(CONFIG.referralStaus);
  const refer = await provider.getObjectBatch(referralStatusAddress);
  
  const referData = refer[1].details.data.fields.data.fields.contents;

  // get Referral Code
  let referralCode = undefined;
  let referID = undefined;
  referData.map(item => {
    if(item.fields.key.fields.trader == wallet) {
      referralCode = item.fields.key.fields.referralCode;
      referID = item.fields.key.fields.refer;
    }
  })
  return {referralCode};
}
export const getReferralResult = async (provider, wallet) => {
  console.log(wallet);
  const referralStatusAddress = [];
  referralStatusAddress.push(CONFIG.tradingPoolID);
  const batch = await provider.getObjectBatch(referralStatusAddress);
  const tradingData = batch[0].details.data.fields.data.fields.contents;
  let tradingAmount = 0;
  let rebate = 0;
  tradingData.map(item => {
    const result = item.fields.key.fields;
    console.log(result);
    if(result.referID == wallet) {
      tradingAmount += Number(result.tradingAmount);
      rebate += Number(result.tradingAmount * CONFIG.tradingFee / 100)
    }
  }) 
  console.log(tradingAmount);
  return {tradingAmount: changeDecimal5Fix(tradingAmount), rebate: changeDecimal5Fix(rebate)};
}
export const getTradingResult = async (provider, wallet) => {
  console.log(wallet);
  const referralStatusAddress = [];
  referralStatusAddress.push(CONFIG.tradingPoolID);
  const batch = await provider.getObjectBatch(referralStatusAddress);
  const tradingData = batch[0].details.data.fields.data.fields.contents;
  let tradingAmount = 0;
  let rebate = 0;
  tradingData.map(item => {
    const result = item.fields.key.fields;
    console.log(result);
    if(result.hasRefer == "1") {
      if(result.trader == wallet) {
        tradingAmount += Number(result.tradingAmount);
        rebate += Number(result.tradingAmount * CONFIG.tradingFee / 100)
      }
    }
  }) 
  console.log(tradingAmount);
  return {tradingAmount: changeDecimal5Fix(tradingAmount), rebate: changeDecimal5Fix(rebate)};
}