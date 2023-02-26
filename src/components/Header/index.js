
import React, { useState, useEffect, useContext } from 'react';
import { Coin, JsonRpcProvider } from '@mysten/sui.js'
import { useNavigate, useLocation } from 'react-router-dom';
import { useWallet } from '@mysten/wallet-adapter-react';
import Modal from 'react-modal';
import './index.css';
import Logo from '../../img/png/brand-logo.png';
import WalletIcon from '../../img/png/wallet.png';

import { useMediaQuery } from 'react-responsive';
import { FaList, FaCaretDown } from 'react-icons/fa';
import { StoreContext } from '../../store';
import { ExportAddress, getUserCoins, getUniqueCoinTypes, getCoinBalances, getCoinSymbols } from '../../control/main';
import { isLoggedIn } from '../../control/main';
import { mint_test_token_fun } from '../../lib/tradeify-sdk/pool';
import {CONFIG} from '../../lib/config';
import { ToastContainer, toast } from 'react-toastify';
import TokenIcon1 from '../../img/png/SUI.png';
import TokenIcon2 from '../../img/png/eth-bg.png';
import TokenIcon3 from '../../img/svg/BTC.svg';

import {NotificationContainer, NotificationManager} from 'react-notifications';

const customStyles = {
    content: {
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-50%',
        width: '300px',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'rgb(30 27 49)',
        padding: '10px 20px',
        borderRadius: '9px',
        border: 'none'
    },
    overlay: {
      backgroundColor: 'rgb(0 0 0 / 86%)'
    }
};

