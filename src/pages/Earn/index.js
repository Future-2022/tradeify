import React, { useState, useEffect, useContext } from 'react';
import './index.css';
import TLP from '../../img/png/token-logo.png';
import { useMediaQuery } from 'react-responsive';
import { useWallet } from '@mysten/wallet-adapter-react';
import { fetchUserLpCoins, findStakingMeta, isLoggedIn, getStakingPoolStatus, fetchLPCoins, changeDecimal, 
    changeDecimal5Fix, changeBigNumber, changeDecimal0Fix, changeDecimal8Fix } from '../../control/main';
import { CONFIG } from '../../lib/config';
import { StoreContext } from '../../store';
import { stakeTLP, depositTLPStake, getStakingReward, UnStakeTLP } from '../../lib/tradeify-sdk/staking';

import { toast } from 'react-toastify';

const Earn = (props) => {
    
    const isMobile = useMediaQuery({ query: '(max-width: 480px)' });
    const globalContext = useContext(StoreContext);   
    const { connected } = useWallet();
    
    const [totalLPValue, setTotalLPValue] = useState(false);
    const [stakingAPR, setStakingAPR] = useState(0);
    const [userReward, setUserReward] = useState(0);

    // 
    const [hasStakingMeta, setHasStakingMeta] = useState(false);
    const [userStakingStatus, setUserStakingStatus] = useState(undefined);
    const [stakingPoolStatus, setStakingPoolStatus] = useState(undefined);
    const [totalSupplyTLP, setTotalSupplyTLP] = useState(undefined);

    // staking parameter
    const [tlpValue, setTLPvalue] = useState("");
    const [lockTime, setLockTime] = useState("");
    const [tlpPrice, setTlpPrice] = useState(CONFIG.TLPPrice);
    
    // UI parameter
    const [totalUserLP, setTotalUserLP] = useState(0);

    const [statusIndex, setStatusIndex] = useState(undefined);

    const getRewardValue = () => {       
        if(stakingPoolStatus != undefined && userStakingStatus != undefined) {
            console.log('ookk')
            let currentTimestamp = Date.now();
            let Reward = (currentTimestamp - userStakingStatus.data.fields.start_timestamp) * Number(userStakingStatus.data.fields.staking_amount)/Number(totalSupplyTLP);
            setUserReward(Reward);
        } 
    }

    useEffect(() => {
        const interval = setInterval(() => {
            console.log('first')
            getRewardValue();
        }, CONFIG.timeIntervalOfReward);
        return () => clearInterval(interval);
    }, [totalLPValue, tlpValue, globalContext.account, totalSupplyTLP, stakingPoolStatus, userStakingStatus]);

    // useEffect(() => {
    //     if(stakingPoolStatus != undefined && userStakingStatus != undefined) {
    //         let currentTimestamp = Date.now();
    //         let Reward = (currentTimestamp - userStakingStatus.data.fields.start_timestamp) * Number(userStakingStatus.data.fields.staking_amount)/Number(totalSupplyTLP);
    //         setUserReward(Reward);
    //     }
    // }, [totalLPValue, tlpValue, globalContext.account, totalSupplyTLP, stakingPoolStatus, userStakingStatus])
    
    const handleChangeTLP = (value) => {
        setTLPvalue(value);
    }

    const handleChangeLock = (value) => {
        setLockTime(value);
    }

    const handleChangeTLPByPercentage = (percentage) => {
        setTLPvalue(((totalUserLP - 0.5) * percentage / 100).toFixed(0));
    }

    const stakeTLPEvent = () => {
        const currentTimestamp = Date.now();        
        if(hasStakingMeta == false) {
            stakeTLP(globalContext.provider, globalContext.wallet, {
                tlpAmount: changeBigNumber(tlpValue),
                lockTime: Number(lockTime * 1000),
                currentTimestamp: currentTimestamp,
                tlpType: CONFIG.tlp,
                tryType: CONFIG.try
            }).then(res => {
                toast.info(`${tlpValue} TLP has been staked!`)
                setTLPvalue(0);
                setLockTime(0);
            })
        } else {
            const metaPoolId = userStakingStatus.data.fields.id.id;
            depositTLPStake(globalContext.provider, globalContext.wallet, {
                stakingMetaId: metaPoolId,
                tlpAmount: changeBigNumber(tlpValue),
                lockTime: Number(lockTime * 1000),
                currentTimestamp: currentTimestamp,
                tlpType: CONFIG.tlp,
                tryType: CONFIG.try
            }).then(res => {
                toast.info(`${tlpValue} TLP has been staked!`)
                setTLPvalue(0);
                setLockTime(0);
            })
        }
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
                    setUserStakingStatus(undefined);                
                    setUserReward(0);
                    toast.info(`${(userStakingStatus.data.fields.staking_amount - userStakingStatus.data.fields.staking_amount * CONFIG.tradingFee / 100)} TLP has been unstaked!`)
                })
            }
        }
    }

    useEffect(() => {
        let totalSupplyTLPValue = 0;
        if(isLoggedIn() == true) { 
            fetchUserLpCoins(globalContext.provider, localStorage.getItem('walletAddress')).then(async (items) => {          
                let totalUserLPValue = 0;            
                items.map(args => {
                    totalUserLPValue += Number(args.balance.value);
                    setTotalUserLP(changeDecimal(totalUserLPValue));
                })
            });
        }
        getStakingPoolStatus(globalContext.provider).then(res => {
            setStakingPoolStatus(res);
            totalSupplyTLPValue = res.details.data.fields.balance_tlp;
            setTotalSupplyTLP(totalSupplyTLPValue);
        })                
    }, [totalLPValue, tlpValue, globalContext.account, userStakingStatus])

    useEffect(() => {
        findStakingMeta(globalContext.provider, localStorage.getItem('walletAddress')).then((res) => {
            res.filter(res => res.owner.AddressOwner == localStorage.getItem('walletAddress')).map(item => {                
                setHasStakingMeta(true);
                setUserStakingStatus(item);
            })
        });
    }, [totalLPValue, tlpValue, globalContext.account])
    
    useEffect(() => {
        fetchLPCoins(globalContext.provider, globalContext.wallet).then(async (lpCoins) => {
            let totalLPValue = 0;
            lpCoins.map(item => {
                totalLPValue += Number(item.data.lpSupply);
            })
            let APR = (Number(totalSupplyTLP) / Number(totalLPValue)) * 100;
            setStakingAPR(APR);
            setTotalLPValue(totalLPValue);
        })
    }, [totalLPValue, tlpValue, globalContext.account, totalSupplyTLP])
    
    

    useEffect(() => {
        checkSwapStatus();
    }, [globalContext.account, tlpValue, lockTime])

    const checkSwapStatus = () => {
        if(globalContext.account == null && connected == false) {
            setStatusIndex(0);
        } else if (tlpValue == "" || lockTime == "") {
            setStatusIndex(1);
        } else if ((Number(tlpValue)) > Number(totalUserLP)) {
            setStatusIndex(2);
        } else if (Number(tlpValue) > 0 && Number(lockTime) > 0) {
            setStatusIndex(3);
        } 
    }

    return (
        <div>
            <div className={`d-flex ${isMobile == true ? `px-3`:`px-5`}`}>
                <div className='w-15 align-self-center'>
                </div>
                <div className='w-65 pb-3'>
                    <div className='mt-5'><h3 className='text-white font-bold'>TLP Staking</h3></div>
                    <div className='d-flex mt-3 flex-wrap'>
                        <div className={`market-form window your-stats ${isMobile == true ? `p-3`:`w-50 p-5`}`}>
                            <div className='right-top-bg'></div>
                            <div className='left-bottom-bg'></div>
                            <h4 className='mt-4'>Stake TLP</h4>  
                    
                            <div className='trade-token-select only-border-warning mb-2 p-4 mt-5'>
                                <div className='d-flex justify-content-between'>
                                    <h5 className='font-bold text-gray text-left fs-12'>TLP Balance</h5>
                                    <h5 className='text-gray text-left fs-12 font-bold'>Max: {Number(totalUserLP) > 1 ? Number(totalUserLP - 0.5).toFixed(0) : Number(totalUserLP).toFixed(0)} TLP</h5>
                                </div>
                                <div className='d-flex justify-content-between'>
                                    <input type='text' className='token-select-input' placeholder='0.0' value={tlpValue} onChange={(e) => handleChangeTLP(e.target.value)} />
                                    <div className='d-flex cursor-pointer token-select'><h5>TLP</h5></div>
                                </div>
                                <div className='d-flex justify-content-between py-3'>
                                    <div className='percent-item' onClick={() => handleChangeTLPByPercentage(25)}><p>25%</p></div>
                                    <div className='percent-item' onClick={() => handleChangeTLPByPercentage(50)}><p>50%</p></div>
                                    <div className='percent-item' onClick={() => handleChangeTLPByPercentage(75)}><p>75%</p></div>
                                    <div className='percent-item' onClick={() => handleChangeTLPByPercentage(100)}><p>100%</p></div>
                                </div>
                            </div>
                            <div className='trade-token-select only-border-warning mb-2 p-4 mt-3'>
                                <div className='d-flex justify-content-between'>
                                    <h5 className='font-bold fs-12 text-gray text-left'>Staking Lock Time</h5>
                                    <h5 className='font-bold fs-12 text-gray text-left'>Min: 50</h5>
                                </div>
                                <div className='d-flex justify-content-between'>
                                    <input type='text' className='token-select-input' placeholder='0.0' value={lockTime} onChange={(e) => handleChangeLock(e.target.value)} />
                                    <div className='d-flex cursor-pointer token-select'><h5>Second</h5></div>
                                </div>
                            </div>
                            {statusIndex == 0 && (
                                <div className='earn-button-grey w-100 text-center py-2 border-radius mb-3 mt-15' onClick={() => globalContext.setModalIsOpen(true)}>Connect Wallet</div>
                            )}
                            {statusIndex == 1 && (
                                <div className='earn-button-grey w-100 text-center py-2 border-radius mb-3 mt-15 btn-disabled'>Enter Amount</div>
                            )}
                            {statusIndex == 2 && (
                                <div className='earn-button-grey w-100 text-center py-2 border-radius mb-3 mt-15 btn-disabled'>Insufficient Amount</div>
                            )}
                            {statusIndex == 3 && (
                                <div className='earn-button-grey w-100 text-center py-2 border-radius mb-3 mt-15' onClick={() => stakeTLPEvent()}>Stake TLP</div>
                            )}
                        </div>
                        <div className={`${isMobile == true ? `w-100`:`w-50`}`}>
                            <div className={`market-form window ${isMobile == true ? `p-3 mt-3 ml-0`:`ml-3 p-5 `}`}>
                                <div className='pt-3'>
                                    <div className='d-flex'>
                                        <img src={TLP} className='mr-3 img-circle' width={35} /> <h4>TLP</h4>
                                    </div>
                                    <div className='d-flex justify-content-between pt-3'>
                                        <p className='text-gray py-2 pt-3'>Stake APR</p>
                                        <h4 className='py-2'>{stakingAPR.toFixed(2)}%</h4>
                                    </div>
                                    <div className='d-flex justify-content-between py-1'>
                                        <p className='text-gray py-2'>TLP Price</p>
                                        <p className='text-pink-sharp'>$ {tlpPrice}</p>
                                    </div>
                                    <div className='d-flex justify-content-between py-1'>
                                        <p className='text-gray py-2'>Total staked</p>
                                        <p className='text-pink-sharp'>{stakingPoolStatus != undefined ? changeDecimal0Fix(stakingPoolStatus.details.data.fields.balance_tlp) : 0} TLP</p>
                                    </div>
                                    <div className='d-flex justify-content-between py-1'>
                                        <p className='text-gray py-2'>Total TLP value</p>
                                        <p className='text-pink-sharp'>{changeDecimal0Fix(totalLPValue)} TLP</p>
                                    </div>
                                </div>                         
                            </div>
                            <div className={`market-form window mt-3 ${isMobile == true ? `p-3 ml-0`:`p-5 ml-3`}`}>
                                <div className='pt-3'>
                                    <div className='d-flex'>
                                        <h4>Your Stats</h4>
                                    </div>
                                    <div className='d-flex justify-content-between py-1 mt-3'>
                                        <p className='text-gray py-2'>Balance</p>
                                        <p>{Number(totalUserLP).toFixed(0)} TLP</p>
                                    </div>
                                    <div className='d-flex justify-content-between py-1'>
                                        <p className='text-gray py-2'>Staked TLP</p>
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
            </div>
        </div>
    )
}

export default Earn;