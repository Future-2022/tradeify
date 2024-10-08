
import React, { useState, useEffect, useContext } from 'react';
import { StoreContext } from '../../store';

import './index.css';
import 'react-toastify/dist/ReactToastify.css';

import TokenIcon1 from '../../img/png/SUI.png';
import TokenIcon2 from '../../img/svg/BTC.svg';
import TokenIcon3 from '../../img/png/eth-bg.png';

import Swap from './swap';
import LongPosition from './LongPosition';
import ShortPosition from './ShortPosition';

const TradeForm = () => {      

    const [formIndex, setFormIndex] = useState(1);
    const [isTokenMenu, setIsTokenMenu] = useState(false);
    
    return (
        <div>
            <div className='trade-form'>
                <div className='left-bottom-bg'></div>
                <div className='trade-form-input d-flex justify-content-center'>
                    <div className={`${formIndex == 1 ? 'active' : ''}`}><p onClick={() => setFormIndex(1)}>Long</p></div>
                    <div className={`${formIndex == 2 ? 'active' : ''}`}><p onClick={() => setFormIndex(2)}>Short</p></div>
                    <div className={`${formIndex == 3 ? 'active' : ''}`}><p onClick={() => setFormIndex(3)}>Swap</p></div>
                </div>

                {/* Long position part */}
                {formIndex == 1 && (
                    <LongPosition formIndex={formIndex} />
                )}

                {/* Short position part */}
                {formIndex == 2 && (
                    <ShortPosition />
                )}

                {/* Token swap part */}
                {formIndex == 3 && (
                    <Swap setIsTokenMenu={setIsTokenMenu} />
                )}
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
                            <div className='d-flex token-item justify-content-between'>
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
                            <div className='d-flex token-item justify-content-between'>
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
                            <div className='d-flex token-item justify-content-between'>
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
export default TradeForm;