const Header = () => {
    const { wallets, wallet, select, connected, disconnect } = useWallet();
    const nagivate = useNavigate();    
    const location = useLocation();
    const globalContext = useContext(StoreContext);    
    const isTabletOrMobile = useMediaQuery({ query: '(max-width: 1224px)' });
    const [menuItem, setMenuItem] = useState(false);
    const [isMenu, setIsMenu] = useState(false);
    const [isEarnMenu, setIsEarnMenu] = useState(false);
    const [isFaucetMenu, setIsFaucetMenu] = useState(false);
    const [userCoins, setUserCoins] = useState([]);
    const [coinBalances, setCoinBalances] = useState([]);
    const [provider, setProvider] = useState({});

    const handleConnect = async (walletName) => {
        await select(walletName.toString());  
        closeModal();
    }
    
    const openFaucetMenu = () => {
        setIsFaucetMenu(true);
    }
    const showModal = () => {
        setIsMenu(true);
    }
    const goLink = (text) => {
        nagivate("/" + text);
        setMenuItem(text);
        setIsMenu(false);
        setIsEarnMenu(false);
    }
    const disconnectWallet = () => {
        disconnect();
        globalContext.setAccount(null);
        localStorage.removeItem('walletAddress');
        window.location.reload(false);
    }
    const connectWallet = () => {
        globalContext.setModalIsOpen(true);
    }
    const openEarnMenu = () => {
        setIsEarnMenu(true);
    }
    const closeModal = () => {
        globalContext.setModalIsOpen(false);
    }
    useEffect(() => {
        getItems();
    }, [menuItem, connected])

    const getItems = async () => {
        
        if(connected == false) {
            await select(localStorage.getItem('preferredSuiWallet'))
        }

        if(connected == true) {
            const accounts = await wallet.getAccounts();
            localStorage.setItem('walletAddress', accounts[0]);
            await globalContext.setAccount(accounts[0]);
            await globalContext.setWallet(wallet);
            await getUserCoins(globalContext.provider, wallet).then(coins => {
                const newCoins = getUniqueCoinTypes(coins).map(arg => {
                    return { value: arg, label: Coin.getCoinSymbol(arg) }
                });
                const balance = getCoinBalances(coins);
                globalContext.setNewCoins(newCoins);
                globalContext.setCoinBalances(balance);
                setUserCoins(newCoins)
                setCoinBalances(balance)
            })
            .catch(console.error)
        }
        const path = location.pathname.split("/")[1];
        setMenuItem(path); 
    }
    const mint_token = async (tokenType) => {
        const isLog = isLoggedIn();
        if(isLog == false) {
            toast.error("Please connect wallet");
        } else {
            try {  
                await mint_test_token_fun(globalContext.provider, wallet, { 
                    tokenType: tokenType,
                    amount: 100000000n,
                }).then((args) => {
                    if(args[0] == false) {
                        toast.error(`You can faucet ${args[1]} minutes later!`);
                    } else {
                        toast.info("Token has been minted successfully!");
                    }
                })
            } catch (e) {
                console.error(e)
            }
        }
    }
    return (
        <div className='nav py-2'>
            <div className='container'>
                <div className='d-flex justify-content-between'>
                    <div className='d-flex'>
                        <div className='m-auto logo cursor-pointer d-flex' onClick={() => goLink('')}>
                            <img src={Logo} className='brand-logo align-self-center mt-1' width={35} />
                            {!isTabletOrMobile && (
                                <h3 className='text-white ml-2 mt-1 font-bold mr-3 logo-text'>TRADEIFY</h3>
                            )}
                        </div>
                        {!isTabletOrMobile && (
                            <div className='d-flex align-self-center mt-1'>
                                <div className='px-4' onClick={() => goLink('')}><p className={`cursor-pointer ${menuItem !== '' ? 'text-gray' : 'text-white'}`}>Dashbaord</p></div>
                                <div className='px-4' onClick={() => goLink('trade')}><p className={`cursor-pointer ${menuItem !== 'trade' ? 'text-gray' : 'text-white'}`}>Trade</p></div>
                                <div className='px-4' onClick={() => goLink('liquidity')}><p className={`cursor-pointer ${menuItem !== 'liquidity' ? 'text-gray' : 'text-white'}`}>Liquidity</p></div>
                                
                                <div className='px-4 position-relative' onMouseEnter={openEarnMenu}>
                                    <p className={`cursor-pointer ${menuItem !== 'earn' ? 'text-gray' : 'text-white'}`}>Earn</p>                                    
                                    {isEarnMenu && (
                                        <div className='stake-menu' onMouseLeave={() => setIsEarnMenu(false)}>
                                            <div className='py-2' onClick={() => goLink('earn')}>Stake TLP</div>
                                            <div className='py-2' onClick={() => goLink('earn/lockStake')}>Lock Stake</div>
                                        </div>
                                    )}
                                </div>

                                <div className='px-4' onClick={() => goLink('referral')}><p className={`cursor-pointer ${menuItem !== 'referral' ? 'text-gray' : 'text-white'}`}>Referral</p></div>
                            </div>
                        )}
                        {isTabletOrMobile && (
                            <div className='mt-2'>
                                <div className='d-flex mt-2'>
                                    <FaList className='text-white fs-24' onClick={showModal}/>
                                </div>
                                {isMenu && (
                                    <div className='nav-menu p-4'>
                                        <div className='d-flex justify-content-between'>
                                            <div className='logo d-flex py-2'><img src={Logo} /></div>
                                            <div className='text-white' onClick={() => setIsMenu(false)}><h3 className='text-white'>x</h3></div>
                                        </div>
                                        <hr className='text-white' />
                                        <div className={`pt-1 ${menuItem !== '' ? '' : 'menu-active'}`} onClick={() => goLink('')}><h4 className='text-white'>Dashboard</h4></div>
                                        <div className={`${menuItem !== 'trade' ? '' : 'menu-active'}`} onClick={() => goLink('trade')}><h4 className='text-white'>Trade</h4></div>
                                        <div className={`${menuItem !== 'liquidity' ? '' : 'menu-active'}`} onClick={() => goLink('liquidity')}><h4 className='text-white'>Liquidity</h4></div>
                                        <div className={`${menuItem !== 'earn' ? '' : 'menu-active'}`}>
                                            <h4 className='text-white'>Earn</h4>
                                            <div>
                                                <div className='py-2 pl-3 text-gray font-bold' onClick={() => goLink('earn')}>Stake TLP</div>
                                                <div className='py-2 pl-3 text-gray font-bold' onClick={() => goLink('earn/lockStake')}>Lock Stake</div>
                                            </div>
                                        </div>
                                        <div className={`${menuItem !== 'referral' ? '' : 'menu-active'}`} onClick={() => goLink('referral')}><h4 className='text-white'>Referral</h4></div>
                                    </div>
                                )}                                
                            </div>
                        )}
                    </div>  
                    <div className='d-flex p-relative'>
                        <div className='mr-3 claim-btn align-self-center mt-2 d-flex' onMouseEnter={openFaucetMenu}>
                            <div>Faucet</div><FaCaretDown className='ml-2 mt-1'/>
                        </div>
                                             
                        {isFaucetMenu == true && (
                            <div className='menu-faucet' onMouseLeave={() => setIsFaucetMenu(false)}>
                                <div className='d-flex justify-content-between'><a className='no-effect d-flex justify-content-between w-100' href='https://docs.sui.io/explore/wallet-browser#add-sui-tokens-to-your-sui-wallet' target="_blank" ><img src={TokenIcon1} className='faucet-icon'/>SUI</a></div>
                                <div className='d-flex justify-content-between' onClick={() => mint_token("eth")} ><img src={TokenIcon2} className='faucet-icon' />ETH</div>
                                <div className='d-flex justify-content-between' onClick={() => mint_token("btc")} ><img src={TokenIcon3} className='faucet-icon'/>BTC</div>
                            </div>
                        )}
                        {connected && wallet && localStorage.getItem('walletAddress') ?
                        (
                            <div className='button d-flex mt-2' onClick={disconnectWallet}><div className='align-self-center'><img src={WalletIcon} className='wallet' /></div><p className='mb-0 ml-1 lh-33 align-self-center'>{ExportAddress(localStorage.getItem('walletAddress'))}</p></div>
                        ):(
                            <div className='button d-flex mt-2' onClick={connectWallet}><div className='align-self-center'><img src={WalletIcon} className='wallet' /></div><p className='mb-0 ml-1 lh-33 align-self-center'>Connect Wallet</p></div>
                        )}
                    </div>  
                </div>
            </div>
            <Modal
              isOpen={globalContext.modalIsOpen}
              onRequestClose={closeModal}
              style={customStyles}
              ariaHideApp={false}
              contentLabel="Example Modal"
            >
              <div>
                <div className='d-flex justify-content-between'>
                  <h5 className='text-white my-auto'>Connect Wallet</h5>
                  <h4 className='text-white cursor-pointer' onClick={() => globalContext.setModalIsOpen(false)}>x</h4>
                </div>
                <div className='py-3'>
                  <p className='text-white'>
                    To continue working with the site, you need to connect a wallet and allow the site access to your account.
                  </p>
                </div>
                <div>
                    {wallets.map((item, index) => {
                        return <div className='d-flex wallet-item' key={index} onClick={() => { handleConnect(item.name) }}>                  
                            <img src={item.icon} width={35} />
                            <div className='ml-3 align-self-center'>
                                <h6 className='text-white text-left'>{item.name}</h6>
                            </div>
                        </div>
                    })}
                </div>
              </div>
              <div></div>
            </Modal> 
        </div>
    )
}

export default Header;
