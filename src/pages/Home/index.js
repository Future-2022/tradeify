import React, { useState, useEffect, useContext } from 'react';
import './index.css';

import { FaAngleDown } from 'react-icons/fa';
import { useMediaQuery } from 'react-responsive';

import TLP from '../../img/png/token-logo.png';
import { StoreContext } from '../../store';
import { CONFIG } from '../../lib/config';

import { getTotalTRYValue, getStakingPoolStatus, 
    fetchLPCoins, LPMetaData, getTokenPrice, changeDecimal, changeDecimal0Fix } from '../../control/main';

const Home = (props) => {

    const isMobile = useMediaQuery({ query: '(max-width: 480px)' });  
    const globalContext = useContext(StoreContext); 
    const [tokenPrice, setTokenPrice] = useState([]); 

    // TRY part
    const [totalTRYValue, setTotalTRYValue] = useState(false);

    // TLP part 
    const [totalLPValue, setTotalLPValue] = useState(0);
    const [stakingPoolStatus, setStakingPoolStatus] = useState(undefined);
    
    const [tryPrice, setTryPrice] = useState(1);   
    const [lpCoin, SetLPCoin] = useState(undefined);

    // Get Price part
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
        let totalSupplyTLP = 0;
        fetchLPCoins(globalContext.provider, globalContext.wallet).then(async (lpCoins) => {

            let totalLPValue = 0;
            lpCoins.map(item => {
                // if(item.metadata[0].symbol == "TRY") {
                //     let TRYPrice = Number(item.data.balanceA.value) / Number(item.data.balanceB.value);
                //     setTryPrice(TRYPrice);
                // }
                totalLPValue += Number(item.data.lpSupply);
            })

            const newMetaData = LPMetaData(tokenPrice, totalLPValue, lpCoins);
            SetLPCoin(newMetaData);
            setTotalLPValue(changeDecimal0Fix(totalLPValue));
        })
        getStakingPoolStatus(globalContext.provider).then(res => {
            setStakingPoolStatus(res);
            totalSupplyTLP = res.details.data.fields.balance_tlp;
        })
        getTotalTRYValue(globalContext.provider).then(res => {
            setTotalTRYValue(res);
        })
    }, [tokenPrice])

    return (
        <div className='pb-5'>
            <div className='container'>
                <div className='stats pt-5'>
                    <div className='px-3'>
                        <h4 className='text-white font-bold'>Stats</h4>
                    </div>
                    <div className='d-flex px-3 justify-content-between flex-wrap'>
                        <div className='overview mt-3 w-1'>
                            <div><h5 className='text-white px-4 pt-3'>Overview</h5></div>
                            <hr className='text-white mx-4'/>
                            <div className='overview-body pb-2'>
                                <div className='d-flex'>
                                    <div>
                                        <p>AUM</p>
                                        <h5 className='text-white'>$801,951,731</h5>
                                    </div>
                                    <div className='text-gray'> | </div>
                                    <div>
                                        <p>24h Volume</p>
                                        <h5 className='text-white'>$801,951,731</h5>
                                    </div>
                                </div>
                                <div className='d-flex'>
                                    <div>
                                        <p>TLP Pool</p>
                                        <h5 className='text-white'>$801,951,731</h5>
                                    </div>
                                    <div className='text-gray'> | </div>
                                    <div>
                                        <p>Short Position</p>
                                        <h5 className='text-white'>$801,951,731</h5>
                                    </div>
                                </div>
                                <div className='d-flex'>
                                    <div>
                                        <p>Fees</p>
                                        <h5 className='text-white'>$801,951,731</h5>
                                    </div>
                                    <div className='text-gray'> | </div>
                                    <div>
                                        <p>Long Position</p>
                                        <h5 className='text-white'>$801,951,731</h5>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className='overview mt-3 w-2'>
                            <div><h5 className='text-white px-4 pt-3'>Total stats</h5></div>
                            <hr className='text-white mx-4'/>
                            <div className='overview-body pb-2'>
                                <div className='d-flex'>
                                    <div>
                                        <p>Total Fees</p>
                                        <h5 className='text-white'>$801,951,731</h5>
                                    </div>
                                </div>
                                <div className='d-flex'>
                                    <div>
                                        <p>Total Volumes</p>
                                        <h5 className='text-white'>$801,951,731</h5>
                                    </div>
                                </div>
                                <div className='d-flex'>
                                    <div>
                                        <p>Floor Price Fund</p>
                                        <h5 className='text-white'>$801,951,731</h5>
                                    </div>  
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className='stats'>
                    <div className='px-3'>
                        <h4 className='text-white font-bold'>Tokens</h4>
                        <p>Platform and TLP index tokens.</p>
                    </div>
                    <div className='d-flex px-3 justify-content-between flex-wrap'>
                        <div className='overview mt-3 w-3'>
                            <div className='d-flex py-3 px-4'>
                                <img src={TLP} className='token-logo' />
                                <div className='px-2'>
                                    <h6 className='text-white mb-0'>TRY</h6>
                                    <p className='fs-12 text-gray'>Tradeify coin</p>
                                </div>
                                <div className='pt-1'>
                                    <FaAngleDown className='text-white' />
                                </div>
                            </div>
                            <hr className='text-white mx-4 m-0'/>
                            <div className='overview-body pb-2'>
                                <div className='d-flex justify-content-between flex-wrap'>
                                    <div className='w-80 pri-0 wmin-340'>
                                        <div className='d-flex justify-content-between py-2'>
                                            <h6 className='text-gray'>AUM</h6>
                                            <h6 className='text-white'>$ {tryPrice}</h6>
                                        </div>
                                        <div className='d-flex justify-content-between py-2'>
                                            <h6 className='text-gray'>Supply</h6>
                                            <h6 className='text-white'>{totalTRYValue} TRY</h6>
                                        </div>
                                        <div className='d-flex justify-content-between py-2'>
                                            <h6 className='text-gray'>Total Staked</h6>
                                            <h6 className='text-white'>$801,951,732</h6>
                                        </div>
                                        <div className='d-flex justify-content-between py-2'>
                                            <h6 className='text-gray'>Market Cap</h6>
                                            <h6 className='text-white'>$453,984,472</h6>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className='overview mt-3 w-3'>
                            <div className='d-flex py-3 px-4'>
                                <img src={TLP} width={35} className='token-logo' />
                                <div className='px-2'>
                                    <h6 className='text-white mb-0'>TLP</h6>
                                    <p className='fs-12 text-gray'>TLP</p>
                                </div>
                                <div className='pt-1'>
                                    <FaAngleDown className='text-white' />
                                </div>
                            </div>
                            <hr className='text-white mx-4 m-0'/>
                            <div className='overview-body pb-2'>
                                <div className='d-flex justify-content-between flex-wrap'>
                                    <div className='w-80 pri-0 wmin-340'>
                                        <div className='d-flex justify-content-between py-2'>
                                            <h6 className='text-gray'>AUM</h6>
                                            <h6 className='text-white'>$ 1</h6>
                                        </div>
                                        <div className='d-flex justify-content-between py-2'>
                                            <h6 className='text-gray'>Supply</h6>
                                            <h6 className='text-white'>{totalLPValue} TLP</h6>
                                        </div>
                                        <div className='d-flex justify-content-between py-2'>
                                            <h6 className='text-gray'>Total Staked</h6>
                                            <h6 className='text-white'>{stakingPoolStatus != undefined ? changeDecimal0Fix(stakingPoolStatus.details.data.fields.balance_tlp) : 0} TLP</h6>
                                        </div>
                                        <div className='d-flex justify-content-between py-2'>
                                            <h6 className='text-gray'>Market Cap</h6>
                                            <h6 className='text-white'>$453,984,472</h6>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className='px-3'>
                        <div className='overview mt-3 w-5 pb-4'>
                            <div className='d-flex py-3 px-4'>
                                <h5 className='text-white'>TLP Liquidity pool</h5>
                            </div>
                            <hr className='text-white mx-4 m-0'/>
                            <div className='overview-body pb-2 token-table'>
                                <div className='d-flex justify-content-between'>
                                    {!isMobile && (
                                        <div className='d-flex w-100'>
                                            <div className='w-20'><p className='text-gray'>Token</p></div>
                                            <div className='w-20'><p className='text-gray'>Price</p></div>
                                            <div className='w-20'><p className='text-gray'>Pool</p></div>
                                            <div className='w-20'><p className='text-gray'>Weight</p></div>
                                            <div className='w-20'><p className='text-gray'>Utilization</p></div>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <div className='w-100 py-2'>
                                        {!isMobile && lpCoin != undefined && lpCoin.meta.map((item, index) => {
                                            return <div>
                                                <div className='d-flex py-1'>
                                                    <div className='w-20 d-flex'>
                                                        <img className='img-circle' src={item.LPFirstIcon} width={40} height={20} />
                                                        <div className='pl-4'>
                                                            <h6 className='mb-0'>{item.LPSymbol}</h6>
                                                            <p className='text-gray text-left'>{item.TokenName}</p>
                                                        </div>
                                                    </div>
                                                    <div className='w-20'><h6 className='text-gray'>$ {item.LPPrice}</h6></div>
                                                    <div className='w-20'><h6 className='text-gray'>$ {item.totalPooledValue}</h6></div>
                                                    <div className='w-20'><h6 className='text-gray'>{item.LPWeight} % / {item.LPTargetWeight} %</h6></div>
                                                    <div className='w-20'><h6 className='text-gray'>{item.LPFee} %</h6></div>
                                                </div>
                                                <hr className='text-gray my-1'/>
                                            </div>
                                        })}
                                        {isMobile && lpCoin != undefined && lpCoin.meta.map((item, index) =>(
                                        <div>
                                            <div className='py-0'>
                                                <div className='w-100 d-flex pl-3 pb-2'>
                                                    <img src={item.LPFirstIcon} width={40} height={20} />
                                                    <div className='pl-4'>
                                                        <h6 className='mb-0'>{item.TokenName}</h6>
                                                        <p className='text-gray text-left'>{item.LPSymbol}</p>
                                                    </div>
                                                    <FaAngleDown className='text-white mt-1 ml-3 cursor-pointer'/>
                                                </div>
                                                <div className='d-flex justify-content-between'>
                                                    <div className='w-50'><p className='text-gray pl-3'>Price</p></div>
                                                    <div className='w-50'><h6 className='text-gray'>${item.LPPrice}</h6></div>
                                                </div>
                                                <div className='d-flex justify-content-between'>
                                                    <div className='w-50'><p className='text-gray pl-3'>Pool</p></div>
                                                    <div className='w-50'><h6 className='text-gray'>${item.totalPooledValue}</h6></div>
                                                </div>
                                                <div className='d-flex justify-content-between'>
                                                    <div className='w-50'><p className='text-gray pl-3'>Weight</p></div>
                                                    <div className='w-50'><h6 className='text-gray'>{item.LPWeight} % / {item.LPTargetWeight} %</h6></div>
                                                </div>
                                                <div className='d-flex justify-content-between'>
                                                    <div className='w-50'><p className='text-gray pl-3'>Utilization</p></div>
                                                    <div className='w-50'><h6 className='text-gray'>{item.LPFee} %</h6></div>
                                                </div>                                                
                                                <hr className='text-gray my-1'/>
                                            </div>
                                        </div>))}                                       
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

export default Home;