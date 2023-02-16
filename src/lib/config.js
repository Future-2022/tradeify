
export const CONFIG = {  
     
    rpcUrl: 'https://fullnode.devnet.sui.io:443',

    link: 'http://localhost:3000/',
    // link: 'https://tradeify/',

    // toeknomics
    eth_id: '0x29f8d5469163a3740cb7b17b2c04c385de1d6ade',
    eth: '0xffbf0d6c86dc7328c0337beac66f6642f34d1d41::eth::ETH',
    btc_id: '0xc9b314762fb2031ec0c9171df8312631040127a5',
    btc: '0xabc7c056bfde290ea841e04f3e5439a0b4d56eab::btc::BTC',
    try_id: '0xae7235a7faf97bb871d8554e9c9da9408bf62508',
    try: '0xefd6df06a300258833fd91bf69439077e059cf03::try::TRY',    
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
    tradingPoolID: '0x1785408256394459aec2439d1b5c6c244bb5c10b',

    // Main default setting parameter
    MainDecimal: 9,
    defaultSlippagePct: 1,
    tradingFee: 1, // this is % value
    nullAddress: '0x0000000000000000000000000000000000000000'
}