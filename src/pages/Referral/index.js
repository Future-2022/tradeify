
import React, { useState, useEffect, useContext, useRef } from 'react';
import './index.css';
import { useMediaQuery } from 'react-responsive';
import { useWallet } from '@mysten/wallet-adapter-react';
import { StoreContext } from '../../store';
import { createReferralCode, submitReferralCode } from '../../lib/tradeify-sdk/referral';
import { getReferralStatus, getTraderStatus, getReferralResult, getTradingResult } from '../../control/main';
import { FaClipboard } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import LoadingSpin from "react-loading-spin";

const Referral = (props) => {
    const { wallets, wallet, select, connected, disconnect } = useWallet();
    const isMobile = useMediaQuery({ query: '(max-width: 480px)' });
    const inputArea = useRef(undefined);
    const [formIndex, setFormIndex] = useState(1);
    const globalContext = useContext(StoreContext); 
    const [referralCodeValue, setReferralCodeValue] = useState(undefined);
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

    useEffect(() => {
        const code = new URLSearchParams(location.search).get('ref')
        setReferralCodeValue(code);
        getReferralStatus(globalContext.provider, localStorage.getItem('walletAddress')).then(item => {
            setReferralCode(item.referralCode);
            setTraderNum(item.traderNum);
            setReferralLink(item.referralLink);
        })
        getTraderStatus(globalContext.provider, localStorage.getItem('walletAddress')).then(item => {
            setTraderReferralCode(item.referralCode);
        })
        getReferralResult(globalContext.provider, localStorage.getItem('walletAddress')).then(item => {
            setReferTradingVolume(item.tradingAmount);
            setReferTradingRebate(item.rebate);
        })
        getTradingResult(globalContext.provider, localStorage.getItem('walletAddress')).then(item => {
            setTraderTradingVolume(item.tradingAmount);
            setTraderTradingRebate(item.rebate);
        })
    }, [])
    
    const selectFormIndex = (value) => {
        setFormIndex(value);
    }
    const create_refer_code = () => {
        console.log(referralCodeValue);
        createReferralCode(globalContext.provider, globalContext.wallet, {
            referralCode: referralCodeValue
        }).then(args => {
            toast.info(`Your referral code ${referralCodeValue} has been created`);
            setTraderReferralCode(0);
        }).catch(err => {
            console.log(err);
        })
    }

    const submit_refer_code = () => {
        submitReferralCode(globalContext.provider, globalContext.wallet, {
            referralCode: referralCodeValue
        }).then(args => {
            toast.info(`You have set referral code ${referralCodeValue}`);
            setTraderReferralCode(0);
        }).catch(err => {
            console.log(err);
        })
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
                        {/* {referralCodeValue == undefined && (
                            <div className='pt-5'>
                                <LoadingSpin
                                    duration="1s"
                                    width="5px"
                                    timingFunction="ease-in-out"
                                    direction="alternate"
                                    size="200px"
                                    primaryColor="#666"
                                    secondaryColor="#333"
                                    numberOfRotationsInAnimation={2}
                                />
                                <p className='text-gray'>Loading data...</p>
                            </div>
                        )} */}
                        {traderReferralCode == undefined && (
                            <div className='input-referral'>
                                <h4 className='text-white pt-1'>Enter Referral Code</h4>
                                <p className='text-gray'>Please input a referral code to benefit from fee discounts.<br /> You can input valid code on this tradefiy platform.</p>
                                <input className='referral text-white mt-5' type='text' placeholder='Enter referral code' value={referralCodeValue} onChange={(e) => setReferralCodeValue(e.target.value)} />
                                <div className='referral-button' onClick={submit_refer_code}>Enter referral code</div>
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
                                    <h4 className='text-white pt-1'>Generate Referral Code</h4>
                                    <p className='text-gray'>Looks like you don't have a referral code to share.<br/>Create one now and start earning rebates!</p>
                                    <input className='referral text-white mt-5' type='text' placeholder='Enter code'  value={referralCodeValue} onChange={(e) => setReferralCodeValue(e.target.value)} />
                                    <div className='referral-button' onClick={create_refer_code}>Enter a code</div>
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

