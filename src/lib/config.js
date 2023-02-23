
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

    tlp: '0xbc8e8a28382728711fe0187a5181d580b32dc199::pool::TLP',

    // mint, buy/sell, swap package
    tradeifyPackageId: '0xbc8e8a28382728711fe0187a5181d580b32dc199',
    poolRegistryId: '0xc1243bc2933cc53b073a3d184a74be635f6afae0',

    // staking package
    stakingPackageId: '0xbc8e8a28382728711fe0187a5181d580b32dc199',
    stakingPoolId: '0xfad02d6dc14d80188d9dfcce47fb36dc16de95cf',

    // referral package
    referralPackageId: '0xbc8e8a28382728711fe0187a5181d580b32dc199',
    referRegistryId: '0x6168775c657add5d670e6c2eb0b0b42c3b5b4df5',
    refTraderRegistryId: '0xe21b72efd7965000cb74c1faad8d54c9d28700f9',
    referralStaus: '0x6252d36c30c8ab0a8f0dadf020c45778040b80cb',

    // trading package
    tradingPoolID: '0x41c9d86500914cc1a4b60688e1e22aecc6d101f8',

    // Main default setting parameter
    MainDecimal: 9,
    defaultSlippagePct: 1,
    tradingFee: 1, // this is % value
    nullAddress: '0x0000000000000000000000000000000000000000',
    faucetDurationTime: 3600000, // 1 hour
    TLPPrice: 1,
    timeIntervalOfPrice: 3000,
}