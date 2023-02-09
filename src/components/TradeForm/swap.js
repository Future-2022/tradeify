
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

const Swap = (props) => {    

    const globalContext = useContext(StoreContext);     
    const { wallets, wallet, select, connected, disconnect } = useWallet();

    const [isOpenModal, setIsOpenModal] = useState(false);
    const [isSelectActive, setIsSelectActive] = useState(1);
    
    const [coins, setCoins] = useState([]);
    const [coinBalance, setCoinBalance] = useState([]);
    const [lpCoin, SetLPCoin] = useState([]);
    const [poolId, setPoolId] = useState(null);  
    const [isACS, setIsACS] = useState(true);
    
    const {optionIndex} = props;

    // buy constant
    const [firstToken, setFirstToken] = useState([{label: "Select"}]);
    const [firstTokenValue, setFirstTokenValue] = useState(0);
    const [firstTokenMaxValue, setFirstTokenMaxValue] = useState(0);

    const [secondToken, setSecondToken] = useState([{label: "Select"}]);
    const [secondTokenValue, setSecondTokenValue] = useState(0);
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

    const selectToken = (type) => {
        const token = coins.filter(item => item.label == type);
        let value = undefined;
        coinBalance.forEach((item, index) => {
            if(index == token[0].value) {
                value = item;
            }
        });
        if(isSelectActive == 1) {
            setFirstToken(token);
            setFirstTokenMaxValue(value);
        } else {
            setSecondToken(token);
        }
        setIsOpenModal(false);
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
    })

    const runSwap = async () => {
        try {
            await swap(globalContext.provider, wallet, {
                inputType: firstToken[0].value,
                amount: BigInt(firstTokenValue),
                maxSlippagePct: CONFIG.defaultSlippagePct,
                lpCoin: poolId,
                isACS: isACS
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
        console.log(value)
        setFirstTokenValue(value);
        let _secondTokenValue = 0;
        const _firstTokenType = firstToken[0].label;
        const _secondTokenType = secondToken[0].label;
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
        setSecondTokenValue(_secondTokenValue);
    }

    return (
        <div> 
            <div className='trade-token-select mb-2 mt-2'>
                <p className='text-gray text-left'>Pay: {changeDecimal(firstTokenMaxValue)} {firstToken[0].label}</p>
                <div className='d-flex justify-content-between'>
                    <input type='text' className='token-select-input' placeholder='0.0' value={firstTokenValue} onChange={(e) => handleFirstTokenChange(e.target.value)}/>
                    <div className='d-flex cursor-pointer token-select' onClick={() => openModal(1)}><h4>{firstToken[0].label}</h4><FaAngleDown className='fs-26 mt-2' /></div>
                </div>
            </div>
            <div className='ex-logo-part'><img src={ExchangeLogo} width={45} className='exchange-logo' /></div>
            <div className='trade-token-select mt-2'>
                <div className='d-flex justify-content-between'><p className='text-gray text-left'>Receive</p></div>
                <div className='d-flex justify-content-between'>
                    <input type='text' className='token-select-input text-gray' disabled placeholder='0.0' value={secondTokenValue.toFixed(0)} />
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
                <p className='text-left pt-2'>Fees</p>
                <p className='text-gray pt-2'>--</p>
            </div>      
            <div className='pt-3'>
                <div className='d-flex justify-content-between'>
                    <p className='text-gray'>ETH price</p>
                    <p>$1,219.14</p>
                </div>
                <div className='d-flex justify-content-between'>
                    <p className='text-gray'>USDC price</p>
                    <p>$1.00</p>
                </div>
                <div className='d-flex justify-content-between'>
                    <p className='text-gray'>Avaiable Liquidity</p>
                    <p>$13,196,042.35</p>
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
export default Swap;
