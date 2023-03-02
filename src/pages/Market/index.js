
import React, { useState, useEffect, useContext } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import { useWallet } from '@mysten/wallet-adapter-react';
import { FaAngleDown, FaAngleRight, FaBoxOpen, FaOpencart, FaRegFrownOpen } from 'react-icons/fa';
import { useMediaQuery } from 'react-responsive';
import {
    Coin,
} from '@mysten/sui.js'
import Modal from 'react-modal';

import "@fontsource/space-grotesk";
import './index.css';

import { changeDecimal, fetchLPCoins, getStakingPoolStatus, getTokenPrice,
     LPMetaData, isLoggedIn, fetchUserLpCoins, getUniqueCoinTypes, getMainCoins,
     getCoinBalances, getCoins, findStakingMeta, changeBigNumber, changeDecimal5Fix, changeDecimal0Fix, changeDecimal8Fix } from '../../control/main';
import { StoreContext } from '../../store';
import { CONFIG } from '../../lib/config';
import { buyTLPSdk, sellTLPSdk } from '../../lib/tradeify-sdk/pool';
import { UnStakeTLP, getStakingReward } from '../../lib/tradeify-sdk/staking';
import Exchange1Logo from '../../img/png/exchange1.png';
import Exchange2Logo from '../../img/png/exchange2.png';
import TokenIcon from '../../img/png/token-logo.png';

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

