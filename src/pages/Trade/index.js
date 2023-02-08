
import React, { useState, useEffect, useContext } from 'react';
import './index.css';
import Order from '../../components/Order';

import { FaAngleDown } from 'react-icons/fa';
import TradingViewWidget, { Themes, IntervalTypes } from 'react-tradingview-widget';
import './style.css';
import './slider.less';
import TradeForm from '../../components/TradeForm';
import TokenIcon1 from '../../img/png/SUI.png';
import TokenIcon2 from '../../img/svg/BTC.svg';
import TokenIcon3 from '../../img/png/eth-bg.png';
import { StoreContext } from '../../store';

const Trade = (props) => {
    const globalContext = useContext(StoreContext);     
    const [market, setMarket] = useState('SUI');
    const [isMarketMenu, setIsMarketMenu] = useState(false);
    
    const selectMarket = (market) => {
        setMarket(market);
        console.log(market);
        globalContext.setIsAlterSecondToken(market);
        setIsMarketMenu(false);
    }
    return (
        <div className='container pt-5 text-center'>
            <div className='d-flex justify-content-between flex-wrap pb-2'>
                <div className='t-w-1'>
                    <div className='trade-header d-flex justify-content-between'>
                        <div className='d-flex'>
                            <h4 className='text-white m-auto cursor-pointer token-title' onClick={() => setIsMarketMenu(true)}>{market}/USD</h4>
                            <FaAngleDown className='m-auto fs-28 text-white' />
                        </div>
                        <div className='d-flex trade-result flex-wrap justify-content-between'>
                            <div>
                                <p className='text-gray'>1,322.26</p>
                                <h6 className='text-white'>$1,322.26</h6>
                            </div>
                            <div>
                                <p className='text-gray'>24h Change</p>
                                <h6 className='text-green'>+4.19%</h6>
                            </div>
                            <div>
                                <p className='text-gray'>24h high</p>
                                <h6 className='text-white'>$1,346.79</h6>
                            </div>
                            <div>
                                <p className='text-gray'>1,322.26</p>
                                <h6 className='text-white'>$1,322.26</h6>
                            </div>
                        </div>
                    </div>                    
                    <div className="chartview">
                        <TradingViewWidget
                            theme={Themes.DARK}
                            locale="fr"
                            autosize
                            symbol="BINANCE:ETHPERP"
                            interval={IntervalTypes.D}
                            timezone="Etc/UTC"
                            style="1"
                            local="in"
                            allow_symbol_change={true}
                            className="view-chart"
                        />
                    </div>
                    <Order />
                </div>
                <div className='t-w-2'>
                    <TradeForm />           
                </div>
            </div>
            {isMarketMenu && (
                <div>
                    <div className='mask-background'></div>
                    <div className='token-menu p-4'>
                        <div className='d-flex justify-content-between'>
                            <div className='d-flex py-2'><h5 className='text-white'>Select Market</h5></div>
                            <div className='text-white cursor-pointer' onClick={() => setIsMarketMenu(false)}><h3 className='text-white'>x</h3></div>
                        </div>
                        <hr className='text-white my-1' />
                        <input className='referral text-gray mt-2 w-100 border-radius-0' type='text' placeholder='Search Token'/>
                        <div className='pt-4'>
                            <div className='d-flex token-item justify-content-between' onClick={()=>selectMarket('SUI')}>
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
                            <div className='d-flex token-item justify-content-between' onClick={()=>selectMarket('ETH')}>
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
                            <div className='d-flex token-item justify-content-between' onClick={()=>selectMarket('BTC')}>
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

export default Trade;

