import React, { useState, useEffect, useContext } from 'react';
import './index.css';
import { StoreContext } from '../../store';
import TLP from '../../img/png/token-logo.png';

import { FaAngleDown } from 'react-icons/fa';
import { useMediaQuery } from 'react-responsive';
import { useWallet } from '@mysten/wallet-adapter-react';

const Earn = (props) => {
    const isMobile = useMediaQuery({ query: '(max-width: 480px)' });
    const globalContext = useContext(StoreContext);   
    const { account, connected, connecting, connects, disconnect } = useWallet();

    useEffect(() => {
        console.log(globalContext.account);
    }, [])

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
                                    <p className='text-gray text-left'>TLP Balance</p>
                                    <p className='text-gray text-left'>Max: 0.00</p>
                                </div>
                                <div className='d-flex justify-content-between'>
                                    <input type='text' className='token-select-input' placeholder='0.0' />
                                    <div className='d-flex cursor-pointer token-select'><h5>TLP</h5><FaAngleDown className='fs-26' /></div>
                                </div>
                                <div className='d-flex justify-content-between py-3'>
                                    <div className='percent-item'><p>25%</p></div>
                                    <div className='percent-item'><p>50%</p></div>
                                    <div className='percent-item'><p>75%</p></div>
                                    <div className='percent-item'><p>100%</p></div>
                                </div>
                            </div>
                            {globalContext.account == null && connected == false && (
                                <div className='earn-button w-100 text-center py-2 border-radius mb-3 mt-15' onClick={() => globalContext.setModalIsOpen(true)}>Connect Wallet</div>
                            )}
                            {globalContext.account != '' && connected != false && (
                                <div className='earn-button w-100 text-center py-2 border-radius mb-3 mt-15'>Stack TLP</div>
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
                                        <h4 className='py-2'>36.79%</h4>
                                    </div>
                                    <div className='d-flex justify-content-between'>
                                        <p className='text-gray py-2'>TRY Price</p>
                                        <p className='py-2 text-pink-sharp'>$ 0.782</p>
                                    </div>
                                    <div className='d-flex justify-content-between'>
                                        <p className='text-gray py-2'>Total staked</p>
                                        <p className='py-2 text-pink-sharp'>13,912,574 TLP</p>
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
                                        <p className='py-2'>0.00 TLP</p>
                                    </div>
                                    <div className='d-flex justify-content-between'>
                                        <p className='text-gray py-2'>You staked</p>
                                        <p className='py-2'>0.00 TLP</p>
                                    </div>
                                    <div className='d-flex justify-content-between'>
                                        <p className='text-gray py-2'>Claimable rewards</p>
                                        <p className='py-2'>0.00 TRY</p>
                                    </div>
                                    <div className='d-flex mt-3'>
                                        <div className='earn-button-grey w-100 text-center  py-2 border-radius mb-3 ml-2'>Claim rewards</div>
                                        <div className='earn-button-gray w-100 text-center  py-2 border-radius mb-3 ml-2'>Unstake TLP</div>
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