
import React, { useState, useEffect, useContext } from 'react';
import { FaAngleDown } from 'react-icons/fa';
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

import ExchangeLogo from '../../img/png/exchange.png';
import TokenIcon1 from '../../img/png/SUI.png';
import TokenIcon2 from '../../img/svg/BTC.svg';
import TokenIcon3 from '../../img/png/eth-bg.png';

import Swap from './swap';
import Modal from 'react-modal';

const provider = new JsonRpcProvider(CONFIG.rpcUrl);
const TradeForm = () => {    
    const { wallet, connected } = useWallet();
    const [count, setCount] = useState(0);

    const { account, connecting, connects, disconnect } = useSuiWallet();

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
        global.setModalIsOpen(true);
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
                {formIndex == 1 && (
                    <div>
                        <div>
                            <div className='trade-form-select d-flex mt-2 p-relative'>
                                <div className='trade-token-select-1 mb-2 w-50'>
                                    <p className='text-gray text-left'>{orderType == 2 ? 'Limit Price':'Market Price'}</p>
                                    <div className='d-flex'>
                                        <span className={`${orderType == 1 && ('disabled')}`}>$</span><input type='text' className={`token-select-input ${orderType == 1 && ('disabled')}`} placeholder='0.0' value={limitPrice} onChange={(e) => setLimitPrice(e.target.value)} />
                                    </div>
                                </div>
                                <div className='trade-token-select-1 mb-2 ml-2 w-50'>
                                    <p className='text-gray text-left'>Order Type</p>
                                    <div className='d-flex justify-content-end'>
                                        <div className='d-flex cursor-pointer token-select mr-2' onClick={openMenu}><h5>{orderType == 2 ? 'Limit':'Market'}</h5><FaAngleDown className='fs-26 mt-1' /></div>
                                    </div>
                                </div>      
                                {isOrderMenu && (                        
                                    <div className='market-menu'>
                                        <div onClick={() => selectOrderType(1)}>Market</div>
                                        <div onClick={() => selectOrderType(2)}>Limit</div>
                                        <div onClick={() => selectOrderType(3)}>Stop Market</div>
                                    </div> 
                                )}    
                            </div> 

                            <div className='trade-token-select mb-2'>
                                <p className='text-gray text-left'>Pay</p>
                                <div className='d-flex justify-content-between'>
                                    <input type='text' className='token-select-input' placeholder='0.0' />
                                    <div className='d-flex cursor-pointer token-select' onClick={() => setIsTokenMenu(true)}><h5>ETH</h5><FaAngleDown className='fs-26 mt-1' /></div>
                                </div>
                            </div>
                            <div className='ex-logo-part'><img src={ExchangeLogo} width={45} className='exchange-logo' /></div>
                            <div className='trade-token-select mt-2'>
                                <div className='d-flex justify-content-between'><p className='text-gray text-left'>Long</p><p className='text-gray text-left'>Leverage:2.00x</p></div>
                                <div className='d-flex justify-content-between'>
                                    <input type='text' className='token-select-input' placeholder='0.0' />
                                    <div className='d-flex cursor-pointer token-select' onClick={() => setIsTokenMenu(true)}><h5>ETH</h5><FaAngleDown className='fs-26 mt-1' /></div>
                                </div>
                            </div>
                            {optionIndex == 2 && (
                                <div className='trade-token-select mt-2'>
                                    <div className='d-flex justify-content-between'><p className='text-gray text-left'>Price</p><p className='text-gray text-left'>Mark: 1233.23</p></div>
                                    <div className='d-flex justify-content-between'>
                                        <input type='text' className='token-select-input' placeholder='0.0' />
                                        <div className='d-flex cursor-pointer token-select'><h4>USD</h4></div>
                                    </div>
                                </div>
                            )}
                            <div>
                                <div className='text-left pt-2 d-flex justify-content-between'><p className='mt-3'>Leverage:{leverageValue}</p> <input type='text' className='form-control w-25 leverage' value={leverageValue} onChange={(e) => setLeverageValue(e.target.value)}/></div>
                                <div className='pt-3'>
                                    <Slider
                                        defaultValue={leverageValue}
                                        min={2}
                                        step={3}
                                        max={50}
                                        graduated
                                        progress
                                        value={leverageValue}
                                        onChange={(value) => { setLeverageValue(value) }}
                                        renderMark={mark => {
                                            return mark;
                                        }}
                                        className='custom-slider'
                                    />
                                </div>
                            </div>
                            {account == undefined && (
                                <div className='earn-button w-100 text-center' onClick={connectWallet}>Connect Wallet</div>
                            )}
                            {account != undefined && (
                                <div className='earn-button w-100 text-center'>Enter Amount</div>
                            )}
                            <div className='pt-3'>
                                <div className='d-flex justify-content-between'>
                                    <p className='text-gray'>Available Liquidity</p>
                                    <p>24,23.23 ETH</p>
                                </div>
                                <div className='d-flex justify-content-between'>
                                    <p className='text-gray'>Liquidity Source</p>
                                    <p>Tradeify</p>
                                </div>
                                <div className='d-flex justify-content-between'>
                                    <p className='text-gray'>Profits in</p>
                                    <p>ETH</p>
                                </div>
                                <div className='d-flex justify-content-between'>
                                    <p className='text-gray'>Liq.Price</p>
                                    <p>-</p>
                                </div>
                                <div className='d-flex justify-content-between'>
                                    <p className='text-gray'>Collateral</p>
                                    <p>-</p>
                                </div>
                                <div className='d-flex justify-content-between'>
                                    <p className='text-gray'>Fees</p>
                                    <p>-</p>
                                </div>
                                <div className='d-flex justify-content-between'>
                                    <p className='text-gray'>Spread</p>
                                    <p>0%</p>
                                </div>
                            </div>                            
                        </div>
                    </div>
                )}

                {/* Short trade part */}
                {formIndex == 2 && (
                    <div>
                        <div>
                            <div className='trade-form-select d-flex mt-2 p-relative'>
                                <div className='trade-token-select-1 mb-2 w-50'>
                                    <p className='text-gray text-left'>{orderType == 2 ? 'Limit Price':'Market Price'}</p>
                                    <div className='d-flex'>
                                        <span className={`${orderType == 1 && ('disabled')}`}>$</span><input type='text' className={`token-select-input ${orderType == 1 && ('disabled')}`} placeholder='0.0' value={limitPrice} onChange={(e) => setLimitPrice(e.target.value)} />
                                    </div>
                                </div>
                                <div className='trade-token-select-1 mb-2 ml-2 w-50'>
                                    <p className='text-gray text-left'>Order Type</p>
                                    <div className='d-flex justify-content-end'>
                                        <div className='d-flex cursor-pointer token-select mr-2' onClick={openMenu}><h5>{orderType == 2 ? 'Limit':'Market'}</h5><FaAngleDown className='fs-26 mt-1' /></div>
                                    </div>
                                </div>      
                                {isOrderMenu && (                        
                                    <div className='market-menu'>
                                        <div onClick={() => selectOrderType(1)}>Market</div>
                                        <div onClick={() => selectOrderType(2)}>Limit</div>
                                        <div onClick={() => selectOrderType(3)}>Stop Market</div>
                                    </div> 
                                )}    
                            </div> 

                            <div className='trade-token-select mb-2'>
                                <p className='text-gray text-left'>Pay</p>
                                <div className='d-flex justify-content-between'>
                                    <input type='text' className='token-select-input' placeholder='0.0' />
                                    <div className='d-flex cursor-pointer token-select' onClick={() => setIsTokenMenu(true)}><h5>ETH</h5><FaAngleDown className='fs-26 mt-1' /></div>
                                </div>
                            </div>
                            <div className='ex-logo-part'><img src={ExchangeLogo} width={45} className='exchange-logo' /></div>
                            <div className='trade-token-select mt-2'>
                                <div className='d-flex justify-content-between'><p className='text-gray text-left'>Short</p><p className='text-gray text-left'>Leverage:2.00x</p></div>
                                <div className='d-flex justify-content-between'>
                                    <input type='text' className='token-select-input' placeholder='0.0' />
                                    <div className='d-flex cursor-pointer token-select' onClick={() => setIsTokenMenu(true)}><h5>ETH</h5><FaAngleDown className='fs-26 mt-1' /></div>
                                </div>
                            </div>
                            {optionIndex == 2 && (
                                <div className='trade-token-select mt-2'>
                                    <div className='d-flex justify-content-between'><p className='text-gray text-left'>Price</p><p className='text-gray text-left'>Mark: 1233.23</p></div>
                                    <div className='d-flex justify-content-between'>
                                        <input type='text' className='token-select-input' placeholder='0.0' />
                                        <div className='d-flex cursor-pointer token-select'><h4>USD</h4></div>
                                    </div>
                                </div>
                            )}
                            <div>
                                <div className='text-left pt-2 d-flex justify-content-between'><p className='mt-3'>Leverage:{leverageValue}</p> <input type='text' className='form-control w-25 leverage' value={leverageValue} onChange={(e) => setLeverageValue(e.target.value)}/></div>
                                <div className='pt-3'>
                                    <Slider
                                        defaultValue={leverageValue}
                                        min={2}
                                        step={3}
                                        max={50}
                                        graduated
                                        progress
                                        value={leverageValue}
                                        onChange={(value) => { setLeverageValue(value) }}
                                        renderMark={mark => {
                                            return mark;
                                        }}
                                        className='custom-slider'
                                    />
                                </div>
                            </div>
                            {account == undefined && (
                                <div className='earn-button w-100 text-center' onClick={connectWallet}>Connect Wallet</div>
                            )}
                            {account != undefined && (
                                <div className='earn-button w-100 text-center'>Enter Amount</div>
                            )}
                            
                            <div className='pt-3'>
                                <div className='d-flex justify-content-between'>
                                    <p className='text-gray'>Available Liquidity</p>
                                    <p>24,23.23 ETH</p>
                                </div>
                                <div className='d-flex justify-content-between'>
                                    <p className='text-gray'>Liquidity Source</p>
                                    <p>Tradeify</p>
                                </div>
                                <div className='d-flex justify-content-between'>
                                    <p className='text-gray'>Profits in</p>
                                    <p>ETH</p>
                                </div>
                                <div className='d-flex justify-content-between'>
                                    <p className='text-gray'>Liq.Price</p>
                                    <p>-</p>
                                </div>
                                <div className='d-flex justify-content-between'>
                                    <p className='text-gray'>Collateral</p>
                                    <p>-</p>
                                </div>
                                <div className='d-flex justify-content-between'>
                                    <p className='text-gray'>Fees</p>
                                    <p>-</p>
                                </div>
                                <div className='d-flex justify-content-between'>
                                    <p className='text-gray'>Spread</p>
                                    <p>0%</p>
                                </div>
                            </div>                            
                        </div>
                    </div>
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
