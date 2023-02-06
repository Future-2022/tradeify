import { useEffect, useState } from 'react';
import Big from 'big.js';

export const useBalance = (account) => {
    const [balance, setBalance] = useState('0.00');
  
    const getBalance = async () => {
      // if (account) {
      //   const responce = await provider.getCoinBalancesOwnedByAddress(account);
      //   const balance = Coin.totalBalance(responce)
      //   setBalance(Big(balance.toString()).div(10 ** 9).toString());
      // }
    }
  
    
    useEffect(() => {
      getBalance();
    }, [account]);
  
    return {
      balance
    }
}