const Market = (props) => {

    const { wallet, connected } = useWallet();
    const globalContext = useContext(StoreContext); 
    const [switchMarket, setSwitchMarket] = useState(1);
    const [activeLP, setActiveLP] = useState(null);
    const [TLPbalance, setTLPbalace] = useState('0');
    const [poolLPValue, setPoolLPValue] = useState(0);

    // staking part
    const [totalLPValue, setTotalLPValue] = useState(0);
    const [stakingAPR, setStakingAPR] = useState(0);
    const [userReward, setUserReward] = useState(0);    
    const [stakingPoolStatus, setStakingPoolStatus] = useState(undefined);
    const [totalUserLP, setTotalUserLP] = useState(0);    
    const [userStakingStatus, setUserStakingStatus] = useState(undefined);
    const [totalSupplyTLP, setTotalSupplyTLP] = useState(undefined);

    // sell constant
    const [sellFirstTokenSymbol, setSellFirstTokenSymbol] = useState(null);
    const [sellFirstTokenValue, setSellFirstTokenValue] = useState(0);
    const [sellFirstTokenGetValue, setSellFirstTokenGetValue] = useState(0);

    // buy constant
    const [firstToken, setFirstToken] = useState([{label: "Select"}]);
    const [firstTokenValue, setFirstTokenValue] = useState("");
    const [firstTokenMaxValue, setFirstTokenMaxValue] = useState(0);    
    // 
    const [hasStakingMeta, setHasStakingMeta] = useState(false);

    const [isSelectActive, setIsSelectActive] = useState(1);
    const [isTokenMenu, setIsTokenMenu] = useState(false);
    const [isLPMenu, setIsLPMenu] = useState(false);
    const isMobile = useMediaQuery({ query: '(max-width: 480px)' });

    const [userLpCoin, setUserLPCoin] = useState(undefined);
    const [lpCoins, SetLPCoins] = useState([]);
    const [lpMetaData, SetLPMetaData] = useState([]);
    const [lpToken, setLPToken] = useState("");  
    const [lpTokenFee, setLPTokenFee] = useState(0);  
    const [poolId, setPoolId] = useState(null);  

    const [coins, setCoins] = useState(undefined);
    const [coinBalance, setCoinBalance] = useState([]);

    const [tokenPrice, setTokenPrice] = useState([]);   
    const [selectTokenPrice, setSelectTokenPrice] = useState(undefined);     
    const [mainCoins, setMainCoins] = useState([]);  

    const [statusIndex1, setStatusIndex1] = useState([]);  
    const [statusIndex2, setStatusIndex2] = useState([]);      

    useEffect(() => {
        if(isLoggedIn() == true) {
            const mainCoins = getMainCoins(tokenPrice, lpCoins);
            setMainCoins(mainCoins);
            if(switchMarket == 1) {
                handleFirstTokenChange(firstTokenValue);
            } else if (switchMarket == 2) {
                handleTLPTokenChange(lpToken);
            }
        }
    }, [lpCoins, tokenPrice])

    const connectWallet = () => {
        globalContext.setModalIsOpen(true);
    }
    const openTokenModal = (part) => {
        setIsSelectActive(part);
        setIsTokenMenu(true);
    }
    const closeModal = () => {
        setIsTokenMenu(false);
    }
    const getReward = () => {
        if(isLoggedIn() == false) {
            toast.error("Please connect wallet");
        } else if (userReward == "0") {
            toast.error("No claimabled amount. Please stake TLP");
        } else {
            if(hasStakingMeta == true) {
                const currentTimestamp = Date.now();      
                const metaPoolId = userStakingStatus.data.fields.id.id;
                getStakingReward(globalContext.provider, globalContext.wallet, {
                    stakingMetaId: metaPoolId,
                    currentTimestamp: currentTimestamp,
                    tlpType: CONFIG.tlp,
                    tryType: CONFIG.try
                }).then(res => {
                    toast.info(`TLP has been rewarded!`)
                    setUserReward(0);
                })
            }
        }
    }

     const getPrice = () => {       
        getTokenPrice().then(item => {
            setTokenPrice(item);   
        })  
    }

    useEffect(() => {
        const interval = setInterval(() => {
            getPrice();
        }, CONFIG.timeIntervalOfPrice);
        return () => clearInterval(interval);
    }, []);
    
    useEffect(() => {
        fetchLPCoins(globalContext.provider, globalContext.wallet).then(async (item) => {
            console.log(item)
            SetLPCoins(item)
        }) 
        if(isLoggedIn() == true) {
            fetchUserLpCoins(globalContext.provider, localStorage.getItem('walletAddress')).then((item) => {
                console.log(item)
                setUserLPCoin(item);
            })
        }
    }, [])

    useEffect(() => {
        // fetchLPCoins(globalContext.provider, globalContext.wallet).then(async (lpCoins) => {
            let totalLPValue = 0;
            lpCoins.map(item => {
                totalLPValue += Number(item.data.lpSupply);
            })
            const newMetaData = LPMetaData(tokenPrice, totalLPValue, lpCoins);
            SetLPMetaData(newMetaData.meta);
            // SetLPCoin(lpCoins);
        // })
    }, [tokenPrice, globalContext.account, lpCoins])
    
    useEffect(() => {
        let totalSupplyTLPValue = 0;
        if(isLoggedIn() == true) {
            getCoins(globalContext.provider, localStorage.getItem('walletAddress')).then(item => {
                const newCoins = getUniqueCoinTypes(item).map(arg => {
                    return { value: arg, label: Coin.getCoinSymbol(arg) }
                });
                const balance = getCoinBalances(item);
                balance.forEach((item, key) => {
                    if(key == CONFIG.tlp) {
                        setTLPbalace(changeDecimal(Number(item)).toString())
                    }
                })
                setCoinBalance(balance);
                setCoins(newCoins)
            })
            findStakingMeta(globalContext.provider, localStorage.getItem('walletAddress')).then((res) => {
                res.filter(res => res.owner.AddressOwner == localStorage.getItem('walletAddress')).map(item => {                
                    setUserStakingStatus(item);
                    setHasStakingMeta(true);
                })
            });
            fetchUserLpCoins(globalContext.provider, localStorage.getItem('walletAddress')).then(async (items) => {          
                let totalUserLPValue = 0; 
                items.map(args => {
                    totalUserLPValue += Number(args.balance.value);
                    setTotalUserLP(changeDecimal(totalUserLPValue));
                })
                setUserLPCoin(items);
            });
        }
        getStakingPoolStatus(globalContext.provider).then(res => {
            setStakingPoolStatus(res);
            totalSupplyTLPValue = res.details.data.fields.balance_tlp;
            setTotalSupplyTLP(totalSupplyTLPValue);
        })
    }, [totalLPValue, globalContext.account, lpToken])

    useEffect(() => {    
        // staking part
        fetchLPCoins(globalContext.provider, globalContext.wallet).then(async (lpCoins) => {
            let totalLPValue = 0;
            lpCoins.map(item => {
                totalLPValue += Number(item.data.lpSupply);
            })
            let APR = (Number(totalSupplyTLP) / Number(totalLPValue)) * 100;
            setStakingAPR(APR.toFixed(2));
            setTotalLPValue(changeDecimal0Fix(totalLPValue));
        })
    }, [totalLPValue, globalContext.account, totalSupplyTLP])

    const getRewardValue = () => {       
        if(stakingPoolStatus != undefined && userStakingStatus != undefined) {
            let currentTimestamp = Date.now();
            let Reward = (currentTimestamp - userStakingStatus.data.fields.start_timestamp) * Number(userStakingStatus.data.fields.staking_amount * 10)/Number(totalSupplyTLP);
            setUserReward(Reward);
        } 
    }

    useEffect(() => {
        const interval = setInterval(() => {
            getRewardValue();
        }, CONFIG.timeIntervalOfReward);
        return () => clearInterval(interval);
    }, [totalLPValue, globalContext.account, totalSupplyTLP, stakingPoolStatus, userStakingStatus]);
    
    
    const unStake = () => {
        if(isLoggedIn() == false) {
            toast.error("Please connect wallet");
        } else if (userStakingStatus == null) {
            toast.error("No staked TLP. Please stake TLP");
        } else if (userStakingStatus.data.fields.staking_amount == "0") {
            toast.error("No staked TLP. Please stake TLP");
        } else {
            if(hasStakingMeta == true) {   
                const metaPoolId = userStakingStatus.data.fields.id.id;
                UnStakeTLP(globalContext.provider, globalContext.wallet, {
                    stakingMetaId: metaPoolId,
                    tlpType: CONFIG.tlp,
                    tryType: CONFIG.try
                }).then(res => {
                    console.log(res);
                    toast.info(`${(userStakingStatus.data.fields.staking_amount - userStakingStatus.data.fields.staking_amount * CONFIG.tradingFee / 100)} TLP has been unstaked!`)
                })
            }
        }
    }
    const selectToken = (type) => {  
        if(coins == undefined) {
            toast.info("please wait for a few sec. now loading data");
            setIsTokenMenu(false);
        } else {
            console.log(coins);
            const token = coins.filter(item => item.label == type);
            if(token.length == 0) {
                toast.error("You don't have this token, please mint token!");
                setIsTokenMenu(false);
            }
            let value = undefined;
            coinBalance.forEach((item, index) => {
                if(index == token[0].value) {
                    value = item;
                    console.log(changeDecimal(Number(value)));
                }
            });
            if(isSelectActive == 1) {
                setFirstToken(token);
                setFirstTokenMaxValue(changeDecimal(Number(value)));
            }
            setIsTokenMenu(false);
        }
    }

    const selectPercentage = (index, value) => {
        if(index == 1) {
            setFirstTokenValue(Number(firstTokenMaxValue) * value / 100);
            handleFirstTokenChange(Number(firstTokenMaxValue) * value / 100);
        } else if(index == 3) {
            console.log(TLPbalance);
            let realValue = (Number((TLPbalance)) * value / 100);
            let inValue = (Number(TLPbalance) * value / 100 * (100 - 1) / 100);
            let inValueFee = (Number(TLPbalance) * value / 100 * 1 / 100);
            console.log(realValue)
            setLPTokenFee(inValueFee);
            handleTLPTokenChange(realValue.toFixed(8));
        }
    }

    const handleFirstTokenChange = (value) => {
        setFirstTokenValue(value);
        let _getLpValue = 0;
        const _firstTokenType = firstToken[0].label;
        lpCoins.map((item) => {
            if(_firstTokenType == item.metadata[0].symbol) {
                setPoolId(item);
                let fee = Number(item.data.lpFeeBps);
                _getLpValue = getTLPValue(_firstTokenType, value);
                let realValue = (_getLpValue * (10000 - fee) / 10000).toFixed(4);
                let feeValue =  (_getLpValue * fee / 10000).toFixed(4)
                setLPToken(changeDecimal(realValue));
                setLPTokenFee(changeDecimal(feeValue));
            } 
        })        
    }

    const getTLPValue = (tokenType, value) => {
        let price = 0;
        tokenPrice.map(item => {
            if(item.symbol == tokenType) {
                price = (Number(item.value)).toFixed(0);
                setSelectTokenPrice(price);
            }
        })
        return (changeBigNumber(value) * price / CONFIG.TLPPrice).toFixed(0);
    }

    const buyTLP = async () => {
        if(isLoggedIn() == false) {
            toast.error("Please connect wallet");
        } else {
            try {  
                let inputAmountA = 0;

                inputAmountA = BigInt(changeBigNumber(firstTokenValue));
                
                await buyTLPSdk(globalContext.provider, wallet, { 
                    amountA: inputAmountA,
                    pool: poolId,
                    maxSlippagePct : CONFIG.defaultSlippagePct,
                    price: selectTokenPrice
                }).then((args) => {
                    setFirstTokenValue(0);
                    setLPToken(0);
                    toast.info("Token TLP has been bought successfully!");
                    console.log("mint successfully");
                })
            } catch (e) {
                console.error(e)
            }
        }
    }

    const sellTLP = async () => {
        await userLpCoin.map(variable => {
            console.log(variable.balance.value)
            lpCoins.map((item) => {
                if(item.id == activeLP) {
                    sellTLPSdk(globalContext.provider, wallet, {
                        pool: item,
                        lpIn: variable.id,
                        amount: changeBigNumber(lpToken),
                        price: selectTokenPrice,
                        maxSlippagePct: CONFIG.defaultSlippagePct
                    }).then(item => {
                        setActiveLP(null);
                        setLPToken(0);
                        setSellFirstTokenGetValue(0);
                        toast.info("Your TLP token has been successfully sold!");
                    })
                }
            })
        })        
    }

    const handleTLPTokenChange = (value) => {
        setLPToken(value);
        getTokenValue(value);
    }
    const getTokenValue = (value) => {
        lpCoins.map((item) => {
            if(item.id == activeLP) {
                tokenPrice.map(itemValue => {
                    if(itemValue.symbol == item.metadata[0].symbol) {
                        setSelectTokenPrice(itemValue.value);
                        console.log(itemValue.value)
                        setSellFirstTokenGetValue(value * CONFIG.TLPPrice / itemValue.value)
                    }
                })
            }
        })
    }

    const setLP = (index) => {
        setActiveLP(index);
        setIsLPMenu(false);
        {lpMetaData.map((item) => {
            if(item.PoolId == index) {
                console.log(item)
                setPoolLPValue(changeDecimal(item.LPTokenValue));                
                setSellFirstTokenSymbol(item.LPFirstTokenSymbol);
                setSellFirstTokenValue(item.LPFirstTokenValue);
            }
        })}
    }

    useEffect(() => {
        checkSwapStatus();
    }, [firstTokenValue, globalContext.account, firstToken, activeLP, lpToken])

    const checkSwapStatus = () => {
        if(globalContext.account == null && connected == false) {
            setStatusIndex1(0);
        } else if (firstToken[0].label == "Select") {
            setStatusIndex1(1);
        } else if (globalContext.account != null && connected != false && (firstTokenValue == "" || firstTokenValue == 0)) {
            setStatusIndex1(2);
        } else if (globalContext.account != null && connected != false && Number(firstTokenValue) > firstTokenMaxValue) {
            setStatusIndex1(3);
        } else {
            setStatusIndex1(4);
        }

        let poolValue = 0;
        {lpMetaData.map((item) => {
            if(item.PoolId == activeLP) 
            poolValue = item.LPFirstTokenValue;
        })}
        if(globalContext.account == null && connected == false) {
            setStatusIndex2(0);
        } else if (activeLP == null) {
            setStatusIndex2(1);
        } else if (globalContext.account != null && connected != false && (lpToken == "" || lpToken == "0")) {
            setStatusIndex2(2);
        } else if (globalContext.account != null && connected != false && Number(lpToken) > TLPbalance) {
            setStatusIndex2(3);
        } else if (globalContext.account != null && connected != false && sellFirstTokenGetValue > Number(poolValue)) {
            setStatusIndex2(4);
        } else {
            setStatusIndex2(5);
        }
    }

    return (
        <div className={`d-flex ${isMobile == true ? `px-3`:`px-5`}`}>
            <div className='w-15'>
            </div>
            <div className='w-65 pb-3'>
                <div className='mt-5'><h3 className='text-white font-bold'>BUY/SELL TLP</h3></div>
                <div className='d-flex mt-3 flex-wrap'>
                    <div className={`market-form window your-stats ${isMobile == true ? `p-3`:`px-5 py-4 w-50`}`}>
                        {switchMarket == 1 && (
                            <div className='right-top-bg'></div>
                        )}
                        {switchMarket == 2 && (
                            <div className='right-top-bg2'></div>
                        )}
                        <div className='left-bottom-bg'></div>
                        <div className={`market-form-input d-flex justify-content-center mt-5 ${switchMarket != 1 ? 'border-red': 'border-green'}`}>
                            <div className={`py-3 w-50 ${switchMarket == 1 && 'active-green'}`}><p className={`text-center ${switchMarket != 1 ? 'text-grey':'text-white'}`} onClick={() => setSwitchMarket(1)}>Buy TLP</p></div>
                            <div className={`py-3 w-50 ${switchMarket == 2 && 'active-red'}`}><p className={`text-center ${switchMarket != 2 ? 'text-grey ':'text-white'}`} onClick={() => setSwitchMarket(2)}>Sell TLP</p></div>
                        </div>
                        {switchMarket == 1 && (
                            <div>
                                <div className='trade-token-select only-border-green mb-2 p-4 mt-4'>
                                    <div><div><p className='text-gray text-left fs-12'>Max Amount: <span className='text-white'>{firstTokenMaxValue}</span> {firstToken[0].label}</p></div></div>
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
                                <div className='ex-logo-part'><img src={Exchange1Logo} width={45} className='exchange-logo' /></div>
                                <div className='trade-token-select only-border-green mt-1 p-4'>
                                    <div className='d-flex justify-content-between'><p className='text-gray text-left'>Receive</p></div>
                                    <div className='d-flex justify-content-between'>
                                        <input type='text' className='token-select-input text-gray' value={lpToken} disabled placeholder='0.0' />
                                        <div className='d-flex cursor-pointer text-gray' disabled={true} ><h5>TLP</h5><FaAngleDown className='fs-26' /></div>
                                    </div>
                                </div>
                                <div className='pt-3'>
                                    <div className='d-flex justify-content-between'>
                                        <p className='text-gray py-2'>Fee - Buy TLP</p>
                                        <p>$ {lpTokenFee}</p>
                                    </div>
                                    <div className='d-flex justify-content-between'>
                                        <p className='text-gray py-2'>You will receive</p>
                                        <p>{lpToken} TLP</p>
                                    </div>
                                </div>  
                                {statusIndex1 == 0 && (
                                    <div className='earn-button w-100 text-center py-2 border-radius mb-3' onClick={connectWallet}>Connect Wallet</div>
                                )}                       
                                {statusIndex1 == 1 && (
                                    <div className='earn-button w-100 text-center py-2 border-radius mb-3 background-green btn-disabled'>Select token</div>
                                )}                       
                                {statusIndex1 == 2 && (
                                    <div className='earn-button w-100 text-center py-2 border-radius mb-3 background-green btn-disabled'>Enter Amount</div>
                                )}                       
                                {statusIndex1 == 3 && (
                                    <div className='earn-button w-100 text-center py-2 border-radius mb-3 background-green btn-disabled'>Insufficient Amount</div>
                                )}                       
                                {statusIndex1 == 4 && (
                                    <div className='earn-button w-100 text-center py-2 border-radius mb-3 background-green' onClick={() => buyTLP()}>Buy TLP</div>
                                )}    
                            </div> 
                        )}

                        {/* sell TLP part */}
                        {switchMarket == 2 && (
                            <div>
                                <div className='trade-token-select only-border-red my-2 px-4 py-2 mt-4'>
                                    <div className='d-flex justify-content-between'><h5 className='text-gray text-left fs-12'>Liquitidy Pool</h5></div>
                                    <div className='d-flex w-100 justify-content-between'>
                                        {activeLP == null && (<div className='px-3'>Select</div>)}
                                        {lpMetaData.map((item) => {
                                            if(item.PoolId == activeLP) 
                                            return <div className='d-flex justify-content-between w-100 px-3'><img src={item.LPFirstIcon} className='img-circle' /> {item.LPFirstTokenSymbol}</div>
                                        })}
                                        <div className='d-flex cursor-pointer mt-1' disabled={true} onClick={() => setIsLPMenu(true)} ><h5>LP</h5><FaAngleRight /></div>
                                    </div>
                                </div>
                                <div className='trade-token-select only-border-red my-2 px-4 py-2'>
                                    <div className='d-flex justify-content-between'><h5 className='text-gray text-left fs-12'>Max Amount : {poolLPValue}</h5><h5 className='text-gray-light text-left fs-12'>TLP balance: {Number(TLPbalance)}</h5></div>
                                    <div className='d-flex justify-content-between'>
                                        <input type='text' className='token-select-input' value={lpToken} placeholder='0.0' onChange={(e) => handleTLPTokenChange(e.target.value)}/>
                                        <div className='d-flex cursor-pointer' disabled={true} ><h5>TLP</h5></div>                                       
                                    </div>
                                    <div className='d-flex justify-content-between py-3'>
                                        <div className='percent-item' onClick={() => selectPercentage(3, 25)}><p>25%</p></div>
                                        <div className='percent-item' onClick={() => selectPercentage(3, 50)}><p>50%</p></div>
                                        <div className='percent-item' onClick={() => selectPercentage(3, 75)}><p>75%</p></div>
                                        <div className='percent-item' onClick={() => selectPercentage(3, 100)}><p>100%</p></div>
                                    </div>
                                </div>
                                <div className='ex-logo-part'><img src={Exchange2Logo} width={45} className='exchange-logo' /></div>

                                <div className='trade-token-select only-border-red mb-2 p-4 mt-1'>
                                    <div><div><p className='text-gray text-left fs-12'>LP {sellFirstTokenSymbol} Amount: <span className='text-white'>{sellFirstTokenValue.toFixed(2)}</span> {sellFirstTokenSymbol}</p></div></div>
                                    <div className='d-flex justify-content-between'>
                                        <input type='text' className='token-select-input text-gray' disabled placeholder='0.0' value={sellFirstTokenGetValue.toFixed(4)} />
                                        <div className='d-flex token-select'><h6 className='text-gray'>{sellFirstTokenSymbol}</h6></div>
                                    </div>
                                </div>
                                
                                <div className='pt-3'>
                                    <div className='d-flex justify-content-between'>
                                        <p className='text-gray'>You will receive</p>
                                        <div>
                                            <p>{sellFirstTokenGetValue.toFixed(4)} {sellFirstTokenSymbol}</p>
                                        </div>
                                    </div>
                                    <div className='d-flex justify-content-between'>
                                        <p className='text-gray'>Available liquidity</p>
                                        <div>
                                            {lpMetaData.map((item) => {
                                                if(item.PoolId == activeLP) 
                                                return <div className='d-flex justify-content-between w-100'>{(item.LPFirstTokenValue).toFixed(2)} {item.LPFirstTokenSymbol}</div>
                                            })}
                                        </div>
                                    </div>
                                </div>  
                                {statusIndex2 == 0 && (
                                    <div className='earn-button w-100 text-center py-2 border-radius mb-3' onClick={connectWallet}>Connect Wallet</div>
                                )}                       
                                {statusIndex2 == 1 && (
                                    <div className='earn-button w-100 text-center py-2 border-radius mb-3 background-red btn-disabled'>Select token</div>
                                )}                       
                                {statusIndex2 == 2 && (
                                    <div className='earn-button w-100 text-center py-2 border-radius mb-3 background-red btn-disabled'>Enter Amount</div>
                                )}                       
                                {statusIndex2 == 3 && (
                                    <div className='earn-button w-100 text-center py-2 border-radius mb-3 background-red btn-disabled'>Insufficient Amount</div>
                                )}                       
                                {statusIndex2 == 4 && (
                                    <div className='earn-button w-100 text-center py-2 border-radius mb-3 background-red btn-disabled'>Overflow Pool Amount</div>
                                )}                       
                                {statusIndex2 == 5 && (
                                    <div className='earn-button w-100 text-center py-2 border-radius mb-3 background-red' onClick={() => sellTLP()}>SELL TLP</div>
                                )}   
                            </div>
                        )}
                                          
                        
                    </div>
                    <div className={`${isMobile == true ? `w-100`:`pl-2 w-50`}`}>
                        <div className={`market-form window ${isMobile == true ? `ml-0 mt-2 p-3`:`ml-2 p-5`}`}>
                            <div className='pt-3'>
                                <div className='d-flex'>
                                    <img src={TokenIcon} className='mr-3 img-circle' width={35} /> <h4>TLP</h4>
                                </div>
                                <div className='d-flex justify-content-between pt-3'>
                                    <p className='text-gray py-2 pt-3'>Stake APR</p>
                                    <h4 className='py-2'>{stakingAPR}%</h4>
                                </div>
                                <div className='d-flex justify-content-between py-2'>
                                    <p className='text-gray py-2'>Total Staked TLP</p>
                                    <p className='text-pink-sharp'>{stakingPoolStatus != undefined ? changeDecimal0Fix(stakingPoolStatus.details.data.fields.balance_tlp) : 0} TLP</p>
                                </div>
                                <div className='d-flex justify-content-between py-2'>
                                    <p className='text-gray py-2'>Total Supply TLP</p>
                                    <p className='text-pink-sharp'>{totalLPValue} TLP</p>
                                </div>
                            </div>                         
                        </div>
                        <div className={`market-form window  mt-3 ${isMobile == true ? `ml-0 p-3`:`ml-2 p-5`}`}>
                            <div className='pt-3'>
                                <div className='d-flex'>
                                    <h4>Your TLP</h4>
                                </div>
                                <div className='d-flex justify-content-between py-1 mt-1'>
                                    <p className='text-gray py-2'>Balance</p>
                                    <p>{totalUserLP} TLP</p>
                                </div>
                                <div className='d-flex justify-content-between py-1'>
                                    <p className='text-gray py-2'>You staked</p>
                                    <p>{userStakingStatus != undefined ? changeDecimal(userStakingStatus.data.fields.staking_amount) : 0} TLP</p>
                                </div>
                                <div className='d-flex justify-content-between py-1'>
                                    <p className='text-gray py-2'>Claimable rewards</p>
                                    <p>{changeDecimal8Fix(userReward)} TRY</p>
                                </div>
                                <div className='d-flex mt-3'>
                                    <div className='earn-button-grey w-100 text-center  py-2 border-radius mb-3 ml-2' onClick={() => getReward()}>Claim rewards</div>
                                    <div className='earn-button-gray w-100 text-center  py-2 border-radius mb-3 ml-2' onClick={() => unStake()}>Unstake TLP</div>
                                </div>
                            </div>                         
                        </div>
                    </div>
                </div>
            </div>
            {isLPMenu && (
                <div>
                    <div className='token-menu p-4'>
                        <div className='d-flex justify-content-between'>
                            <div className='d-flex py-2'><h5 className='text-white'>Select Collaterals</h5></div>
                            <div className='text-white cursor-pointer' onClick={() => setIsLPMenu(false)}><h3 className='text-white'>x</h3></div>
                        </div>
                        <hr className='text-white my-1' />
                        <input className='referral text-gray mt-2 w-100 border-radius-0' type='text' placeholder='Search Token'/>
                        <div className='pt-4'>
                            {lpMetaData.map((item, index) => {     
                                console.log(item);                           
                                if(item.LPFirstTokenSymbol != "TRY")
                                    return <div className='d-flex token-item justify-content-between' onClick={() => setLP(item.PoolId)}>
                                        <div className='d-flex'>
                                            <img src={item.LPFirstIcon} width={45} />
                                            <div className='ml-4'>
                                                <h5 className='text-white text-left'>{item.LPFirstTokenSymbol}</h5>
                                                <p className='text-gray'>{item.LPFirstTokenValue.toFixed(3)}</p>
                                            </div>
                                        </div>
                                    </div>
                            })}                            
                        </div>
                    </div>
                </div>
            )}
                <Modal
                    isOpen={isTokenMenu}
                    onRequestClose={closeModal}
                    style={customStyles}
                    ariaHideApp={false}
                    contentLabel="Example Modal"
                >
                    <div>
                        <div className='d-flex justify-content-between'>
                            <h5 className='text-white my-auto'>Select token</h5>
                            <h4 className='text-white cursor-pointer' onClick={() =>setIsTokenMenu(false)}>x</h4>
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
                                            <p className={`${item.isEarn == 1 ? 'text-green':'text-red-value'} text-right`}>{item.isEarn == 1 ? '+':''} {item.changeValue} %</p>
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

export default Market;