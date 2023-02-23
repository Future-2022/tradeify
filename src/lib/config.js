
export const CONFIG = {  
     
    rpcUrl: 'https://fullnode.devnet.sui.io:443',

    // link: 'http://localhost:3000/',
    link: 'https://tradeify.app/',

    // tokenomics
    eth_id: '0x758ed07067036c9009ff6eb4716b7ac829aa03af',
    eth: '0x4ea1d38441d4141f6dfd36664a430ead24dccfaa::eth::ETH',

    btc_id: '0x1549c9c09606f56d636c57b3e91aa7d8998f4b58',
    btc: '0x2624c579d1039052414b687c03b26f1581394b9e::btc::BTC',

    usdt_id: '0x18eead5b2d54f85744abdd7a9285cb4da29f15e6',
    usdt: '0x77f8538820210e591637b50d66550d6dedae7409::usdt::USDT',

    try_id: '0x54761e02ab7880fea358876ac3a8037721f292ae',
    try: '0x2d264704e60ef6e4d5b6eb9b8f0d0da4fe0d8136::try::TRY',  

    tlp: '0x3eb51d8df0779ab3fb1f0ffb164f832a44a0906f::pool::TLP',

    // mint, buy/sell, swap package
    tradeifyPackageId: '0x3eb51d8df0779ab3fb1f0ffb164f832a44a0906f',
    testTokenSupplyId: '0x91f8ccfcbe0ffe4951632514de6d4ea22001f1ea',
    poolRegistryId: '0x19d41f7f55e6dfc8f8368482e09e3f5b63de2ae2',

    // staking package
    stakingPackageId: '0x3eb51d8df0779ab3fb1f0ffb164f832a44a0906f',
    stakingPoolId: '0x4ccd3a9a0818605a4e542085f7d12dd7bc5c575c',

    // referral package
    referralPackageId: '0x3eb51d8df0779ab3fb1f0ffb164f832a44a0906f',
    referRegistryId: '0xdf9e01bd116b87adf2f590ddcd250b2abe28a2e8',
    refTraderRegistryId: '0x79b1cc944aa44b5302567b236e3e96bfee16003f',
    referralStaus: '0x5b0385a5bbe9e110339153664d0b121ba4d969db',

    // trading package
    tradingPoolID: '0x6d7a391a81df279a5ee8f849e983686099d85a3d',

    // Main default setting parameter
    MainDecimal: 9,
    defaultSlippagePct: 1,
    tradingFee: 1, // this is % value
    nullAddress: '0x0000000000000000000000000000000000000000',
    faucetDurationTime: 3600000 // 1 hour
}