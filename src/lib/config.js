
export const CONFIG = {  
     
    rpcUrl: 'https://fullnode.devnet.sui.io:443',

    // link: 'http://localhost:3000/',
    link: 'https://tradeify.app/',

    // tokenomics
    eth_id: '0xc8c968c2f2889ceac365c7c3fa8ca4dd0edb371a',
    eth: '0x412631ed64d6616568f8c8d4e7b7b294ea750c3::eth::ETH',

    btc_id: '0xe4ded000904fa0953c37485dd0a1091a9e02fe8e',
    btc: '0x8aad28886fc3af14b6d36b65efb6077c05dfc395::btc::BTC',

    usdt_id: '0xbbfa51174f45392ddba79a12964e71e2b5d60a43',
    usdt: '0xe35a86e3b1e98d580db69285227814b838e9cb4d::usdt::USDT',

    try_id: '0xda9496e1f70840066eaf467986592c545dec43dc',
    try: '0xd2053f78a98516c4df981cef9853f43163d083d6::try::TRY',  

    tlp: '0x894ec1abbff5f19b05f9530f0de79ef49e2a3790::pool::TLP',

    // mint, buy/sell, swap package
    tradeifyPackageId: '0x894ec1abbff5f19b05f9530f0de79ef49e2a3790',
    testTokenSupplyId: '0x7d5e33385024f8f265d6df9202c6a92213748967',
    poolRegistryId: '0xa240ffebb4aa2a92c3ba98fd0cbf0cb76ee180cd',

    // staking package
    stakingPackageId: '0x894ec1abbff5f19b05f9530f0de79ef49e2a3790',
    stakingPoolId: '0x2b40407ed8d405cccee62f594206c426d6f00caf',

    // referral package
    referralPackageId: '0x894ec1abbff5f19b05f9530f0de79ef49e2a3790',
    referRegistryId: '0x1c86429457bf6cf40b3dacec522309fa3b1cc4b5',
    refTraderRegistryId: '0x167fc536b6c1b48257a82a3aea98c8c4690099ce',
    referralStaus: '0xafbff01431ed5a9494be7529b1f00812387bb02a',

    // trading package
    tradingPoolID: '0x240054a9d9ea1ac5037a0bf3718a3818de6f48a0',

    // Main default setting parameter
    MainDecimal: 9,
    defaultSlippagePct: 1,
    tradingFee: 1, // this is % value
    nullAddress: '0x0000000000000000000000000000000000000000'
}