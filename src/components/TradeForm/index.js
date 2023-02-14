
import React, { useState, useEffect, useContext } from 'react';
import { FaAngleDown, FaAngleLeft, FaArrowRight } from 'react-icons/fa';
import { WalletAdapter } from '@mysten/wallet-adapter-base';
import { useWallet } from '@mysten/wallet-adapter-react';
import {
    ObjectId,
    Provider,
    Coin as SuiCoin,
    GetObjectDataResponse,
    JsonRpcProvider,
} from '@mysten/sui.js'
import { Slider } from 'rsuite';

import { useSuiWallet } from '../../context/ConnectWallet/useSuiWallet';
import { StoreContext } from '../../store';
import { CONFIG } from '../../lib/config';

import './index.css';
import 'react-toastify/dist/ReactToastify.css';

import { FaAlignRight } from 'react-icons/fa';

import ExchangeLogo from '../../img/png/exchange.png';
import TokenIcon1 from '../../img/png/SUI.png';
import TokenIcon2 from '../../img/svg/BTC.svg';
import TokenIcon3 from '../../img/png/eth-bg.png';

import Swap from './swap';
import LongPosition from './LongPosition';
import ShortPosition from './ShortPosition';

import Modal from 'react-modal';

const provider = new JsonRpcProvider(CONFIG.rpcUrl);
const TradeForm = () => {    
    const { wallet, connected } = useWallet();
    const [count, setCount] = useState(0);

    const { account, connecting, connects, disconnect } = useSuiWallet();
    const globalContext = useContext(StoreContext);     

    const [formIndex, setFormIndex] = useState(1);
    const [optionIndex, setOptionIndex] = useState(1);
    const [limitPrice, setLimitPrice] = useState(1234.23);
    const [isOrderMenu, setIsOrderMenu] = useState(false);
    const [isTokenMenu, setIsTokenMenu] = useState(false);
    const [orderType, setOrderType] = useState(1);
    const [leverageValue, setLeverageValue] = useState(6);

    const getWalletAddress = async (wallet) => {
        const accs = await wallet.getAccounts();
        return accs[0]
    }


    const connectWallet = () => {
        globalContext.setModalIsOpen(true);
    }
    const openMenu = () => {
        if(isOrderMenu == true) {
            setIsOrderMenu(false);
        } else {
            setIsOrderMenu(true);
        }
    }
    const selectOrderType = (index) => {
        setOrderType(index)
        setIsOrderMenu(false);
    }
    return (
        <div>
            <div className='trade-form'>
                <div className='trade-form-input d-flex justify-content-center'>
                    <div className={`${formIndex == 1 ? 'active' : ''}`}><p onClick={() => setFormIndex(1)}>Long</p></div>
                    <div className={`${formIndex == 2 ? 'active' : ''}`}><p onClick={() => setFormIndex(2)}>Short</p></div>
                    <div className={`${formIndex == 3 ? 'active' : ''}`}><p onClick={() => setFormIndex(3)}>Swap</p></div>
                </div>

                {/* Long position part */}
                {formIndex == 1 && (
                    <LongPosition />
                )}

                {/* Short position part */}
                {formIndex == 2 && (
                    <ShortPosition />
                )}

                {/* Token swap part */}
                {formIndex == 3 && (
                    <Swap setIsTokenMenu={setIsTokenMenu} />
                )}
            </div>
            
            {isTokenMenu && (
                <div>
                    <div className='token-menu p-4'>
                        <div className='d-flex justify-content-between'>
                            <div className='d-flex py-2'><h5 className='text-white'>Select Collateral</h5></div>
                            <div className='text-white cursor-pointer' onClick={() => setIsTokenMenu(false)}><h3 className='text-white'>x</h3></div>
                        </div>
                        <hr className='text-white my-1' />
                        <input className='referral text-gray mt-2 w-100 border-radius-0' type='text' placeholder='Search Token'/>
                        <div className='pt-4'>
                            <div className='d-flex token-item justify-content-between'>
                                <div className='d-flex'>
                                    <img src={TokenIcon1} width={45} />
                                    <div className='ml-4'>
                                        <h5 className='text-white text-left'>SUI</h5>
                                        <p className='text-gray'>Sui</p>
                                    </div>
                                </div>
                                <div>
                                    <h5 className='text-white text-right'>$1.0034</h5>
                                    <p className='text-green text-right'>+0.02</p>
                                </div>
                            </div>
                            <div className='d-flex token-item justify-content-between'>
                                <div className='d-flex'>
                                    <img src={TokenIcon3} width={45} />
                                    <div className='ml-4'>
                                        <h5 className='text-white text-left'>ETH</h5>
                                        <p className='text-gray'>Ethereum</p>
                                    </div>
                                </div>
                                <div>
                                    <h5 className='text-white text-right'>$1234.32</h5>
                                    <p className='text-red text-right'>-0.87</p>
                                </div>
                            </div>
                            <div className='d-flex token-item justify-content-between'>
                                <div className='d-flex'>
                                    <img src={TokenIcon2} width={45} />
                                    <div className='ml-4'>
                                        <h5 className='text-white text-left'>BTC</h5>
                                        <p className='text-gray'>Bitcoin</p>
                                    </div>
                                </div>
                                <div>
                                    <h5 className='text-white text-right'>$14034.43</h5>
                                    <p className='text-red text-right'>-0.34</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}         
                     
        </div>
    )
}
export default TradeForm;
