
export const CONFIG = {  
     
    rpcUrl: 'https://fullnode.devnet.sui.io:443',

    link: 'http://localhost:3000/',
    // link: 'https://tradeify/',

    // toeknomics
    eth_id: '0xab542793742fdbde68ef53ff125bf506c09d8a34',
    eth: '0x649a6e580de079e682b542c8ed6ea232fc9280bc::eth::ETH',
    btc_id: '0xd5cdc5be2162becda2c699ce0d33a074f5e6a7a5',
    btc: '0x37864b1010e7ddd17e1e37e39ca2da13152ae6d0::btc::BTC',
    try_id: '0x14c059ae71e3544a58404f9e8f6a062abf5cd599',
    try: '0xa12ec00a857dd0e67ea10c3b75f7e6fd2dc53313::try::TRY',    
    tlp: '0xde36bc4b0e9f603ff4c649734adf2e82ed71da59::pool::TLP',

    // mint, buy/sell, swap package
    tradeifyPackageId: '0x942583684b4ef0d79be228763879ba53ddbbd96b',
    testTokenSupplyId: '0x9388867d07fd738bcfc03840b4ef6f6c2bc2c5c3',
    poolRegistryId: '0xce0c9d31693d4714510cc1abed8940293b070171',

    // staking package
    stakingPackageId: '0x942583684b4ef0d79be228763879ba53ddbbd96b',
    stakingPoolId: '0x9c5216bbeaef96ae361cd61fc61aaffe8242cc75',

    // referral package
    referralPackageId: '0x942583684b4ef0d79be228763879ba53ddbbd96b',
    referRegistryId: '0x3505416e5b78c6ae92dfeb516edefb31973f3324',
    refTraderRegistryId: '0xec28317b945bca6dffe830168eeff1251e8bdf34',
    referralStaus: '0x219327551d560fa92fe9e156a024b9ab0c1518d6',

    // trading package
    tradingPoolID: '0x4836f0160a5dfd87cdad20e2322c32c179e02e7f',

    // Main default setting parameter
    MainDecimal: 9,
    defaultSlippagePct: 1,
    tradingFee: 1, // this is % value
    nullAddress: '0x0000000000000000000000000000000000000000'
}