
import React, { useState, useEffect, useContext } from 'react';
import { FaAngleDown } from 'react-icons/fa';
import { WalletAdapter } from '@mysten/wallet-adapter-base';
import { ToastContainer, toast } from 'react-toastify';
import Modal from 'react-modal';
import { useWallet } from '@mysten/wallet-adapter-react';
import {
    ObjectId,
    Provider,
    Coin,
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
import { calcSwapOut, swap } from '../../lib/tradeify-sdk/pool';
import { getCoins, getSwapPrice, getTokenPrice, getMainCoins, changeDecimal8Fix, getUniqueCoinTypes, getCoinBalances, changeDecimal, fetchLPCoins, changeBigNumber, changeDecimal5Fix } from '../../control/main';

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

const Swap = (props) => {    

    const globalContext = useContext(StoreContext);     
    const { wallets, wallet, select, connected, disconnect } = useWallet();
    const [tokenPrice, setTokenPrice] = useState([]);   
    const [isOpenModal, setIsOpenModal] = useState(false);
    const [isSelectActive, setIsSelectActive] = useState(1);
    
    const [coins, setCoins] = useState(undefined);
    const [coinBalance, setCoinBalance] = useState([]);
    const [lpCoin, SetLPCoin] = useState([]);
    const [inPoolId, setInPoolId] = useState(null);  
    const [outPoolId, setOutPoolId] = useState(null);  
    // const [isACS, setIsACS] = useState(true);
    
    const {optionIndex} = props;

    // buy constant
    const [firstToken, setFirstToken] = useState([{label: "Select"}]);
    const [firstTokenValue, setFirstTokenValue] = useState(undefined);
    const [firstTokenMaxValue, setFirstTokenMaxValue] = useState(0);
    const [firstTokenPrice, setFirstTokenPrice] = useState(0);
    const [availableLiquidity, setAvailableLiquidity] = useState(0);

    const [secondToken, setSecondToken] = useState([{label: "Select"}]);
    const [secondTokenValue, setSecondTokenValue] = useState(undefined);
    const [secondTokenPrice, setSecondTokenPrice] = useState(0);
    
    const [mainCoins, setMainCoins] = useState([]);
    
    const getPrice = () => {       
        getTokenPrice().then(item => {
            setTokenPrice(item);      

            if(secondToken[0].label != 'Select') {
                item.map(itemValue => {
                    if(itemValue.symbol == secondToken[0].label) {
                        globalContext.setMarketTokenPrice(itemValue);
                    }
                })
            }    
        })  
    }

    useEffect(() => {
        const interval = setInterval(() => {
            getPrice();
        }, CONFIG.timeIntervalOfPrice);
        return () => clearInterval(interval);
    }, [secondToken]);

    useEffect(() => {
        getCoins(globalContext.provider, localStorage.getItem('walletAddress')).then(item => {
            const mainCoins = getMainCoins(tokenPrice, lpCoin);
            setMainCoins(mainCoins);
        })
    }, [lpCoin, tokenPrice])

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

    const selectToken = async (type) => {
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
                lpCoin.map(item => {
                    if(item.metadata[0].typeArg == token[0].value) {
                        setInPoolId(item);                        
                        tokenPrice.map(itemValue => {
                            if(itemValue.symbol == item.metadata[0].symbol) {
                                setFirstTokenPrice(itemValue.value);
                                setAvailableLiquidity(changeDecimal(item.data.balanceA.value))
                            }
                        })
                    }
                    
                })
                await setFirstToken(token);
                setFirstTokenMaxValue(value);
            } else {
                lpCoin.map(item => {
                    if(item.metadata[0].typeArg == token[0].value) {
                        setOutPoolId(item);                        
                        let priceItem = undefined;
                        tokenPrice.map(itemValue => {
                            if(itemValue.symbol == item.metadata[0].symbol) {
                                setSecondTokenPrice(itemValue.value);                                
                                priceItem = itemValue;
                            }
                        })  
                        globalContext.setMarketTokenPrice(priceItem);
                    }
                })                
                await setSecondToken(token);
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

    useEffect(() => {
        fetchLPCoins(globalContext.provider, globalContext.wallet).then(async (lpCoins) => {
            SetLPCoin(lpCoins);
        })
    }, [tokenPrice])

    const runSwap = async () => {
        try {
            await swap(globalContext.provider, wallet, {
                inputType1: firstToken[0].value,
                inputType2: secondToken[0].value,
                amount: BigInt(changeBigNumber(firstTokenValue)),
                inPoolId: inPoolId,
                outPoolId: outPoolId,
                tokenPrice1: firstTokenPrice,
                tokenPrice2: secondTokenPrice,
            }).then((item) => {
                setFirstTokenValue(0);
                setSecondTokenValue(0);
                toast.info("Token swap has been completed successfully!");
            })
        } catch (e) {
            console.error(e)
        }
    }

    const handleFirstTokenChange = (value) => {
        setFirstTokenValue(value);
        let _secondTokenValue = 0;
        _secondTokenValue = (value * firstTokenPrice / secondTokenPrice).toFixed(3)
        console.log(_secondTokenValue);
        setSecondTokenValue(_secondTokenValue);
    }

    return (
        <div> 
            <div className='trade-token-select mb-2 mt-2'>
                <div className='d-flex justify-content-between'>
                    <h5 className='text-gray text-left fs-12'>Pay </h5>
                    <h5 className='text-gray-light text-left fs-12'>Balance: {changeDecimal(firstTokenMaxValue)} {firstToken[0].label} </h5>
                </div>
                <div className='d-flex justify-content-between'>
                    <input type='text' className='token-select-input' placeholder='0.0' value={firstTokenValue} onChange={(e) => handleFirstTokenChange(e.target.value)}/>
                    <div className='d-flex cursor-pointer token-select' onClick={() => openModal(1)}><h4>{firstToken[0].label}</h4><FaAngleDown className='fs-26 mt-2' /></div>
                </div>
            </div>
            <div className='ex-logo-part'><img src={ExchangeLogo} width={45} className='exchange-logo' /></div>
            <div className='trade-token-select mt-2'>
                <div className='d-flex justify-content-between'><p className='text-gray text-left'>Receive</p></div>
                <div className='d-flex justify-content-between'>
                    <input type='text' className='token-select-input text-gray' disabled placeholder='0.0' value={secondTokenValue} />
                    <div className='d-flex cursor-pointer token-select' onClick={() => openModal(2)}><h4>{secondToken[0].label}</h4><FaAngleDown className='fs-26 mt-2' /></div>
                </div>
            </div>
            {optionIndex == 2 && (
                <div className='trade-token-select mt-2'>
                    <div className='d-flex justify-content-between'><p className='text-gray text-left'>Price</p><p className='text-gray text-left'>Mark: 1233.23</p></div>
                    <div className='d-flex justify-content-between'>
                        <input type='text' className='token-select-input' placeholder='0.0' />
                        <div className='d-flex cursor-pointer token-select'><h4>USD Per ETH</h4></div>
                    </div>
                </div>
            )}
            
            {globalContext.account == null && connected == false && (
                <div className='earn-button w-100 text-center'>Connect Wallet</div>
            )} 
            {globalContext.account != '' && connected != false && (
                <div className='earn-button w-100 text-center' onClick={runSwap}>Swap</div>
            )}
            <div className='d-flex justify-content-between'>
                <p className='text-left text-gray pt-2'>Fees</p>
                <p className='pt-2'>3%</p>
            </div>      
            <div className='pt-3'>
                <div className='d-flex justify-content-between'>
                    <p className='text-gray'>{firstToken[0].label} price</p>
                    <p>${firstTokenPrice}</p>
                </div>
                <div className='d-flex justify-content-between'>
                    <p className='text-gray'>{secondToken[0].label} price</p>
                    <p>${secondTokenPrice}</p>
                </div>
                <div className='d-flex justify-content-between'>
                    <p className='text-gray'>Avaiable Liquidity</p>
                    <p>{availableLiquidity} {firstToken[0].label}</p>
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
                            {mainCoins.map(item => {
                                return <div className='d-flex token-item justify-content-between' onClick={() => selectToken(item.symbol)}>
                                    <div className='d-flex'>
                                        <img src={item.tokenIcon} width={45} />
                                        <div className='ml-4'>
                                            <h5 className='text-white text-left'>{item.symbol}</h5>
                                            <p className='text-gray'>{item.tokenName}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <h5 className='text-white text-right'>$ {item.price}</h5>
                                        <p className='text-green text-right'>+0.17</p>
                                    </div>
                                </div>
                            })}
                        </div>
                    </div>
                </div>
            </Modal>                         
        </div>
    )
}
export default Swap;
