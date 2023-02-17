import React, { useState, useEffect, useContext } from 'react';
import './index.css';
import TLP from '../../img/png/token-logo.png';
import { FaAngleDown } from 'react-icons/fa';
import { useMediaQuery } from 'react-responsive';
import { useWallet } from '@mysten/wallet-adapter-react';
import { fetchUserLpCoins, findStakingMeta, getStakingPoolStatus, fetchLPCoins, changeDecimal } from '../../control/main';
import { CONFIG } from '../../lib/config';
import { StoreContext } from '../../store';
import { stakeTLP, depositTLPStake, getStakingReward, UnStakeTLP } from '../../lib/tradeify-sdk/staking';

import { ToastContainer, toast } from 'react-toastify';

const Earn = (props) => {
    
    const isMobile = useMediaQuery({ query: '(max-width: 480px)' });
    const globalContext = useContext(StoreContext);   
    const { account, connected, connecting, connects, disconnect } = useWallet();
    
    const [totalLPValue, setTotalLPValue] = useState(false);
    const [stakingAPR, setStakingAPR] = useState(0);
    const [userReward, setUserReward] = useState(0);

    // 
    const [hasStakingMeta, setHasStakingMeta] = useState(false);
    const [userStakingStatus, setUserStakingStatus] = useState(undefined);
    const [stakingPoolStatus, setStakingPoolStatus] = useState(undefined);

    // staking parameter
    const [tlpValue, setTLPvalue] = useState(0);
    const [lockTime, setLockTime] = useState(0);
    
    // UI parameter
    const [userLpCoin, setUserLPCoin] = useState([]);
    const [totalUserLP, setTotalUserLP] = useState(0);
    
    const handleChangeTLP = (value) => {
        setTLPvalue(value);
    }

    const handleChangeLock = (value) => {
        setLockTime(value);
    }

    const handleChangeTLPByPercentage = (percentage) => {
        setTLPvalue((totalUserLP * percentage / 100).toFixed(0));
    }

    const stakeTLPEvent = () => {
        const currentTimestamp = Date.now();        
        if(hasStakingMeta == false) {
            stakeTLP(globalContext.provider, globalContext.wallet, {
                tlpAmount: tlpValue,
                lockTime: Number(lockTime * 1000),
                currentTimestamp: currentTimestamp,
                tlpType: CONFIG.tlp,
                tryType: CONFIG.try
            }).then(res => {
                toast.info(`${tlpValue} TLP has been staked!`)
                setTLPvalue(0)
            })
        } else {
            const metaPoolId = userStakingStatus.data.fields.id.id;
            depositTLPStake(globalContext.provider, globalContext.wallet, {
                stakingMetaId: metaPoolId,
                tlpAmount: tlpValue,
                lockTime: Number(lockTime * 1000),
                currentTimestamp: currentTimestamp,
                tlpType: CONFIG.tlp,
                tryType: CONFIG.try
            }).then(res => {
                toast.info(`${tlpValue} TLP has been staked!`)
                setTLPvalue(0)
            })
        }
    }

    const getReward = () => {
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

    const unStake = () => {
        if(hasStakingMeta == true) {   
            const metaPoolId = userStakingStatus.data.fields.id.id;
            UnStakeTLP(globalContext.provider, globalContext.wallet, {
                stakingMetaId: metaPoolId,
                tlpType: CONFIG.tlp,
                tryType: CONFIG.try
            }).then(res => {
                toast.info(`${userStakingStatus.data.fields.staking_amount} TLP has been unstaked!`)
            })
        }
    }

    useEffect(() => {
        let totalSupplyTLP = 0;
        fetchUserLpCoins(globalContext.provider, localStorage.getItem('walletAddress')).then(async (items) => {          
            let totalUserLPValue = 0;            
            items.map(args => {
                totalUserLPValue += Number(args.balance.value);
                setTotalUserLP(totalUserLPValue);
            })
            setUserLPCoin(items);
        });
        findStakingMeta(globalContext.provider, localStorage.getItem('walletAddress')).then((res) => {
            res.filter(res => res.owner.AddressOwner == localStorage.getItem('walletAddress')).map(item => {                
                setHasStakingMeta(true);
                setUserStakingStatus(item);
            })
        });
        getStakingPoolStatus(globalContext.provider).then(res => {
            setStakingPoolStatus(res);
            totalSupplyTLP = res.details.data.fields.balance_tlp;
        })
        
        fetchLPCoins(globalContext.provider, globalContext.wallet).then(async (lpCoins) => {
            let totalLPValue = 0;
            lpCoins.map(item => {
                totalLPValue += Number(item.data.lpSupply.value);
            })
            if(stakingPoolStatus != undefined || userStakingStatus != undefined) {
                let APR = (Number(totalSupplyTLP) / Number(totalLPValue)) * 100;
                let currentTimestamp = Date.now();
                let Reward = 100 * (currentTimestamp - userStakingStatus.data.fields.start_timestamp) * Number(userStakingStatus.data.fields.staking_amount)/Number(totalSupplyTLP);
                setStakingAPR(APR);
                setUserReward(Reward);
            }
            setTotalLPValue(totalLPValue);
        })
        // calculateReward()
    }, [globalContext.newCoins, totalLPValue, tlpValue])

    // const calculateReward = () => {
    //     let currentTimestamp = Date.now();
    //     console.log(currentTimestamp); 
    // }

    return (
        <div>
            <div className={`d-flex ${isMobile == true ? `px-3`:`px-5`}`}>
                <div className='w-15 align-self-center'>
                </div>
                <div className='w-65 pb-3'>
                    <div className='mt-5'><h3 className='text-white font-bold'>TLP Staking</h3></div>
                    <div className='d-flex mt-3 flex-wrap'>
                        <div className={`market-form window ${isMobile == true ? `p-3`:`w-50 p-5`}`}>
                            <h4 className='mt-4'>Stake TLP</h4>  
                    
                            <div className='trade-token-select mb-2 p-4 mt-5'>
                                <div className='d-flex justify-content-between'>
                                    <h5 className='font-bold text-gray text-left fs-12'>TLP Balance</h5>
                                    <h5 className='text-gray text-left fs-12 font-bold'>Max: {totalUserLP} TLP</h5>
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
                            <div className='trade-token-select mb-2 p-4 mt-3'>
                                <div className='d-flex justify-content-between'>
                                    <h5 className='font-bold fs-12 text-gray text-left'>Staking Lock Time</h5>
                                    <h5 className='font-bold fs-12 text-gray text-left'>Min: 50</h5>
                                </div>
                                <div className='d-flex justify-content-between'>
                                    <input type='text' className='token-select-input' placeholder='0.0' value={lockTime} onChange={(e) => handleChangeLock(e.target.value)} />
                                    <div className='d-flex cursor-pointer token-select'><h5>Second</h5></div>
                                </div>
                            </div>
                            {globalContext.account == null && connected == false && (
                                <div className='earn-button-grey w-100 text-center py-2 border-radius mb-3 mt-15' onClick={() => globalContext.setModalIsOpen(true)}>Connect Wallet</div>
                            )}
                            {globalContext.account != '' && connected != false && (
                                <div className='earn-button-grey w-100 text-center py-2 border-radius mb-3 mt-15' onClick={() => stakeTLPEvent()}>Stack TLP</div>
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
                                        <p className='text-gray py-2'>TRY Price</p>
                                        <p className='text-pink-sharp'>$ 0.782</p>
                                    </div>
                                    <div className='d-flex justify-content-between py-1'>
                                        <p className='text-gray py-2'>Total staked</p>
                                        <p className='text-pink-sharp'>{stakingPoolStatus != undefined ? stakingPoolStatus.details.data.fields.balance_tlp : 0} TLP</p>
                                    </div>
                                    <div className='d-flex justify-content-between py-1'>
                                        <p className='text-gray py-2'>Total TLP value</p>
                                        <p className='text-pink-sharp'>{totalLPValue} TLP</p>
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
                                        <p>{totalUserLP} TLP</p>
                                    </div>
                                    <div className='d-flex justify-content-between py-1'>
                                        <p className='text-gray py-2'>Staked TLP</p>
                                        <p>{userStakingStatus != undefined ? userStakingStatus.data.fields.staking_amount : 0} TLP</p>
                                    </div>
                                    <div className='d-flex justify-content-between py-1'>
                                        <p className='text-gray py-2'>Claimable rewards</p>
                                        <p>{changeDecimal(userReward)} TRY</p>
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