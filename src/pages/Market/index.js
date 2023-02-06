
import React, { useState, useEffect, useContext } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import { useWallet } from '@mysten/wallet-adapter-react';
import { FaAngleDown } from 'react-icons/fa';
import { useMediaQuery } from 'react-responsive';

import "@fontsource/space-grotesk";
import './index.css';

import { changeDecimal, fetchLPCoins, LPMetaData, isLoggedIn } from '../../control/main';
import { StoreContext } from '../../store';
import { CONFIG } from '../../lib/config';
import { buyTLPSdk } from '../../lib/tradeify-sdk/pool';

import ExchangeLogo from '../../img/png/exchange.png';
import TokenIcon1 from '../../img/png/SUI.png';
import TokenIcon2 from '../../img/svg/BTC.svg';
import TokenIcon3 from '../../img/png/eth-bg.png';
import TokenIcon from '../../img/png/token-logo.png';

const Market = (props) => {
    const { wallets, wallet, select, connected, disconnect } = useWallet();
    const globalContext = useContext(StoreContext); 
    const [switchMarket, setSwitchMarket] = useState(1);

    const [firstToken, setFirstToken] = useState([{label: "Select"}]);
    const [firstTokenValue, setFirstTokenValue] = useState(0);
    const [firstTokenMaxValue, setFirstTokenMaxValue] = useState(0);

    const [secondToken, setSecondToken] = useState([{label: "Select"}]);
    const [secondTokenValue, setSecondTokenValue] = useState(0);
    const [secondTokenMaxValue, setSecondTokenMaxValue] = useState(0);

    const [isACS, setIsACS] = useState(true);

    const [isSelectActive, setIsSelectActive] = useState(1);
    const [isTokenMenu, setIsTokenMenu] = useState(false);
    const isMobile = useMediaQuery({ query: '(max-width: 480px)' });

    const [lpCoin, SetLPCoin] = useState([]);
    const [lpToken, setLPToken] = useState(0);  
    const [poolId, setPoolId] = useState(null);  

    const openTokenModal = (part) => {
        setIsSelectActive(part);
        setIsTokenMenu(true);
    }

    const selectToken = (type) => {        
        const token = globalContext.newCoins.filter(item => item.label == type);
        let value = undefined;
        globalContext.coinBalances.forEach((item, index) => {
            if(index == token[0].value) {
                value = item;
            }
        });
        if(isSelectActive == 1) {
            setFirstToken(token);
            setFirstTokenMaxValue(value);
        } else {
            setSecondToken(token);
            setSecondTokenMaxValue(value);
        }
        setIsTokenMenu(false);
    }

    const selectPercentage = (index, value) => {
        if(index == 1) {
            setFirstTokenValue(Number(firstTokenMaxValue) * value / 100);
            handleFirstTokenChange(Number(firstTokenMaxValue) * value / 100);
        } else {
            setSecondTokenValue(Number(secondTokenMaxValue) * value / 100);
        }
    }

    const handleFirstTokenChange = (value) => {
        setFirstTokenValue(value);
        let _secondTokenValue = 0;
        let _getLpValue = 0;
        const _firstTokenType = firstToken[0].label;
        const _secondTokenType = secondToken[0].label;
        lpCoin.map((item) => {
            if(_firstTokenType == item.metadata[0].symbol && _secondTokenType == item.metadata[1].symbol) {
                setIsACS(true);
                setPoolId(item);
                console.log(item);
                _secondTokenValue = value * Number(item.data.balanceB.value) / Number(item.data.balanceA.value);
                _getLpValue = (value * Number(item.data.lpSupply.value)) / Number(item.data.balanceA.value);
            } else if (_firstTokenType == item.metadata[1].symbol && _secondTokenType == item.metadata[0].symbol){
                setIsACS(false);
                setPoolId(item);
                _secondTokenValue = value * Number(item.data.balanceA.value) / Number(item.data.balanceB .value);
                _getLpValue = (value * Number(item.data.lpSupply.value)) / Number(item.data.balanceB.value);
            }
        })        
        setSecondTokenValue(_secondTokenValue);
        setLPToken(_getLpValue);
    }
    
    const handleSecondTokenChange = (value) => {
        setSecondTokenValue(value);
        let _firstTokenValue = 0;
        let _getLpValue = 0;
        const _firstTokenType = firstToken[0].label;
        const _secondTokenType = secondToken[0].label;
        lpCoin.map((item) => {
            if(_firstTokenType == item.metadata[0].symbol && _secondTokenType == item.metadata[1].symbol) {
                setIsACS(true);
                setPoolId(item);
                _firstTokenValue = value * Number(item.data.balanceA.value) / Number(item.data.balanceB.value);
                _getLpValue = (value * Number(item.data.lpSupply.value)) / Number(item.data.balanceB.value);
            } else if (_firstTokenType == item.metadata[1].symbol && _secondTokenType == item.metadata[0].symbol){
                setIsACS(false);
                setPoolId(item);
                _firstTokenValue = value * Number(item.data.balanceB.value) / Number(item.data.balanceA.value);
                _getLpValue = (value * Number(item.data.lpSupply.value)) / Number(item.data.balanceA.value);
            }
        })        
        setFirstTokenValue(_firstTokenValue);
        setLPToken(_getLpValue);
    }

    const buyTLP = async () => {
        const isLog = isLoggedIn();
        if(isLog == false) {
            toast.error("Please connect wallet");
        } else {
            try {  
                let inputAmountA = 0;
                let inputAmountB = 0;

                if(isACS == false) {
                    inputAmountA = BigInt(firstTokenValue);
                    inputAmountB = BigInt(secondTokenValue);
                } else {
                    inputAmountA = BigInt(secondTokenValue);
                    inputAmountB = BigInt(firstTokenValue);
                }
                // console.log(poolId);
                await buyTLPSdk(globalContext.provider, wallet, { 
                    amountA: inputAmountA,
                    amountB: inputAmountB,
                    pool: poolId,
                    lpAmount: lpToken,
                    maxSlippagePct : CONFIG.defaultSlippagePct
                }).then((args) => {
                    toast.info("Token has been minted successfully!");
                    console.log("mint successfully");
                })
            } catch (e) {
                console.error(e)
            }
        }
    }

    const sellTLP = () => {
        alert('sell');
    }

    useEffect(() => {
        fetchLPCoins(globalContext.provider, globalContext.wallet).then(async (lpCoins) => {
            let totalLPValue = 0;
            lpCoins.map(item => {
                totalLPValue += Number(item.data.lpSupply.value);
            })
            // const newMetaData = LPMetaData(totalLPValue, lpCoins);
            // console.log(lpCoins);
            SetLPCoin(lpCoins);
        })
    }, [globalContext.newCoins])
    return (
        <div className={`d-flex ${isMobile == true ? `px-3`:`px-5`}`}>
            <div className='w-15'>
            </div>
            <div className='w-65 pb-3'>
                <div className='mt-5'><h3 className='text-white font-bold'>BUY/SELL TLP</h3></div>
                <div className='d-flex mt-3 flex-wrap'>
                    <div className={`market-form window ${isMobile == true ? `p-3`:`p-5 w-50`}`}>
                        
                        <div className='market-form-input d-flex justify-content-center mt-3'>
                            <div className={`py-3 w-50 ${switchMarket == 1 && 'active'}`}><p className={`text-center ${switchMarket != 1 ? 'text-grey':'text-white'}`} onClick={() => setSwitchMarket(1)}>Buy TLP</p></div>
                            <div className={`py-3 w-50 ${switchMarket == 2 && 'active'}`}><p className={`text-center ${switchMarket != 2 ? 'text-grey ':'text-white'}`} onClick={() => setSwitchMarket(2)}>Sell TLP</p></div>
                        </div>
                        {switchMarket == 1 && (
                            <div>
                                <div className='trade-token-select mb-2 p-4 mt-4'>
                                    <div><div><p className='text-gray text-left fs-12'>Max Amount: <span className='text-white'>{changeDecimal(firstTokenMaxValue)}</span> {firstToken[0].label}</p></div></div>
                                    <div className='d-flex justify-content-between'>
                                        <input type='text' className='token-select-input' placeholder='0.0' value={firstTokenValue} onChange={(e) => handleFirstTokenChange(e.target.value)} />
                                        <div className='d-flex cursor-pointer token-select' onClick={() => openTokenModal(1)}><h6>{firstToken[0].label}</h6><FaAngleDown className='fs-26' /></div>
                                    </div>
                                    <div className='d-flex justify-content-between py-3'>
                                        <div className='percent-item' onClick={() => selectPercentage(1, 25)}><p>25%</p></div>
                                        <div className='percent-item' onClick={() => selectPercentage(1, 50)}><p>50%</p></div>
                                        <div className='percent-item' onClick={() => selectPercentage(1, 75)}><p>75%</p></div>
                                        <div className='percent-item' onClick={() => selectPercentage(1, 100)}><p>100%</p></div>
                                    </div>
                                </div>
                                <div className='trade-token-select mb-2 p-4 mt-1'>
                                    <div><div><p className='text-gray text-left fs-12'>Max Amount: <span className='text-white'>{changeDecimal(secondTokenMaxValue)}</span> {secondToken[0].label}</p></div></div>
                                    <div className='d-flex justify-content-between'>
                                        <input type='text' className='token-select-input' placeholder='0.0' value={secondTokenValue} onChange={(e) => handleSecondTokenChange(e.target.value)} />
                                        <div className='d-flex cursor-pointer token-select' onClick={() => openTokenModal(2)}><h6>{secondToken[0].label}</h6><FaAngleDown className='fs-26' /></div>
                                    </div>
                                    <div className='d-flex justify-content-between py-3'>
                                        <div className='percent-item' onClick={() => selectPercentage(2, 25)}><p>25%</p></div>
                                        <div className='percent-item' onClick={() => selectPercentage(2, 50)}><p>50%</p></div>
                                        <div className='percent-item' onClick={() => selectPercentage(2, 75)}><p>75%</p></div>
                                        <div className='percent-item' onClick={() => selectPercentage(2, 100)}><p>100%</p></div>
                                    </div>
                                </div>
                                <div className='ex-logo-part'><img src={ExchangeLogo} width={45} className='exchange-logo' /></div>
                                <div className='trade-token-select mt-3 p-4'>
                                    <div className='d-flex justify-content-between'><p className='text-gray text-left'>Receive</p></div>
                                    <div className='d-flex justify-content-between'>
                                        <input type='text' className='token-select-input text-gray' value={lpToken} disabled placeholder='0.0' />
                                        <div className='d-flex cursor-pointer text-gray' disabled={true} ><h5>TLP</h5><FaAngleDown className='fs-26' /></div>
                                    </div>
                                </div>
                                <div className='pt-3'>
                                    <div className='d-flex justify-content-between'>
                                        <p className='text-gray py-2'>Free - Buy TLP</p>
                                        <p className='py-2'>$0</p>
                                    </div>
                                    <div className='d-flex justify-content-between'>
                                        <p className='text-gray py-2'>You will receive</p>
                                        <p className='py-2'>0 TLP</p>
                                    </div>
                                </div>  
                                {globalContext.account == null && connected == false && (
                                    <div className='earn-button w-100 text-center py-2 border-radius mb-3'>Connect Wallet</div>
                                )}                       
                                {globalContext.account != '' && connected == true && (
                                    <div className='earn-button w-100 text-center py-2 border-radius mb-3' onClick={() => buyTLP()}>Buy TLP</div>
                                )}    
                            </div> 
                        )}

                        {/* sell TLP part */}
                        {switchMarket == 2 && (
                            <div>
                                <div className='trade-token-select my-2 p-4'>
                                    <div className='d-flex justify-content-between'><h5 className='text-gray text-left fs-12'>Max Amount</h5></div>
                                    <div className='d-flex justify-content-between'>
                                        <input type='text' className='token-select-input' value={lpToken} placeholder='0.0' />
                                        <div className='d-flex cursor-pointer' disabled={true} ><h5>TLP</h5></div>
                                    </div>
                                </div>
                                <div className='ex-logo-part'><img src={ExchangeLogo} width={45} className='exchange-logo' /></div>

                                <div className='trade-token-select mb-2 p-4 mt-2'>
                                    <div><div><p className='text-gray text-left fs-12'>Max Amount: <span className='text-white'>{changeDecimal(firstTokenMaxValue)}</span> {firstToken[0].label}</p></div></div>
                                    <div className='d-flex justify-content-between'>
                                        <input type='text' className='token-select-input text-gray' disabled placeholder='0.0' value={firstTokenValue} onChange={(e) => handleFirstTokenChange(e.target.value)} />
                                        <div className='d-flex cursor-pointer token-select' onClick={() => openTokenModal(1)}><h6>{firstToken[0].label}</h6><FaAngleDown className='fs-26' /></div>
                                    </div>
                                    <div className='d-flex justify-content-between py-3'>
                                        <div className='percent-item' onClick={() => selectPercentage(1, 25)}><p>25%</p></div>
                                        <div className='percent-item' onClick={() => selectPercentage(1, 50)}><p>50%</p></div>
                                        <div className='percent-item' onClick={() => selectPercentage(1, 75)}><p>75%</p></div>
                                        <div className='percent-item' onClick={() => selectPercentage(1, 100)}><p>100%</p></div>
                                    </div>
                                </div>
                                <div className='trade-token-select mb-2 p-4 mt-1'>
                                    <div><div><p className='text-gray text-left fs-12'>Max Amount: <span className='text-white'>{changeDecimal(secondTokenMaxValue)}</span> {secondToken[0].label}</p></div></div>
                                    <div className='d-flex justify-content-between'>
                                        <input type='text' className='token-select-input text-gray' disabled placeholder='0.0' value={secondTokenValue} onChange={(e) => handleSecondTokenChange(e.target.value)} />
                                        <div className='d-flex cursor-pointer token-select' onClick={() => openTokenModal(2)}><h6>{secondToken[0].label}</h6><FaAngleDown className='fs-26' /></div>
                                    </div>
                                    <div className='d-flex justify-content-between py-3'>
                                        <div className='percent-item' onClick={() => selectPercentage(2, 25)}><p>25%</p></div>
                                        <div className='percent-item' onClick={() => selectPercentage(2, 50)}><p>50%</p></div>
                                        <div className='percent-item' onClick={() => selectPercentage(2, 75)}><p>75%</p></div>
                                        <div className='percent-item' onClick={() => selectPercentage(2, 100)}><p>100%</p></div>
                                    </div>
                                </div>
                                
                                <div className='pt-3'>
                                    <div className='d-flex justify-content-between'>
                                        <p className='text-gray py-2'>Free - Buy TLP</p>
                                        <p className='py-2'>$0</p>
                                    </div>
                                    <div className='d-flex justify-content-between'>
                                        <p className='text-gray py-2'>You will receive</p>
                                        <p className='py-2'>0 TLP</p>
                                    </div>
                                </div>  
                                {globalContext.account == null && connected == false && (
                                    <div className='earn-button w-100 text-center py-2 border-radius mb-3'>Connect Wallet</div>
                                )}                       
                                {globalContext.account != '' && connected == true && (
                                    <div className='earn-button w-100 text-center py-2 border-radius mb-3' onClick={() => sellTLP()}>SELL TLP</div>
                                )}    
                            </div>
                        )}
                                          
                        
                    </div>
                    <div className={`${isMobile == true ? `w-100`:`pl-2 w-50`}`}>
                        <div className={`market-form window ${isMobile == true ? `ml-0 mt-3 p-3`:`ml-2 p-5`}`}>
                            <div className='pt-3'>
                                <div className='d-flex'>
                                    <img src={TokenIcon} className='mr-3 img-circle' width={35} /> <h4>TLP</h4>
                                </div>
                                <div className='d-flex justify-content-between pt-3'>
                                    <p className='text-gray py-2 pt-3'>Stake APR</p>
                                    <h4 className='py-2'>36.79%</h4>
                                </div>
                                <div className='d-flex justify-content-between'>
                                    <p className='text-gray py-2'>Price</p>
                                    <p className='py-2 text-pink-sharp'>$ 0.782</p>
                                </div>
                                <div className='d-flex justify-content-between'>
                                    <p className='text-gray py-2'>Total staked</p>
                                    <p className='py-2 text-pink-sharp'>13,912,574 TLP</p>
                                </div>
                            </div>                         
                        </div>
                        <div className={`market-form window  mt-3 ${isMobile == true ? `ml-0 p-3`:`ml-2 p-5`}`}>
                            <div className='pt-3'>
                                <div className='d-flex'>
                                    <h4>Your TLP</h4>
                                </div>
                                <div className='d-flex justify-content-between'>
                                    <p className='text-gray py-2'>Balance</p>
                                    <p className='py-2'>0.00 TLP</p>
                                </div>
                                <div className='d-flex justify-content-between'>
                                    <p className='text-gray py-2'>You staked</p>
                                    <p className='py-2'>0.00 TLP</p>
                                </div>
                                <div className='d-flex justify-content-between'>
                                    <p className='text-gray py-2'>Claimable rewards</p>
                                    <p className='py-2'>$0.00</p>
                                </div>
                                <div className='d-flex mt-3'>
                                    <div className='earn-button w-100 text-center py-2 border-radius mb-3 mr-2'>Connect Wallet</div>
                                    <div className='earn-button-grey w-100 text-center  py-2 border-radius mb-3 ml-2'>Claim rewards</div>
                                </div>
                            </div>                         
                        </div>
                    </div>
                </div>
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
            )}
        </div>
    )
}

export default Market;

