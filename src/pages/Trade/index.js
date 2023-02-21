
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
    
    const selectMarket = (market) => {
        setMarket(market);
        console.log(market);
        globalContext.setIsAlterSecondToken(market);
    }
    return (
        <div className='container pt-5 text-center'>
            <div className='d-flex justify-content-between flex-wrap pb-2'>
                <div className='t-w-1'>
                    <div className='trade-header d-flex justify-content-between'>
                        <div className='d-flex'>
                            <h4 className='text-white m-auto cursor-pointer token-title'>{globalContext.marketToken}/USD</h4>
                            {/* <FaAngleDown className='m-auto fs-28 text-white' /> */}
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
                            symbol={`BINANCE:${globalContext.marketToken}PERP`}
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
        </div>
    )
}

export default Trade;

