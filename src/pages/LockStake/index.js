import React, { useState, useEffect } from 'react';

import './index.css';
import TLP from '../../img/png/token-logo.png';
import DateSelector from '../../img/png/date-selector.png';

import { FaAngleDown } from 'react-icons/fa';

import { useMediaQuery } from 'react-responsive';
const LockStake = (props) => {
    const isMobile = useMediaQuery({ query: '(max-width: 480px)' });

    return (
        <div>
            <div className={`d-flex ${isMobile == true ? `px-3`:`px-5`}`}>
                <div className='w-15 align-self-center'>
                </div>
                <div className='w-65 pb-3'>
                <div className='mt-5'><h3 className='text-white font-bold'>gTRY Locked-Staking</h3></div>
                    <div className='d-flex flex-wrap mt-3'>
                        <div className={`market-form window ${isMobile == true ? `p-3`:`p-5 w-50`}`}>
                            <div className='d-flex justify-content-between'>
                                <h4>Create Lock</h4>
                            </div>
                            <div className='trade-token-select mb-2 p-4 mt-5'>
                                <div className='d-flex justify-content-between'>
                                    <p className='text-gray text-left'>Lock Amount</p>
                                    <p className='text-gray text-left'>Max: 0.00</p>
                                </div>
                                <div className='d-flex justify-content-between'>
                                    <input type='text' className='token-select-input' placeholder='0.0' />
                                    <div className='d-flex cursor-pointer token-select'><h5>TRY</h5><FaAngleDown className='fs-26' /></div>
                                </div>
                                <div className='d-flex justify-content-between py-3'>
                                    <div className='percent-item'><p>25%</p></div>
                                    <div className='percent-item'><p>50%</p></div>
                                    <div className='percent-item'><p>75%</p></div>
                                    <div className='percent-item'><p>100%</p></div>
                                </div>
                            </div>
                            <div className='trade-token-select mt-3 p-4'>
                                <div className='d-flex justify-content-between'><p className='text-gray text-left'>Locked until</p></div>
                                <div className='d-flex justify-content-between'>
                                    <input type='text' className='token-select-input' placeholder='0.0' value='2023-05-12'/>    
                                    <img src={DateSelector} className='date-selector-icon' />                    
                                </div>
                            </div>
                            <div className='pt-3'>
                                <div className='d-flex justify-content-between pt-4'>
                                    <p className='text-gray py-2'>gTRY to receive</p>
                                    <p className='py-2'>0 gTRY</p>
                                </div>
                            </div>                  
                            <div className='board'>
                                <p className='text-gray-sharp'>The TRY will be locked out until the week of the selected date and cant be unlocked in advance.</p>
                            </div>       
                            <div className='earn-button w-100 text-center py-2 border-radius mb-3 mt-5'>Connect Wallet</div>
                        </div>
                        <div className={`${isMobile == true ? `w-100`:`w-50`}`}>
                            <div className={`market-form window ${isMobile == true ? `p-3 mt-3 ml-0`:`ml-3 p-5 `}`}>
                                <div className='pt-3'>
                                    <div className='d-flex'>
                                        <img src={TLP} className='mr-3 img-circle' width={35} /> <h4>gTRY</h4>
                                    </div>
                                    <div className='d-flex justify-content-between pt-3'>
                                        <p className='text-gray py-2 pt-3'>Stake APR</p>
                                        <h4 className='py-2'>36.79%</h4>
                                    </div>
                                    <div className='d-flex justify-content-between'>
                                        <p className='text-gray py-2'>Total supply</p>
                                        <p className='py-2 text-pink-sharp'>13,921,574 gTRY</p>
                                    </div>
                                    <div className='d-flex justify-content-between'>
                                        <p className='text-gray py-2'>Rate</p>
                                        <p className='py-2 text-pink-sharp'>23.54%</p>
                                    </div>
                                    <div className='board'>
                                        <p className='text-gray-sharp'><span className='text-white text-left'>Earn up to 35% rebate</span> by inviting traders to trade on TRY. Referral Program</p>
                                    </div>
                                </div>                         
                            </div>
                            <div className={`market-form window mt-3 ${isMobile == true ? `p-3 ml-0`:`p-5 ml-3`}`}>
                                <div className='pt-3'>
                                    <div className='d-flex'>
                                        <h4>Your Stats</h4>
                                    </div>
                                    <div className='d-flex justify-content-between'>
                                        <p className='text-gray py-2'>Balance</p>
                                        <p className='py-2'>0.00 gTRY  </p>
                                    </div>
                                    <div className='d-flex justify-content-between'>
                                        <p className='text-gray py-2'>You locked</p>
                                        <p className='py-2'>0.00 TRY</p>
                                    </div>
                                    <div className='d-flex justify-content-between'>
                                        <p className='text-gray py-2'>Lock Time</p>
                                        <p className='py-2'>0 days</p>
                                    </div>
                                    <div className='d-flex justify-content-between'>
                                        <p className='text-gray py-2'>Claimable Rewards</p>
                                        <p className='py-2'>$0.00</p>
                                    </div>
                                    <div className='d-flex mt-3'>
                                        <div className='earn-button w-100 text-center py-2 border-radius mb-3 mr-2'>Extend lock</div>
                                        <div className='earn-button-grey w-100 text-center  py-2 border-radius mb-3 ml-2'>Claim rewards</div>
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

export default LockStake;