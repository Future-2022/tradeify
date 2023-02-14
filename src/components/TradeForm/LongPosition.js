
import React, { useState, useEffect, useContext } from 'react';
import { FaAngleDown, FaAngleLeft, FaArrowRight } from 'react-icons/fa';
import { WalletAdapter } from '@mysten/wallet-adapter-base';
import { useWallet } from '@mysten/wallet-adapter-react';
import {
    ObjectId,
    Provider,
    Coin,
    GetObjectDataResponse,
    JsonRpcProvider,
} from '@mysten/sui.js'
import { Slider } from 'rsuite';
import Modal from 'react-modal';
import { ToastContainer, toast } from 'react-toastify';
import { FaAlignRight } from 'react-icons/fa';

import { useSuiWallet } from '../../context/ConnectWallet/useSuiWallet';
import { StoreContext } from '../../store';
import { calcSwapOut } from '../../lib/tradeify-sdk/pool';
import { CONFIG } from '../../lib/config';

import './index.css';
import 'react-toastify/dist/ReactToastify.css';

import ExchangeLogo from '../../img/png/exchange.png';
import TokenIcon1 from '../../img/png/SUI.png';
import TokenIcon2 from '../../img/svg/BTC.svg';
import TokenIcon3 from '../../img/png/eth-bg.png';

import { getCoins, getUniqueCoinTypes, getCoinBalances, changeDecimal, fetchLPCoins } from '../../control/main';

const customStyles = {
    content: {
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-50%',
        width: '300px',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'rgb(30 27 49)',
        padding: '10px 20px',
        borderRadius: '9px',
        border: 'none'
    },
    overlay: {
      backgroundColor: 'rgb(0 0 0 / 86%)'
    }
};

