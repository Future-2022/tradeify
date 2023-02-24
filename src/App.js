import React, { useEffect, useContext } from 'react';
import { Routes, Route } from 'react-router-dom';
import { WalletStandardAdapterProvider } from '@mysten/wallet-adapter-wallet-standard'
import { WalletProvider } from '@mysten/wallet-adapter-react'
import { JsonRpcProvider } from '@mysten/sui.js'
import "@fontsource/ibm-plex-sans";
import './App.css';
import './css/tailwind.output.css';
import './css/fontawesome-free-6.0.0-beta3-web/css/fontawesome.css';
import 'react-notifications/lib/notifications.css';

import Home from './pages/Home';
import Referral from './pages/Referral';
import Earn from './pages/Earn';
import Trade from './pages/Trade';
import Market from './pages/Market';
import Liquidity from './pages/Liquidity';
import LockStake from './pages/LockStake';
import { ToastContainer, toast } from 'react-toastify';
import Header from './components/Header';

import { StoreContext } from './store';

import { CONFIG } from './lib/config';

const supportedWallets = [new WalletStandardAdapterProvider()]
const provider = new JsonRpcProvider(CONFIG.rpcUrl);

function App() {
  const [modalIsOpen, setModalIsOpen] = React.useState(false);
  const [account, setAccount] = React.useState('');
  const [wallet, setWallet] = React.useState('');
  const [marketToken, setMarketToken] = React.useState("S");
  const [marketTokenPrice, setMarketTokenPrice] = React.useState(undefined);
  const [newCoins, setNewCoins] = React.useState(undefined);
  const [coinBalances, setCoinBalances] = React.useState(undefined);
  const [isAlterSecondToken, setIsAlterSecondToken] = React.useState("SUI");
  const [traderData, setTraderData] = React.useState([]);

  const storeValue = {
    account, setAccount,
    modalIsOpen, setModalIsOpen,
    newCoins, setNewCoins,
    coinBalances, setCoinBalances,
    provider,
    wallet, setWallet,
    isAlterSecondToken, setIsAlterSecondToken,
    marketToken, setMarketToken,
    traderData, setTraderData,
    marketTokenPrice, setMarketTokenPrice,
  }

  return (
    <WalletProvider adapters={supportedWallets}>
      <StoreContext.Provider value= {storeValue}>
        {/* <UseSuiWalletProvider>          */}
          <React.Fragment>  
          <Header />
            <Routes>    
              <Route path="/" element={<Home />} />
              <Route path="/referral" element={<Referral />} />
              <Route path="/earn" element={<Earn />} />
              <Route path="/trade" element={<Trade />} />
              <Route path="/market" element={<Market />} />
              <Route path="/liquidity" element={<Liquidity />} />
              <Route path="/earn/lockStake" element={<LockStake />} />
              </Routes>
              <ToastContainer
                  className='custom-toast'
                  autoClose={3000}
                  closeButton={false}
                  closeOnClick
                  theme='light'
                  position='bottom-right'
              />              
          </React.Fragment>  
        {/* </UseSuiWalletProvider> */}
      </StoreContext.Provider>
    </WalletProvider>
  );
}

export default App;
