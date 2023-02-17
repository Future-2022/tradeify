
import React, { useState, useEffect, useContext } from 'react';
import { useMediaQuery } from 'react-responsive';
import './index.css';
import 'react-toastify/dist/ReactToastify.css';
import { StoreContext } from '../../store';
import { closeOrderFun } from '../../lib/tradeify-sdk/trading';
import { ToastContainer, toast } from 'react-toastify';
const Order = () => {
    const [orderIndex, setOrderIndex] = useState(1);
    const isMobile = useMediaQuery({ query: '(max-width: 480px)' });
    const globalContext = useContext(StoreContext);  
    
    const closeOrder = (index, poolID, value, tokenA, tokenB, isDiff, isACS) => {
        closeOrderFun(globalContext.provider, globalContext.wallet, index, poolID, value, tokenA, tokenB, isDiff, isACS).then(item => {
            toast.info("Order has been closed successfully!");
        })
    }
    return (
        <div className='order py-2 mt-2'>
            <div className='order-header d-flex'>
                <h6 className={`${orderIndex == 1 ? 'active' : ''}`} onClick={() => setOrderIndex(1)}>Position</h6>
                <h6 className={`${orderIndex == 2 ? 'active' : ''}`} onClick={() => setOrderIndex(2)}>Open Orders</h6>
                <h6 className={`${orderIndex == 3 ? 'active' : ''}`} onClick={() => setOrderIndex(3)}>Trades</h6>
            </div> 
            {orderIndex == 1 && (
                <div className='order-content'>
                        {!isMobile && ( 
                            <div className='order-content-top d-flex'>
                                <h6>Market</h6>
                                <h6>Size</h6>
                                <h6>NET value</h6>
                                <h6>Collateral</h6>
                                <h6>Entry price</h6>
                                <h6>Mark price</h6>
                                <h6>Liq. price</h6>                                    
                                <h6>PNL & ROE</h6>                                    
                                <h6>Actions</h6>                                    
                            </div>
                        )}
                    <hr className='text-gray my-0'/>                    
                    {globalContext.traderData.map((item, key) => {
                        if(item.tradingStatus == 1) {
                            return <div className='order-content-value d-flex' key={key}>
                                <div className='d-flex'>
                                    <span className='text-white fs-12 rs-badge-green'>{item.coinType}</span>
                                    <img src={item.MarketIcon} className='img-circle' width={35} height={35} />
                                    <p><span className={item.type == "SHORT" ? 'PNL-red' : 'PNL-green'}>{item.type}</span><br/> <span className='fs-15'>{item.leverageValue}</span>X</p>
                                </div>
                                <p>{item.calcAmount} {item.coinType}</p>
                                <p>{item.netValue}</p>
                                <div className='d-flex'>
                                    <p>{item.tradingAmount} {item.colletral}</p>
                                    <img src={item.colletralIcon} className='img-circle-small mt-1' width={25} height={25} />
                                </div>
                                <p>${item.entryPrice}</p>
                                <p>${item.markPrice}</p>
                                <p>${item.markPrice}</p>                                    
                                <p className={item.earnType == "-" ? 'PNL-red' : 'PNL-green'}>{item.earnType} ${item.earnAmount}</p>                                    
                                {item.netValue < 0 ? (<div className='text-gray-closed mt-2'>Position lost!</div>):(
                                    <div><div className='btn btn-primary-custom mt-1 mr-2' onClick={() => closeOrder(item.createdTimeStamp, item.poolID, item.netValue, item.tokenA, item.tokenB, item.isDiff, item.isACS)}>Close</div></div>
                                )}
                            </div>
                        }
                    })}           
                </div>     
            )}      
            {orderIndex == 2 && (
                <div className='order-content'>
                    {!isMobile && (
                        <div className='order-content-top d-flex'>
                            <h6>Time</h6>
                            <h6>Market & Side</h6>
                            <h6>Operation & Type</h6>
                            <h6>Price</h6>
                            <h6>Amount</h6>
                            <h6>Collateral</h6>
                            <h6>Actions</h6>
                        </div>
                    )}                    
                    <hr className='text-gray my-0' />
                    <div>
                        <p className='py-3 text-white'>No open Orders</p>
                    </div>
                </div>     
            )}      
            {orderIndex == 3 && (
                <div className='order-content pt-3'> 
                    <div className='text-gray-light'>Trading History</div>
                    <hr className='text-gray'/>                   
                    {globalContext.traderData.map((item, key) => {
                        if(item.tradingStatus == 2) {
                            return <div className='order-content-value d-flex' key={key}>
                                <div className='d-flex'>
                                    <span className='text-white fs-12 rs-badge-green'>{item.coinType}</span>
                                    <img src={item.MarketIcon} className='img-circle' width={35} height={35} />
                                    <p><span className={item.type == "SHORT" ? 'PNL-red' : 'PNL-green'}>{item.type}</span><br/> <span className='fs-15'>{item.leverageValue}</span>X</p>
                                </div>
                                <p>{item.calcAmount} {item.coinType}</p>
                                <p>{item.netValue}</p>
                                <div className='d-flex'>
                                    <p>{item.tradingAmount} {item.colletral}</p>
                                    <img src={item.colletralIcon} className='img-circle-small mt-1' width={25} height={25} />
                                </div>
                                <p>${item.entryPrice}</p>
                                <p>${item.markPrice}</p>
                                <p>${item.markPrice}</p>                                    
                                <p className={item.earnType == "-" ? 'PNL-red' : 'PNL-green'}>{item.earnType} ${item.earnAmount}</p>                                    
                                <div><div className='mt-1 mr-2 text-gray'>Closed</div></div>
                            </div>
                        }
                    })}
                </div>     
            )}      
        </div>
    )
}

export default Order;
