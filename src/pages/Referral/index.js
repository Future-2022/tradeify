
import React, { useState, useEffect, useContext, useRef } from 'react';
import './index.css';
import { useMediaQuery } from 'react-responsive';
import { useWallet } from '@mysten/wallet-adapter-react';
import { StoreContext } from '../../store';
import { createReferralCode, submitReferralCode } from '../../lib/tradeify-sdk/referral';
import { getReferralStatus, getTraderStatus, getReferralResult, isAvailaleReferralCode, getTradingResult } from '../../control/main';
import { FaClipboard } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import LoadingSpin from "react-loading-spin";

import { fetchLPCoins, getTokenPrice } from '../../control/main';
import { CONFIG } from '../../lib/config';
import { getObjectExistsResponse } from '@mysten/sui.js';

const Referral = (props) => {
    const { account, connected, connecting, connects, disconnect } = useWallet();
    const isMobile = useMediaQuery({ query: '(max-width: 480px)' });
    const inputArea = useRef(undefined);
    const [formIndex, setFormIndex] = useState(1);
    const globalContext = useContext(StoreContext); 
    const [referralCodeValue, setReferralCodeValue] = useState("");
    // referal part parameter
    const [referralCode, setReferralCode] = useState(undefined);
    const [traderNum, setTraderNum] = useState(undefined);
    const [referralLink, setReferralLink] = useState(undefined);

    const [referTradingVolume, setReferTradingVolume] = useState(undefined);
    const [referTradingRebate, setReferTradingRebate] = useState(undefined);
    
    const [traderTradingVolume, setTraderTradingVolume] = useState(undefined);
    const [traderTradingRebate, setTraderTradingRebate] = useState(undefined);

    // trader part parameter
    const [traderReferralCode, setTraderReferralCode] = useState(undefined);
    const [lpCoin, SetLPCoin] = useState([]);
    const [tokenPrice, setTokenPrice] = useState([]);  

    const [statusIndex1, setStatusIndex1] = useState([]);   
    const [statusIndex2, setStatusIndex2] = useState([]);  

    const [isAvailable, setIsAvailable] = useState(false);   

    useEffect(() => {
        fetchLPCoins(globalContext.provider, globalContext.wallet).then(async (lpCoins) => {
            SetLPCoin(lpCoins);
        })
    }, [])

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
        const code = new URLSearchParams(location.search).get('ref')
        setReferralCodeValue(code);
        handleChangeReferralCode(code);
    }, [])

    useEffect(() => {        
        getReferralStatus(globalContext.provider, localStorage.getItem('walletAddress')).then(item => {
            setReferralCode(item.referralCode);
            setTraderNum(item.traderNum);
            setReferralLink(item.referralLink);
        })
        getTraderStatus(globalContext.provider, localStorage.getItem('walletAddress')).then(item => {
            setTraderReferralCode(item.referralCode);
        })
        getReferralResult(globalContext.provider, localStorage.getItem('walletAddress'), lpCoin, tokenPrice).then(item => {
            setReferTradingVolume(item.tradingAmount);
            setReferTradingRebate(item.rebate);
        })
        getTradingResult(globalContext.provider, localStorage.getItem('walletAddress'), lpCoin, tokenPrice).then(item => {
            setTraderTradingVolume(item.tradingAmount);
            setTraderTradingRebate(item.rebate);
        })
    }, [lpCoin, traderReferralCode])
    
    const selectFormIndex = (value) => {
        setFormIndex(value);
    }
    const create_refer_code = () => {
        createReferralCode(globalContext.provider, globalContext.wallet, {
            referralCode: referralCodeValue
        }).then(args => {
            console.log(args);
            toast.info(`Your referral code ${referralCodeValue} has been created`);
            setTraderReferralCode(0);
        }).catch(err => {
            console.log(err);
        })
    }

    const submit_refer_code = () => {
        try {            
            submitReferralCode(globalContext.provider, globalContext.wallet, {
                referralCode: referralCodeValue
            }).then(args => {
                if (args.effects.status.status == "failure") {
                    toast.error(`This referral code ${referralCodeValue} is not exist. You can set other referral code`);
                } else {
                    toast.info(`You have set referral code ${referralCodeValue}`);
                }
                setTraderReferralCode(0);
            }).catch(err => {
                console.log(err);
            })
        } catch (e) {
            console.log(e);
        }
    }

    function updateClipboard(newClip) {
        navigator.clipboard.writeText(newClip).then(
            () => { toast.info("Copied successfully!") },
            () => { toast.error("Copied failed!");
        });
    }
      
    function copyReferralLink () {
        navigator.permissions
        .query({ name: "clipboard-write" })
        .then((result) => {
            if (result.state === "granted" || result.state === "prompt") {
                updateClipboard(inputArea.current?.innerText);
            }
        });
    }
    const handleChangeReferralCode = async (value) => {
        let isAvailable = await isAvailaleReferralCode(globalContext.provider, value);
        setIsAvailable(isAvailable);
        setReferralCodeValue(value);
    }

    useEffect(() => {
        checkSwapStatus();
    }, [globalContext.account, referralCodeValue, isAvailable])

    const checkSwapStatus = () => {
        if(globalContext.account == null && connected == false) {
            setStatusIndex1(0);
        } else if (referralCodeValue == "" || referralCodeValue == null) {
            setStatusIndex1(1);
        } else if (isAvailable == false) {
            setStatusIndex1(2);
        } else if (referralCodeValue != "" ) {
            setStatusIndex1(3);
        } 

        if(globalContext.account == null && connected == false) {
            setStatusIndex2(0);
        } else if (referralCodeValue == "" || referralCodeValue == null) {
            setStatusIndex2(1);
        } else if (referralCodeValue != "" ) {
            setStatusIndex2(2);
        } 
    }

    return (
        <div className={`d-flex ${isMobile == true ? `py-2 px-3`:`py-5 px-5`}`}>
            <div className='text-center container'>
                <div className='mt-0'><h3 className='text-white font-bold'>Referrals</h3></div>
                <div className='referral-form'>                                     
                    <div>
                        <p className='text-gray'>Get fee discounts and earn rebates through the Tradeify referral program{!isMobile && (<br />)}For more information, please read the 
                            <span className='text-decoration-underline'> referral program details.</span>
                        </p>
                    </div>
                    <div className='referral-form-input d-flex justify-content-between p-1'>
                        <div className={`w-50 ${formIndex == 1 ? 'active' : ''}`}><p onClick={() => selectFormIndex(1)}>Traders</p></div>
                        <div className={`w-50 ${formIndex == 2 ? 'active' : ''}`}><p onClick={() => selectFormIndex(2)}>Affiliate</p></div>
                    </div>

                    {formIndex == 1 && (
                        <>
                        {traderReferralCode == undefined && (
                            <div className='input-referral'>
                                <div className='left-bottom-bg'></div>  
                                <h4 className='text-white pt-1'>Enter Referral Code</h4>
                                <p className='text-gray'>Please input a referral code to benefit from fee discounts.<br /> You can input valid code on this tradefiy platform.</p>
                                <input className='referral text-white mt-5' type='text' placeholder='Enter referral code' value={referralCodeValue} onChange={(e) => handleChangeReferralCode(e.target.value)} />
                                {statusIndex1 == 0 && (
                                    <div className='referral-button' onClick={() => globalContext.setModalIsOpen(true)}>Connect wallet</div>
                                )}
                                {statusIndex1 == 1 && (
                                    <div className='referral-button btn-disabled'>Enter referral code</div>
                                )}                                
                                {statusIndex1 == 2 && (
                                    <div className='referral-button btn-disabled'>Unavailable referral code</div>
                                )}                                
                                {statusIndex1 == 3 && (
                                    <div className='referral-button' onClick={submit_refer_code}>Set referral code</div>
                                )}                                
                            </div>
                        )}
                        {traderReferralCode != undefined && (
                            <div className='w-100'>
                                <div className='mt-5 trader-referral-part referral-part flex-wrap d-flex justify-content-center mt-3 p-5'>                                     
                                    <div>
                                        <p>Total trading volume</p>
                                        <h5>${traderTradingVolume}</h5>
                                    </div>
                                    <div>
                                        <p>Total rebates</p>
                                        <h5>${traderTradingRebate}</h5>
                                    </div>
                                    <div>
                                        <p>Active referral code</p>
                                        <h5>{traderReferralCode}</h5>
                                    </div>
                                </div>
                            </div>
                        )}
                        </>                            
                    )}

                    {formIndex == 2  && (
                        <>
                            {referralCode == undefined && (
                                <div className='input-referral'>
                                    <div className='left-bottom-bg'></div> 
                                    <h4 className='text-white pt-1'>Generate Referral Code</h4>
                                    <p className='text-gray'>Looks like you don't have a referral code to share.<br/>Create one now and start earning rebates!</p>
                                    <input className='referral text-white mt-5' type='text' placeholder='Enter code'  value={referralCodeValue} onChange={(e) => setReferralCodeValue(e.target.value)} />
                                    
                                    {statusIndex2 == 0 && (
                                        <div className='referral-button' onClick={() => globalContext.setModalIsOpen(true)}>Connect wallet</div>
                                    )}
                                    {statusIndex1 == 1 && (
                                        <div className='referral-button btn-disabled'>Enter referral code</div>
                                    )}
                                    {statusIndex2 == 2 && (
                                        <div className='referral-button' onClick={create_refer_code}>Generate a referral code</div>
                                    )}                                    
                                </div>
                            )}
                            {referralCode != undefined && (
                                <div className='w-100 trader-referral-part mt-4'>
                                    <div className='flex-wrap referral-part d-flex justify-content-center p-4'>
                                        <div>
                                            <p>Total traders referred</p>
                                            <h5>{traderNum}</h5>
                                        </div>
                                        <div>
                                            <p>Total trading volume</p>
                                            <h5>${referTradingVolume}</h5>
                                        </div>
                                        <div>
                                            <p>Total rebates</p>
                                            <h5>${referTradingRebate}</h5>
                                        </div>
                                    </div>

                                    <div className='mt-5 pb-4'>
                                        <div className='w-50 m-auto d-flex referral-code-part justify-content-between'>
                                            <div className='text-center w-25'>
                                                <p className='text-gray text-center'>Referral Code</p>
                                                <h6 className='text-white text-center pt-2'>{referralCode}</h6>
                                            </div>
                                            <div className='text-center w-75'>
                                                <p className='text-gray text-center'>Referral link</p>
                                                <div className='d-flex justify-content-center pt-2'><h6 ref={inputArea} className='text-white text-center'>{referralLink}</h6><FaClipboard className='text-gray fs-24 ml-3 cursor-pointer clipboard' onClick={copyReferralLink}/></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Referral;

