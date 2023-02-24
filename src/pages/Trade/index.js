
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
import { getTokenPrice } from '../../control/main';
import { CONFIG } from '../../lib/config';

const Trade = (props) => {
    const globalContext = useContext(StoreContext);     
    const [market, setMarket] = useState('SUI');
    const [tokenPrice, setTokenPrice] = useState([]);  

    const selectMarket = (market) => {
        setMarket(market);
        console.log(market);
        globalContext.setIsAlterSecondToken(market);
    }

    useEffect(() => {
        console.log(globalContext.marketTokenPrice);
    }, [globalContext.marketTokenPrice])

    return (
        <div className='container pt-5 text-center'>
            <div className='d-flex justify-content-between flex-wrap pb-2'>
                <div className='t-w-1'>
                    <div className='trade-header d-flex justify-content-between'>
                        <div className='d-flex'>
                            <h4 className='text-white m-auto cursor-pointer token-title'>{globalContext.marketToken}/USD</h4>
                            {/* <FaAngleDown className='m-auto fs-28 text-white' /> */}
                        </div>
                        {globalContext.marketTokenPrice != undefined && (
                            <div className='trade-result d-flex flex-wrap justify-content-between'>
                                <div>
                                    <p className='text-gray'>{globalContext.marketTokenPrice.value}</p>
                                    <h6 className='text-white'>${globalContext.marketTokenPrice.value}</h6>
                                </div>
                                <div>
                                    <p className='text-gray'>24h Change</p>
                                    <h6 className={globalContext.marketTokenPrice.isEarn == 1 ? 'text-green': 'text-red-value'}>{globalContext.marketTokenPrice.isEarn == 1 ? '+': '-'} {globalContext.marketTokenPrice.changeValue}%</h6>
                                </div>
                                <div>
                                    <p className='text-gray'>24h High</p>
                                    <h6 className='text-white'>${globalContext.marketTokenPrice.highValue}</h6>
                                </div>
                                <div>
                                    <p className='text-gray'>24h Low</p>
                                    <h6 className='text-white'>${globalContext.marketTokenPrice.lowValue}</h6>
                                </div>
                            </div>
                        )}
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

