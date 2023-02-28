
export const CONFIG = {       
    rpcUrl: 'https://fullnode.devnet.sui.io:443',
    // link: 'http://localhost:3000/',
    link: 'https://tradeify.app/',

    // tokenomics
    eth_id: '0x6ec5f7bf6e787f3234677f5cdbf5451e97fa0516',
    eth: '0x478c94fe09609eb56b842e3e4cdb7caa2b1b9125::eth::ETH',

    btc_id: '0x1ea2f6ea5252d932346e4a2e3ca0ecc02853cd6e',
    btc: '0x90c19ea0d39f2c2b907c8d381abbdf7c2eaf9f27::btc::BTC',

    usdt_id: '0x18eead5b2d54f85744abdd7a9285cb4da29f15e6',
    usdt: '0x77f8538820210e591637b50d66550d6dedae7409::usdt::USDT',

    try_id: '0x07b06a8ce0ffabf224db68d35bb297aec0d54fca',
    try: '0x3e6c269e2af8ef50e083e7e36d83952e6bb22eb1::try::TRY',  

    tlp: '0xfa0022d3b5e34a0d85e413f851ad848cf16a1d56::tlp::TLP',

    // mint, buy/sell, swap package
    tradeifyPackageId: '0xfa0022d3b5e34a0d85e413f851ad848cf16a1d56',
    poolRegistryId: '0x5c90a12c68993b0ca8ab3576e145f0388c85b646',
    TLPStorageId: '0xaf1bf42417929148ca44858d44bffdfb7ed04733',

    // staking package
    stakingPackageId: '0xfa0022d3b5e34a0d85e413f851ad848cf16a1d56',
    stakingPoolId: '0x857f96c40bee52b356d797193c206a45df4e5849',

    // referral package
    referralPackageId: '0xfa0022d3b5e34a0d85e413f851ad848cf16a1d56',
    referRegistryId: '0xd3d343d3db90a7d1c974f660bd2826448482d8ee',
    refTraderRegistryId: '0x2ba1f5bf2759e87bfb3d81d34aa0c9f42f0455f8',
    referralStaus: '0xe7c03c89ec603e1cbc29b8b79cbe2b087282244d',

    // trading package
    tradingPoolID: '0xaf0a7551ad81449ed28c7a19cca27d770520388f',

    nullAddress: '0x0000000000000000000000000000000000000000',

    eth_binance_api: 'https://api.binance.com/api/v3/ticker/24hr?symbol=ETHUSDT',
    bnb_binance_api: 'https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT',

    // Main default setting parameter
    MainDecimal: 9,
    defaultSlippagePct: 1,
    tradingFee: 1, // this is % value
    TLPPrice: 1,
    TRYPrice: 100,
    faucetDurationTime: 10 * 60 * 1000, // 1 hour
    timeIntervalOfPrice: 5000,    
    referCodeLength: 100000000000,
    TLPDecimal: 100000
}