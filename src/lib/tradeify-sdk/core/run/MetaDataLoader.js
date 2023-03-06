import { JsonRpcProvider, devnetConnection } from '@mysten/sui.js'
import { CONFIG } from '../../../config';
import { CoinMetadata } from '../../coin'
import { StoreContext } from '../../../../store';
import React, { useState, useEffect, useContext } from 'react';
const provider = new JsonRpcProvider(devnetConnection)
// console.log(provider)
const cache = new Map()

export class CoinMetadataLoader {
  static async loadMetadata(type) {
    let typeStr;
    if (typeof type === 'string') {
      typeStr = type
    } else {
      typeStr = type.toString()
    }

    if (cache.has(typeStr)) {
      return cache.get(typeStr)
    }

    try {
      // console.log(typeStr);
      const res = await provider.getCoinMetadata(typeStr)
      // console.log(res);
      const metadata = new CoinMetadata(typeStr, {
        id: res.id,
        decimals: res.decimals,
        name: res.name,
        symbol: res.symbol,
        description: res.description,
        iconUrl: res.iconUrl || undefined,
      })

      // console.log(metadata);
      cache.set(typeStr, metadata)
      return metadata
    } catch (e) {
      console.log(e);
    }
  }
}
