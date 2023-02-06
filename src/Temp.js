import { useEffect, useContext } from 'react'
import { StoreContext } from './context/ConnectWallet/useSuiWallet'
export const Temp = () => {
    const { connects, adapter } = useContext(StoreContext)

    useEffect(() => {
        console.log('call connects function', adapter)

        const init = async () => {
            await connects('sui')
        }
        init()
    }, [])

    return <></>
} 