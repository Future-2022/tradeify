
import React, { useState, useEffect, useContext } from 'react';
import { useMediaQuery } from 'react-responsive';
import './index.css';
import 'react-toastify/dist/ReactToastify.css';
import { StoreContext } from '../../store';

const Order = () => {
    const [orderIndex, setOrderIndex] = useState(1);
    const isMobile = useMediaQuery({ query: '(max-width: 480px)' });
    const globalContext = useContext(StoreContext);    
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
                                <p>Market</p>
                                <p>Size</p>
                                <p>NET value</p>
                                <p>Collateral</p>
                                <p>Entry Price</p>
                                <p>Mark Price</p>
                                <p>Liq. Price</p>                                    
                                <p>PNL & ROE</p>                                    
                                <p>Actions</p>                                    
                            </div>
                        )}
                    <hr className='text-gray my-0'/>
                    
                    {/* <div className='order-content-value d-flex'> */}
                        {globalContext.traderData.map((item, key) => {
                            if(item.tradingStatus == 1) {
                                return <div className='order-content-value d-flex' key={key}>
                                    <div className='d-flex'>
                                        <span className='text-white fs-12 rs-badge-green'>{item.coinType}</span>
                                        <img src={item.MarketIcon} className='img-circle' width={35} height={35} />
                                        {/* <p>{item.type} {item.leverageValue} X</p> */}
                                    </div>
                                    <p>{item.tradingAmount} {item.coinType}</p>
                                    <p>{item.netPrice}</p>
                                    <p>{item.tradingAmount} {item.colletral}</p>
                                    <p>{item.entryPrice}</p>
                                    <p>Mark Price</p>
                                    <p>Liq. Price</p>                                    
                                    <p>PNL & ROE</p>                                    
                                    <div><div className='btn btn-primary-custom mt-1 mr-2'>Close</div></div>
                                </div>
                            }
                        })}                                  
                    {/* </div> */}
                </div>     
            )}      
            {orderIndex == 2 && (
                <div className='order-content'>
                    {!isMobile && (
                        <div className='order-content-top d-flex'>
                            <p>Time</p>
                            <p>Market & Side</p>
                            <p>Operation & Type</p>
                            <p>Price</p>
                            <p>Amount</p>
                            <p>Collateral</p>
                            <p>Actions</p>
                        </div>
                    )}                    
                    <hr className='text-gray my-0'/>
                    <div>
                        <p className='py-3 text-white'>No open Orders</p>
                    </div>
                </div>     
            )}      
            {orderIndex == 3 && (
                <div className='order-content'>
                    <div>
                        <p className='py-3 text-white'>No traders yet</p>
                    </div>
                </div>     
            )}      
        </div>
    )
}

export default Order;
