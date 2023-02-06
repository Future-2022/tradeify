import React, { useState, useEffect, useContext } from 'react';
import './index.css';
import './style.css';

import {useNavigate} from 'react-router-dom';
import DonutChart from 'react-donut-chart';

import TokenIcon1 from '../../img/png/SUI.png';
import TokenIcon2 from '../../img/png/eth-bg.png';
import TokenIcon3 from '../../img/svg/BTC.svg';

import { fetchLPCoins, fetchAll, LPMetaData } from '../../control/main';
import { StoreContext } from '../../store';
import { useMediaQuery } from 'react-responsive';

const Liquidity = (props) => {

    const navigate = useNavigate();    
    const isMobile = useMediaQuery({ query: '(max-width: 480px)' });
    const globalContext = useContext(StoreContext);        
    const [lpCoin, SetLPCoin] = useState([]);      
    const [chartData, SetChartData] = useState(undefined);      
    let ChartData = {
        "meta": []
    }
    const goLink = (text) => {
        navigate("/" + text);
    }
    useEffect(() => {        
        fetchLPCoins(globalContext.provider, globalContext.wallet).then(async (lpCoins) => {
            let totalLPValue = 0;
            lpCoins.map(item => {
                totalLPValue += Number(item.data.lpSupply.value);
            })
            console.log(lpCoins);
            const newMetaData = LPMetaData(totalLPValue, lpCoins);
            console.log(newMetaData);
            newMetaData.meta.map(item => {
                const newItem = {
                    label: item.LPSymbol,
                    value: Number(item.LPPercentage.toFixed(2))
                }
                
                if (ChartData.meta.length < 3) 
                    ChartData = { "meta" : ChartData['meta'] ? [...ChartData['meta'], newItem] : [newItem] }
            });
            SetLPCoin(newMetaData);
            SetChartData(ChartData.meta);
        })
    }, []);

    return (
        <div className='pb-5'>
            <div className={`d-flex ${isMobile == true ? `px-3`:`px-5`}`}>
                <div className='w-15 align-self-center'>
                </div>
                <div className='stats pt-5 w-65'>
                    <div>
                        <div className='d-flex justify-content-between'>
                            <h4 className='text-white font-bold'>Liquidity Overview</h4>    
                        </div>
                    </div>
                    <div className='d-flex justify-content-between flex-wrap mx-2'>
                        <div className={`market-form window mt-3 w-49 ${isMobile == true ? `p-3`:`p-5`}`}>
                            <div>
                                <div className='d-flex'>
                                    <img src={TokenIcon1} width={35} className='img-circle' />
                                    <h4 className='ml-3 font-bold'>TLP</h4>
                                </div>
                                <div className='d-flex justify-content-between'>
                                    <p className='text-gray py-2 pt-4'>Stake APR</p>
                                    <h4 className='py-2 text-grey-sharp'>36.79% </h4>
                                </div>
                                <div className='d-flex justify-content-between'>
                                    <p className='text-gray py-2'>Price</p>
                                    <div className='py-2 text-grey-sharp'>$0.215</div>
                                </div>
                                <div className='d-flex justify-content-between'>
                                    <p className='text-gray py-2'>Total Supply</p>
                                    <div className='py-2 text-grey-sharp'>12,213,123 TLP</div>
                                </div>
                                <div className='d-flex justify-content-between'>
                                    <p className='text-gray py-2'>Total Staked</p>
                                    <div className='py-2 text-grey-sharp'>12,213,123 TLP</div>
                                </div>
                                <div className='d-flex justify-content-between'>
                                    <p className='text-gray py-2'>TLP pool Value</p>
                                    <div className='py-2 text-grey-sharp'>12,214,122</div>
                                </div>
                                <div className='d-flex justify-content-between'>
                                    <p className='text-gray py-2'>Protocol Owned</p>
                                    <div className='py-2 text-grey-sharp'>$0.782</div>
                                </div>
                                <div className='d-flex mt-3'>
                                    <div className='earn-button w-100 text-center py-2 border-radius mb-3 mr-2' onClick={() => goLink('market')}>Buy / Sell TLP</div>
                                    <div className='earn-button-grey w-100 text-center  py-2 border-radius mb-3 ml-2' onClick={() => goLink('earn')}>Stake TLP</div>
                                </div>
                            </div>                         
                        </div>
                        
                        <div className={`market-form window py-5 mt-3 w-49 ${isMobile == true ? `ml-0 px-2`:`ml-2 px-4`}`}>
                            <div>
                                <div className='d-flex'>
                                    <h4 className='font-bold'>Liquidity Pool</h4>
                                </div>
                                <div className='align-self-center donut px-0 pt-5'>
                                    <DonutChart
                                        className="dchart"
                                        width={isMobile == true ? 320: 380}
                                        height={isMobile == true ? 200: 250}
                                        innerRadius={0.8}
                                        selectedOffset={0}
                                        outerRadius={0.7}
                                        legend={true}
                                        clickToggle = {false}
                                        colors={["rgb(92, 211, 255)", "rgb(6, 114, 255)", "rgb(254, 142, 14)"]}
                                        data={chartData}
                                    />
                                </div>
                            </div>                         
                        </div>
                    </div>

                    <div className='pt-5'>
                        <div className='d-flex justify-content-between'>
                            <h4 className='text-white font-bold'>Liquidity Composition</h4>
                        </div>
                        <div className='pt-4'>
                            
                            <div className='d-flex pt-3 flex-wrap'>
                                {lpCoin.meta && lpCoin.meta.map((item, index) => (
                                    <div className={`${isMobile == true ? `w-100 mt-3`:`w-50 mt-3`}`} key={index}>
                                        <div className='composition mx-2'>
                                            <div className='d-flex'>
                                                <img src={item.LPFirstIcon} className='img-circle' />
                                                <img src={item.LPSecondIcon} className='img-circle ml-2' />
                                                <h4 className='font-bold ml-3 text-white'>{item.LPSymbol}</h4>
                                            </div>
                                            <div className='d-flex justify-content-between'>
                                                <p className='font-bold text-gray py-2'>Price</p>
                                                <h5 className='py-2 text-white'>$ {item.LPPrice}</h5>
                                            </div>
                                            <div className='d-flex justify-content-between'>
                                                <p className='font-bold text-gray py-2'>Total LPToken Supply</p>
                                                <h5 className='py-2 text-white'>{item.LPTokenValue} <span className='text-gray fs-12'>TLP</span></h5>
                                            </div>
                                            <div className='d-flex justify-content-between'>
                                                <p className='font-bold text-gray py-2'>Reverse</p>
                                                <h5 className='py-2 text-white'>{item.LPFirstTokenValue} <span className='text-gray fs-12'>{item.LPFirstTokenSymbol}</span> / {item.LPSecondTokenValue} <span className='text-gray fs-12'>{item.LPSecondTokenSymbol}</span></h5>
                                            </div>
                                            <div className='d-flex justify-content-between'>
                                                <p className='font-bold text-gray py-2'>Liquidity Pool Fee</p>
                                                <h5 className='py-2 text-white'>{item.LPFee} %</h5>
                                            </div>
                                        </div>
                                    </div>  
                                ))}                                                          
                            </div> 
                            {/* <div className='d-flex flex-wrap'>
                                <div className={`${isMobile == true ? `w-100`:`w-50`}`}>
                                    <div className='composition mr-2'>
                                        <div className='d-flex'>
                                            <img src={TokenIcon1} className='img-circle' />
                                            <h4 className='font-bold ml-3 text-white'>SUI</h4>
                                        </div>
                                        <div className='d-flex justify-content-between'>
                                            <p className='font-bold text-gray py-2'>Price</p>
                                            <h5 className='py-2 text-white'>$1,214.6</h5>
                                        </div>
                                        <div className='d-flex justify-content-between'>
                                            <p className='font-bold text-gray py-2'>Total Pooled</p>
                                            <h5 className='py-2 text-white'>$2,232,322</h5>
                                        </div>
                                        <div className='d-flex justify-content-between'>
                                            <p className='font-bold text-gray py-2'>Weight</p>
                                            <h5 className='py-2 text-white'>23.54% / 25.99%</h5>
                                        </div>
                                        <div className='d-flex justify-content-between'>
                                            <p className='font-bold text-gray py-2'>Margin Trading Utilization</p>
                                            <h5 className='py-2 text-white'>23.54%</h5>
                                        </div>
                                    </div>
                                </div>
                                <div className={`${isMobile == true ? `w-100`:`w-50`}`}>
                                    <div className={`composition ${isMobile == true ? `mt-3`:`ml-2`}`}>
                                        <div className='d-flex'>
                                            <img src={TokenIcon2} className='img-circle' />
                                            <h4 className='font-bold ml-3 text-white'>ETH</h4>
                                        </div>
                                        <div className='d-flex justify-content-between'>
                                            <p className='font-bold text-gray py-2'>Price</p>
                                            <h5 className='py-2 text-white'>$1,214.6</h5>
                                        </div>
                                        <div className='d-flex justify-content-between'>
                                            <p className='font-bold text-gray py-2'>Total Pooled</p>
                                            <h5 className='py-2 text-white'>$2,232,322</h5>
                                        </div>
                                        <div className='d-flex justify-content-between'>
                                            <p className='font-bold text-gray py-2'>Weight</p>
                                            <h5 className='py-2 text-white'>23.54% / 25.99%</h5>
                                        </div>
                                        <div className='d-flex justify-content-between'>
                                            <p className='font-bold text-gray py-2'>Margin Trading Utilization</p>
                                            <h5 className='py-2 text-white'>23.54%</h5>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className='d-flex pt-3'>
                                <div className={`${isMobile == true ? `w-100`:`w-50`}`}>
                                    <div className='composition mr-2'>
                                        <div className='d-flex'>
                                            <img src={TokenIcon3} className='img-circle' />
                                            <h4 className='font-bold ml-3 text-white'>BTC</h4>
                                        </div>
                                        <div className='d-flex justify-content-between'>
                                            <p className='font-bold text-gray py-2'>Price</p>
                                            <h5 className='py-2 text-white'>$1,214.6</h5>
                                        </div>
                                        <div className='d-flex justify-content-between'>
                                            <p className='font-bold text-gray py-2'>Total Pooled</p>
                                            <h5 className='py-2 text-white'>$2,232,322</h5>
                                        </div>
                                        <div className='d-flex justify-content-between'>
                                            <p className='font-bold text-gray py-2'>Weight</p>
                                            <h5 className='py-2 text-white'>23.54% / 25.99%</h5>
                                        </div>
                                        <div className='d-flex justify-content-between'>
                                            <p className='font-bold text-gray py-2'>Margin Trading Utilization</p>
                                            <h5 className='py-2 text-white'>23.54%</h5>
                                        </div>
                                    </div>
                                </div>                                
                            </div> */}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Liquidity;