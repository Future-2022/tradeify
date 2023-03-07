
export const CONFIG = {       
    rpcUrl: 'https://fullnode.devnet.vincagame.com:443/',
    suiUrl: 'https://fullnode.devnet.sui.io:443/',
    // link: 'http://localhost:3000/',
    link: 'https://tradeify.app/',

    // tokenomics
    eth_id: '0xa5c4ae3ae54d2a3cbf04559dcbd7378a47ecda5f',
    eth: '0x95a1743959f4741e25f18b5733ac8a4e01668fce::eth::ETH',

    btc_id: '0xccf97f0533f800b527a2c180f2a68948f42eef42',
    btc: '0x2701b3eb89ffa3fec56fb2c25423ab9ee80027a9::btc::BTC',

    try_id: '0xe8ed7e4bcbf1fe80805012c05d8411e1c09bbbdb',
    try: '0x6c4b0af2d133f6fcf669665a81f7dc12e754bee6::try::TRY',  

    tlp: '0x373993f80bf4090eb69358c817acf7b0d66b8cb2::tlp::TLP',

    // mint, buy/sell, swap package
    tradeifyPackageId: '0x373993f80bf4090eb69358c817acf7b0d66b8cb2',
    poolRegistryId: '0x5522177f3390c8725fcd4fa76a6ef30e52c45f1c',
    TLPStorageId: '0xf55053bd32baea13b9e934ec0d428e2a8655e377',

    // staking package
    stakingPackageId: '0x373993f80bf4090eb69358c817acf7b0d66b8cb2',
    stakingPoolId: '0x3a16602a82af57985f03ef1a48be39dd9714957d',

    // referral package
    referralPackageId: '0x373993f80bf4090eb69358c817acf7b0d66b8cb2',
    referRegistryId: '0x8dc58c4241c0aac07ddc11dc8a1c108de449fdde',
    refTraderRegistryId: '0x2bb76dfdac92d4b1ca81038523a24463c0d69e27',
    referralStaus: '0xdbf1f531d7ed73bacc7403a3f8641c78969583b0',

    // trading package
    tradingPoolID: '0x4d2885d2fac9807ac66517ea30d3a1bf362a1027',

    nullAddress: '0x0000000000000000000000000000000000000000',

    eth_binance_api: 'https://api.binance.com/api/v3/ticker/24hr?symbol=ETHUSDT',
    bnb_binance_api: 'https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT',

    // Main default setting parameter
    MainDecimal: 9,
    defaultSlippagePct: 1,
    tradingFee: 1, // this is % value
    TLPPrice: 1, // this is % value
    TRYPrice: 1,
    faucetDurationTime: 10 * 60 * 1000, // 1 hour
    timeIntervalOfPrice: 300,    
    timeIntervalOfReward: 300,    
    referCodeLength: 100000000000,
    TLPDecimal: 100000
}