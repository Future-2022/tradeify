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
import axios from 'axios';

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

export const getMainCoins = (tokenPrice, lpPool) => {
  const mainCoinList = ['SUI', 'ETH', 'BTC'];
  let mainCoin = [];
  mainCoinList.map(item => {

    let price = 0;
    let changeValue = 0;
    let isEarn = 0;
    let tokenName = getTokenName(item);
    let tokenIcon = importImage(item);
    let tokenId = undefined;

    lpPool.map(itemValue => {
      if(itemValue.metadata[0].symbol == item) {
        tokenPrice.map(item => {
          if(item.symbol == itemValue.metadata[0].symbol) {
            price = item.value;
            changeValue = item.changeValue;
            isEarn = item.isEarn;
          }
        })
        tokenId = itemValue.metadata[0].typeArg;
        // price = Number(itemValue.data.balanceB.value) / Number(itemValue.data.balanceA.value);
      }
    })
    let value = {
      symbol: item,
      tokenId: tokenId,
      price: Number(price).toFixed(3),
      tokenName: tokenName,
      tokenIcon: tokenIcon,      
      changeValue: changeValue,
      isEarn: isEarn,
      label: item,
    }
    mainCoin.push(value);
  })
  return mainCoin;
}
    
export const getSwapPrice = (inPool, outPool, value) => {
  let bigIntAmount = changeBigNumber(value);
  let USDAmount = calcSwapOut(inPool, bigIntAmount, true);
  let SecondTokenAmount = calcSwapOut(outPool, USDAmount, false);
  return changeDecimal8Fix(SecondTokenAmount);
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
export const getTraderMetaData = (lpCoin, value, tokenPrice) => {

  let returnValue = [];
  let type = undefined;
  let earnType = undefined;
  let earnAmount = undefined;
  let inPool = undefined;
  let outPool = undefined; 
  value.map(valueItem => {    
    lpCoin.map(item => {
      if(item.id == valueItem.inPoolID) {
        inPool = item;
      } else if (item.id == valueItem.outPoolID){
        outPool = item;
      }
    })
    if(valueItem.inPoolID == valueItem.outPoolID) {
      outPool = inPool;
    }
    if(valueItem.tradingType == 0) {
      type = "LONG";
    } else {
      type = "SHORT";
    }
    
    let MarketIcon = importImage(outPool.metadata[0].symbol);
    let colletralIcon = importImage(inPool.metadata[0].symbol);
    let entryPrice = Number(valueItem.marketPrice).toFixed(4);

    let markPrice = 0;
    tokenPrice.map(itemValue => {
      if(itemValue.symbol == outPool.metadata[0].symbol) {
        markPrice = Number(itemValue.value);
      }
    })
    let netValue = changeDecimal5Fix(valueItem.calcAmount) * Number(markPrice) / Number(entryPrice);
    let calcAmount = changeDecimal5Fix(valueItem.calcAmount);
    let resultEarnAmount = changeDecimal5Fix(Number(valueItem.updateCalcAmount));
    let netResultValue = changeDecimal5Fix(Number(valueItem.calcAmount) + Number(valueItem.updateCalcAmount))
    if(valueItem.tradingType == 0) {
      if(calcAmount > netValue) {
        earnType = "-";            
        earnAmount = ((calcAmount - netValue) * markPrice).toFixed(3);
      } else if( calcAmount < netValue) {
        earnType = "+";
        earnAmount = ((netValue - calcAmount) * markPrice).toFixed(3);
      } else {
        earnType = "+";
        earnAmount = 0;
      }
    } else {
      if(calcAmount > netValue) {
        earnType = "+";            
        earnAmount = ((calcAmount - netValue) * markPrice).toFixed(3);
      } else {
        earnType = "-";
        earnAmount = ((netValue - calcAmount) * markPrice).toFixed(3);
      }
    }

    let value = {
        inPool: inPool,
        outPool: outPool,
        MarketIcon: MarketIcon,
        coinType: outPool.metadata[0].symbol,
        tokenA: outPool.metadata[0].typeArg,
        tokenB: inPool.metadata[0].typeArg,
        calcAmount: changeDecimal5Fix(valueItem.calcAmount),
        entryPrice: entryPrice,
        resultEarnAmount: resultEarnAmount,
        tradingStatus: valueItem.tradingStatus,
        colletral: inPool.metadata[0].symbol,
        colletralIcon: colletralIcon,
        tradingAmount: changeDecimal5Fix(valueItem.tradingAmount),
        leverageValue: valueItem.leverageValue / 10,
        type: type,
        netResultValue: netResultValue,
        markPrice: markPrice.toFixed(4),
        earnType: earnType,
        earnAmount: earnAmount,
        netValue: netValue.toFixed(5),
        isEarn: valueItem.isEarn,
        createdTimeStamp: valueItem.createdTimeStamp,
    }    
    returnValue.push(value);
  }) 
  return returnValue;
}
export const getTokenName = (LPSymbol) => {  
  let tokenName = undefined;
  if(LPSymbol == 'TRY') {
    tokenName = 'Tradeify';
  } else if (LPSymbol == "BTC"){
    tokenName = 'Bitcoin';
  } else if (LPSymbol == "ETH"){
    tokenName = 'Ethereum';
  } else if (LPSymbol == "SUI"){
    tokenName = 'Sui';
  } 
  return tokenName;
}
export const LPMetaData = (tokenPrice, totalLPValue, metaValue) => {
    
    let MetaValue = {
        "meta": []
    }; 
    metaValue.map(item => {
      const PoolId = item.id;      
      const LPSymbol = item.metadata[0].symbol;
      let LPPrice = 0;
      tokenPrice.map(itemValue => {
        if(LPSymbol == itemValue.symbol) {
          LPPrice = itemValue.value;
        }
      })
      const tokenName = getTokenName(LPSymbol);
      let LPFirstIcon = importImage(item.metadata[0].symbol);
      const lpValue = Number(item.data.lpSupply);
      const balanceA = Number(item.data.balanceA.value);
      const LPTokenValue = Number(item.data.lpSupply);
      const LPPercentage = Number(LPTokenValue/totalLPValue * 100);
      const LPFee = (Number(item.data.lpFeeBps) / 10).toFixed(2);
      const LPWeight = (LPTokenValue / totalLPValue * 100).toFixed(2);
      const totalPooledValue = Number(LPPrice * changeDecimal(balanceA)).toFixed(2);

      const newItem = {
        PoolId: PoolId,
        TokenName: tokenName,
        LPFirstTokenSymbol: item.metadata[0].symbol,
        LPFirstTokenValue: balanceA / (10 ** Number(item.metadata[0].decimals)).toFixed(4),
        LPSymbol: LPSymbol,
        LPPrice: LPPrice,
        LPValue: lpValue,
        LPTokenValue: LPTokenValue,
        LPPercentage: LPPercentage,
        LPFirstIcon: LPFirstIcon,
        totalPooledValue: totalPooledValue,
        LPFee: LPFee,
        LPWeight: LPWeight,
        LPTargetWeight: 32.16,
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
  const val = (Number(value)/(10**CONFIG.MainDecimal).toString());
  const balance = val.toString().match(/^-?\d+(?:\.\d{0,3})?/)[0]
  return Number(balance);
}
export function changeDecimal0Fix(value) {
  const balance = (Number(value)/(10**CONFIG.MainDecimal).toString()).toFixed(0);
  return balance
}
export function changeBigNumber(value) {
  const balance = (Number(value)*(10**CONFIG.MainDecimal));
  return balance
}
export function changeDecimal5Fix(value) {
  const balance = (Number(value)/(10**CONFIG.MainDecimal).toString()).toFixed(5);
  return balance
}
export function changeDecimal8Fix(value) {
  const balance = (Number(value)/(10**CONFIG.MainDecimal).toString()).toFixed(8);
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
    return coin
  }

  const inputCoins = selectCoinSetWithCombinedBalanceGreaterThanOrEqual(coins, balance)
  const addr = await getWalletAddress(wallet)
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
    const target = BigInt(amount) - sum
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

export const getTokenPrice = async () => {
    let suiPrice = 1;
    let ethPrice = 0;
    let ethLowPrice = 0;
    let ethHighPrice = 0;
    let ethAvgPrice = 0;
    let ethChangePrice = 0;
    let ethIsEarn = 0;
    let ethAPIUrl = CONFIG.eth_binance_api;
    
    let btcPrice = 0;
    let btcLowPrice = 0;
    let btcHighPrice = 0;
    let btcAvgPrice = 0;
    let btcChangePrice = 0;
    let btcIsEarn = 0;
    let btcAPIUrl = CONFIG.bnb_binance_api;

    await axios.get(ethAPIUrl).then((response) => {
      ethPrice = Number(response.data.lastPrice).toFixed(2);
      ethLowPrice = Number(response.data.lowPrice).toFixed(2);
      ethHighPrice = Number(response.data.highPrice).toFixed(2);
      ethAvgPrice = Number(response.data.weightedAvgPrice).toFixed(2);
      ethChangePrice = Number(response.data.priceChangePercent).toFixed(2);
      if(Number(ethChangePrice) > 0) {
        ethIsEarn = 1;
      } else {
        ethIsEarn = 0;
      }
    });

    await axios.get(btcAPIUrl).then((response) => {
      btcPrice = Number(response.data.lastPrice).toFixed(2);
      btcLowPrice = Number(response.data.lowPrice).toFixed(2);
      btcHighPrice = Number(response.data.highPrice).toFixed(2);
      btcAvgPrice = Number(response.data.weightedAvgPrice).toFixed(2);      
      btcChangePrice = Number(response.data.priceChangePercent).toFixed(2);
      if(Number(btcChangePrice) > 0) {
        btcIsEarn = 1;
      } else {
        btcIsEarn = 0;
      }
    });
    return [
      {symbol:"SUI", value:suiPrice, highValue: suiPrice, lowValue: suiPrice, isEarn: 1, changeValue: 0}, 
      {symbol:"ETH", value: ethPrice, highValue: ethHighPrice, lowValue: ethLowPrice, isEarn: ethIsEarn, changeValue: ethChangePrice},
      {symbol:"BTC", value: btcPrice, highValue: btcHighPrice, lowValue: btcLowPrice, isEarn: btcIsEarn, changeValue: btcChangePrice}]
}
export async function fetchLPCoins(provider, wallet) {
    const poolIDs = [];
    const events = await provider.getEvents(
        { MoveEvent: `${CONFIG.tradeifyPackageId}::pool::PoolCreationEvent` },
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
    poolObjs.map(async res => {
      const obj = getObjectExistsResponse(res)
      if (obj == undefined) {
        throw new Error(`object does not exist`)
      }
      return Pool.fromSuiObject(obj)
    })
  )
}


export async function getUserCoins(provider, wallet) {
    const addr = await getWalletAddress(wallet);
    const coinInfos = (await provider.getObjectsOwnedByAddress(addr)).filter(SuiCoin.getCoinTypeArg);
    const coins = (await (provider).getObjectBatch(coinInfos.map(obj => (obj.objectId)))).map(coin => {
      return suiCoinToCoin(coin)
    })
    return coins;
}

export async function getCoins(provider, address) {
    const coinInfos = (await provider.getObjectsOwnedByAddress(address)).filter(SuiCoin.getCoinTypeArg);
    const coins = (await (provider).getObjectBatch(coinInfos.map(obj => (obj.objectId)))).map(coin => {
      return suiCoinToCoin(coin)
    })
    return coins;
}

export async function getTradeDatas(provider, address) {
  const tradingID = [];
  tradingID.push(CONFIG.tradingPoolID);
  const traderBatch = await provider.getObjectBatch(tradingID);

  const traderData = traderBatch[0].details.data.fields.data.fields.contents;
  // // get Referral Code
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
      poolIDs.push(dec.poolId)
    })
    const stakingPoolObjs = await provider.getObjectBatch(poolIDs);
    return stakingPoolObjs[0];
}

export const getTotalTRYValue = async (provider) => {
    const poolIDs = [];
    poolIDs.push(CONFIG.try_id);
    const batch = await provider.getObjectBatch(poolIDs);
    const TRYValue = batch[0].details.data.fields.total_supply.fields.value;
    return Number(changeDecimal(TRYValue)).toFixed(0);
}

export const findStakingMeta = async ( provider, walletAddress ) => {
  const poolIDs = [];
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
export const getReferralResult = async (provider, wallet, lpCoin) => {
  const referralStatusAddress = [];
  referralStatusAddress.push(CONFIG.tradingPoolID);
  const batch = await provider.getObjectBatch(referralStatusAddress);
  const tradingData = batch[0].details.data.fields.data.fields.contents;
  let tradingAmount = 0;
  let rebate = 0;
  tradingData.map(item => {
    const result = item.fields.key.fields;
    
    if(result.referID == wallet) {
      let token = undefined;
      lpCoin.map(itemValue => {
        if(result.inPoolID == itemValue.id) {
          token = itemValue.metadata[0].symbol;
        }
      })
      tradingAmount += Number(result.tradingAmount * Number(result.marketPrice));
      rebate += Number(result.tradingAmount * CONFIG.tradingFee * Number(result.marketPrice) / 100)
    }
  }) 
  return {tradingAmount: changeDecimal5Fix(tradingAmount), rebate: changeDecimal5Fix(rebate)};
}

export const isAvailaleReferralCode = async (provider, value) => {
  const referralStatusAddress = [];
  referralStatusAddress.push(CONFIG.referRegistryId);
  let returnValue = false;
  const batch = await provider.getObjectBatch(referralStatusAddress);
  const referData = batch[0].details.data.fields.data.fields.contents;
  referData.map(item => {
    const result = item.fields.key.fields;
    console.log(result)
    if(Number(result.referralCode) == value) {
      returnValue = true;
    }
  })
  return returnValue;
}
export const checkCreateReferralCode = async (provider, value) => {
  const referralStatusAddress = [];
  referralStatusAddress.push(CONFIG.referRegistryId);
  let returnValue = true;
  const batch = await provider.getObjectBatch(referralStatusAddress);
  const referData = batch[0].details.data.fields.data.fields.contents;
  referData.map(item => {
    const result = item.fields.key.fields;
    if(Number(result.referralCode) == value) {
      returnValue = false;
    }
  })
  return returnValue;
}

export const getTradingResult = async (provider, wallet, lpCoin) => {
  const referralStatusAddress = [];
  referralStatusAddress.push(CONFIG.tradingPoolID);
  const batch = await provider.getObjectBatch(referralStatusAddress);
  const tradingData = batch[0].details.data.fields.data.fields.contents;
  let tradingAmount = 0;
  let rebate = 0;
  tradingData.map(item => {
    const result = item.fields.key.fields;
    if(result.hasRefer == "1") {
      if(result.trader == wallet) {
        let token = undefined;
        lpCoin.map(itemValue => {
          if(result.inPoolID == itemValue.id) {
            token = itemValue.metadata[0].symbol;
          }
        })
        tradingAmount += Number(result.tradingAmount * Number(result.marketPrice));
        rebate += Number(result.tradingAmount * CONFIG.tradingFee * Number(result.marketPrice) / 100)
      }
    }
  }) 
  return {tradingAmount: changeDecimal5Fix(tradingAmount), rebate: changeDecimal5Fix(rebate)};
}