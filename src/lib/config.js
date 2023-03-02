
export const CONFIG = {       
    rpcUrl: 'https://fullnode.devnet.vincagame.com:443/',
    // link: 'http://localhost:3000/',
    link: 'https://tradeify.app/',

    // tokenomics
    eth_id: '0x6ec5f7bf6e787f3234677f5cdbf5451e97fa0516',
    eth: '0x478c94fe09609eb56b842e3e4cdb7caa2b1b9125::eth::ETH',

    btc_id: '0x1ea2f6ea5252d932346e4a2e3ca0ecc02853cd6e',
    btc: '0x90c19ea0d39f2c2b907c8d381abbdf7c2eaf9f27::btc::BTC',

    try_id: '0x94515184d72fbeeeab1af589c1bf1cf9b31cea05',
    try: '0xa52c5c75c955cf07ee407cb0f4806e25ef675646::try::TRY',  

    tlp: '0xc011f01591113a8d42ed9496c1a4d29001cc2079::tlp::TLP',

    // mint, buy/sell, swap package
    tradeifyPackageId: '0xc011f01591113a8d42ed9496c1a4d29001cc2079',
    poolRegistryId: '0x20bb67f7b91068c0b0995a8b0fed2433e58ef05d',
    TLPStorageId: '0xbbff4d3579464ce9394131ff8b98e67023e2aad0',

    // staking package
    stakingPackageId: '0xc011f01591113a8d42ed9496c1a4d29001cc2079',
    stakingPoolId: '0x435caf30d9fa62cd1610854035a27bf7d334df97',

    // referral package
    referralPackageId: '0xc011f01591113a8d42ed9496c1a4d29001cc2079',
    referRegistryId: '0xb8084bdc18b3f5f09bc0921643b9446cc144a13e',
    refTraderRegistryId: '0x87c796f69772cac1b95825a0424f79100f1359b1',
    referralStaus: '0x368d305922804381d8792b5504992748778598fd',

    // trading package
    tradingPoolID: '0xf79a7e385989b96c92534079db51327d5af28a93',

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
    timeIntervalOfPrice: 2000,    
    timeIntervalOfReward: 1000,    
    referCodeLength: 100000000000,
    TLPDecimal: 100000
}