const provider = new JsonRpcProvider(CONFIG.rpcUrl);
const LongPosition = () => {   
    const globalContext = useContext(StoreContext);     

    const { wallet, connected } = useWallet();
    const [isOpenModal, setIsOpenModal] = useState(false);
    const { account, connecting, connects, disconnect } = useSuiWallet();
    const [optionIndex, setOptionIndex] = useState(1);
    const [limitPrice, setLimitPrice] = useState(undefined);
    const [isOrderMenu, setIsOrderMenu] = useState(false);
    const [isTokenMenu, setIsTokenMenu] = useState(false);
    const [orderType, setOrderType] = useState(1);
    const [leverageValue, setLeverageValue] = useState(6);

    const [isSelectActive, setIsSelectActive] = useState(1);
    const [coins, setCoins] = useState(undefined);
    const [coinBalance, setCoinBalance] = useState([]);
    const [lpCoin, SetLPCoin] = useState([]);
    const [poolId, setPoolId] = useState(null);  
    const [isACS, setIsACS] = useState(true);

    // buy constant
    const [firstToken, setFirstToken] = useState([{label: "Select"}]);
    const [firstTokenValue, setFirstTokenValue] = useState(undefined);
    const [firstTokenMaxValue, setFirstTokenMaxValue] = useState(0);

    const [secondToken, setSecondToken] = useState([{label: "Select"}]);
    const [secondTokenValue, setSecondTokenValue] = useState(undefined);
    const [secondTokenMaxValue, setSecondTokenMaxValue] = useState(0);

    useEffect(() => {
        getCoins(globalContext.provider, localStorage.getItem('walletAddress')).then(item => {
            const newCoins = getUniqueCoinTypes(item).map(arg => {
                return { value: arg, label: Coin.getCoinSymbol(arg) }
            });
            const balance = getCoinBalances(item);
            setCoinBalance(balance);
            setCoins(newCoins)
        })
    }, [])

    useEffect(() => {
        fetchLPCoins(globalContext.provider, globalContext.wallet).then(async (lpCoins) => {
            SetLPCoin(lpCoins);
        })
    })
    
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
    const selectToken = (type) => {
        if(coins == undefined) {
            toast.info("please wait for a few sec. now loading data");
            setIsOpenModal(false);
        } else {
            const token = coins.filter(item => item.label == type);
            let value = undefined;
            coinBalance.forEach((item, index) => {
                if(index == token[0].value) {
                    value = item;
                }
            });
            if(isSelectActive == 1) {
                setFirstToken(token);
                if(secondToken[0].label != "Select") {
                    setMarketPrice(token, secondToken);
                }
                setFirstTokenMaxValue(value);
            } else {
                setSecondToken(token);
                if(firstToken[0].label != "Select") {
                    setMarketPrice(firstToken, token);
                }
                globalContext.setMarketToken(token[0].label);
            }
            setIsOpenModal(false);
        }
    }
    const closeModal = () => {
        setIsOpenModal(false);
    }
    const openModal = (type) => {
        setIsSelectActive(type);
        setIsOpenModal(true);
    }
    const handleFirstTokenChange = (value) => {
        setFirstTokenValue(value);
        let _secondTokenValue = 0;
        const _firstTokenType = firstToken[0].label;
        const _secondTokenType = secondToken[0].label;

        if(_firstTokenType != _secondTokenType) { 
            lpCoin.map((item) => {
                if(_firstTokenType == item.metadata[0].symbol && _secondTokenType == item.metadata[1].symbol) {
                    setIsACS(true);
                    setPoolId(item);                
                    _secondTokenValue = calcSwapOut(item, value, true);
                } else if (_firstTokenType == item.metadata[1].symbol && _secondTokenType == item.metadata[0].symbol){
                    setIsACS(false);
                    setPoolId(item);
                    _secondTokenValue = calcSwapOut(item, value, false);
                }
            }) 
        } else {
            _secondTokenValue = value - value * 1.3 / 100;
        }

        console.log(_secondTokenValue);
        setSecondTokenValue((_secondTokenValue * leverageValue).toFixed(3));
    }

    const selectLeverage = (value) => {
        setLeverageValue(value);
    }

    useEffect(() => {
        handleFirstTokenChange(firstTokenValue);
        console.log(secondTokenValue)
        console.log(firstTokenValue)
    }, [leverageValue])

    const createOrder = () => {
        alert("create long order");
    }

    const setMarketPrice = (firstToken, secondToken) => {
        let price = 0;        
        const _firstTokenType = firstToken[0].label;
        const _secondTokenType = secondToken[0].label;

        if(secondToken[0].label == "SUI") {
            setLimitPrice(1);
        } else {
            lpCoin.map((item) => {
                if(_firstTokenType == item.metadata[0].symbol && _secondTokenType == item.metadata[1].symbol) {
                    price = Number(item.data.balanceA.value) / Number(item.data.balanceB.value);
                } else if (_firstTokenType == item.metadata[1].symbol && _secondTokenType == item.metadata[0].symbol){
                    price = Number(item.data.balanceB.value) / Number(item.data.balanceA.value);
                } 
            })
            setLimitPrice(price.toFixed(3));
        }
    }

    return (
        <div>
            <div>
                <div className='trade-form-select d-flex mt-2 p-relative'>
                    <div className='trade-token-select-1 mb-2 w-50'>
                        <h5 className='fs-12 text-gray text-left'>{orderType == 2 ? 'Limit Price':'Market Price'}</h5>
                        <div className='d-flex'>
                            <span className={`text-gray d-flex`}>{orderType == 3 && (<span className='text-gray font-bold'>≥ </span>)} $</span><input type='text' className={`token-select-input ${orderType == 1 && ('disabled')}`} placeholder='0.0' value={limitPrice} onChange={(e) => setLimitPrice(e.target.value)} />
                        </div>
                    </div>
                    <div className='trade-token-select-1 mb-2 ml-2 w-50'>
                        <h5 className='fs-12 text-gray text-left'>Order Type</h5>
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
                    <div className='d-flex justify-content-between'>
                        <h5 className='text-gray text-left fs-12'>Pay </h5>
                        <h5 className='text-gray-light text-left fs-12'>Balance: {changeDecimal(firstTokenMaxValue)} {firstToken[0].label} </h5>
                    </div>
                    <div className='d-flex justify-content-between'>
                        <input type='text' className='token-select-input' placeholder='0.0' value={firstTokenValue} onChange={(e) => handleFirstTokenChange(e.target.value)} />
                        <div className='d-flex cursor-pointer token-select' onClick={() => openModal(1)}><h5>{firstToken[0].label}</h5><FaAngleDown className='fs-26 mt-1' /></div>
                    </div>
                </div>
                <div className='ex-logo-part'><img src={ExchangeLogo} width={45} className='exchange-logo' /></div>
                <div className='trade-token-select mt-2'>
                    <div className='d-flex justify-content-between'><h5 className='fs-12 text-gray text-left'>Long</h5><h5 className='text-gray-light fs-12 text-left'>Leverage: {leverageValue}x</h5></div>
                    <div className='d-flex justify-content-between'>
                        <input type='text' className='token-select-input text-gray' placeholder='0.0' disabled value={secondTokenValue}/>
                        <div className='d-flex cursor-pointer token-select' onClick={() => openModal(2)}><h5>{secondToken[0].label}</h5><FaAngleDown className='fs-26 mt-1' /></div>
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
                    <div className='text-left pt-2 d-flex justify-content-between'><p className='mt-3'>Leverage: {leverageValue}</p> <input type='text' className='form-control w-25 leverage' value={leverageValue} onChange={(e) => setLeverageValue(e.target.value)}/></div>
                    <div className='pt-3'>
                        <Slider
                            defaultValue={leverageValue}
                            min={2}
                            step={3}
                            max={50}
                            graduated
                            progress
                            value={leverageValue}
                            onChange={(value) => { selectLeverage(value) }}
                            renderMark={mark => {
                                return mark;
                            }}
                            className='custom-slider'
                        />
                    </div>
                </div>
                {globalContext.account == null && connected == false && (
                    <div className='earn-button w-100 text-center' onClick={connectWallet}>Connect Wallet</div>
                )}
                {globalContext.account != '' && connected != false && (
                    <>
                        {firstTokenValue == undefined && (
                            <div className='earn-button w-100 text-center'>Enter Amount</div>
                        )}
                        {firstTokenValue != undefined && secondTokenValue != undefined && (
                            <div className='earn-button w-100 text-center' onClick={createOrder}>Create Order</div>
                        )}
                    </>
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

            <Modal
                isOpen={isOpenModal}
                onRequestClose={closeModal}
                style={customStyles}
                ariaHideApp={false}
                contentLabel="Example Modal"
            >
                <div>
                    <div className='d-flex justify-content-between'>
                        <h5 className='text-white my-auto'>Select token</h5>
                        <h4 className='text-white cursor-pointer' onClick={() =>setIsOpenModal(false)}>x</h4>
                    </div>
                    <div className='py-3'>
                        <p className='text-white'>
                            To continue working with the site, you need to connect a wallet and allow the site access to your account.
                        </p>
                    </div>
                    <div>
                        <div className='pt-4'>
                            <div className='d-flex token-item justify-content-between' onClick={() => selectToken('SUI')}>
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
                            <div className='d-flex token-item justify-content-between' onClick={() => selectToken('ETH')}>
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
                            <div className='d-flex token-item justify-content-between' onClick={() => selectToken('BTC')}>
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
            </Modal> 
        </div>
    )
}
export default LongPosition;
