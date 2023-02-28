module trading::pool {
    use sui::object::{Self, UID, ID};
    use sui::coin::{Self, Coin, TreasuryCap};
    use sui::balance::{Self, Balance, Supply, create_supply};
    use sui::transfer;
    use sui::math;
    use sui::event;
    use sui::tx_context::{Self, TxContext};
    use sui::table::{Self, Table};
    use std::type_name::{Self, TypeName};
    use std::vector;
    use sui::staking_pool;
    use sui::locked_coin;
    use sui::epoch_time_lock::{Self, EpochTimeLock, new, epoch};   
    use std::option::{Self, Option};
    use sui::vec_map::{Self, VecMap};

    use trading::tlp::{Self, TLP, TLPStorage};

    /// The number of basis points in 100%.
    const DEFAULT_DECIMAL: u64 = 1000000000;
    const BPS_IN_100_PCT: u64 = 100 * 100;    
    const SWAP_FEE: u64 = 1 * 100;    
    const REFER_REWARD: u64 = 1 * 100;
    const TLP_PRICE: u64 = 1;

    const EZeroInput: u64 = 0;
    const EInvalidFeeParam: u64 = 1;
    const EPoolAlreadyExists: u64 = 2;
    const ENOUGHPOOL: u64 = 3;
    const ENoLiquidity: u64 = 4;
    const STAKINGLOCK: u64 = 5;
    const EReferAlreadyExistsRefer: u64 = 6;
    const EReferAlreadyExistsCode: u64 = 7;
    const EReferAlreadyExistsTrader: u64 = 8;
    const INVALID_USER: u64 = 9;
    const NotReferralCode: u64 = 10;
    const NOTOWNER: u64 = 11;
    

    fun muldiv(a: u64, b: u64, c: u64): u64 {
        ((((a as u128) * (b as u128)) / (c as u128)) as u64)
    }

    /// Calculates ceil_div((a * b), c). Errors if result doesn't fit into u64.
    fun ceil_muldiv(a: u64, b: u64, c: u64): u64 {
        (ceil_div_u128((a as u128) * (b as u128), (c as u128)) as u64)
    }

    /// Calculates sqrt(a * b).
    fun mulsqrt(a: u64, b: u64): u64 {
        (math::sqrt_u128((a as u128) * (b as u128)) as u64)
    }

    /// Calculates (a * b) / c for u128. Errors if result doesn't fit into u128.
    fun muldiv_u128(a: u128, b: u128, c: u128): u128 {
        ((((a as u256) * (b as u256)) / (c as u256)) as u128)
    }

    /// Calculates ceil(a / b).
    fun ceil_div_u128(a: u128, b: u128): u128 {
        if (a == 0) 0 else (a - 1) / b + 1
    }
    /// Calculates ceil(a / b).
    fun ceil_div_u64(a: u64, b: u64): u64 {
        if (a == 0) 0 else (a - 1) / b + 1
    }
    fun cmp_type_names(a: &TypeName, b: &TypeName): u8 {
        let bytes_a = std::ascii::as_bytes(type_name::borrow_string(a));
        let bytes_b = std::ascii::as_bytes(type_name::borrow_string(b));

        let len_a = vector::length(bytes_a);
        let len_b = vector::length(bytes_b);

        let i = 0;
        let n = math::min(len_a, len_b);
        while (i < n) {
            let a = *vector::borrow(bytes_a, i);
            let b = *vector::borrow(bytes_b, i);

            if (a < b) {
                return 0
            };
            if (a > b) {
                return 2
            };
            i = i + 1;
        };

        if (len_a == len_b) {
            return 1
        };

        return if (len_a < len_b) {
            0
        } else {
            2
        }
    }

    fun new_registry(ctx: &mut TxContext): PoolRegistry {
        PoolRegistry { 
            id: object::new(ctx),
            table: table::new(ctx)
        }
    }

    fun destroy_or_transfer_balance<T>(balance: Balance<T>, recipient: address, ctx: &mut TxContext) {
        if (balance::value(&balance) == 0) {
            balance::destroy_zero(balance);
            return
        };
        transfer::transfer(
            coin::from_balance(balance, ctx),
            recipient
        );
    }


    public fun maybe_split_and_transfer_rest<T>(
        input: Coin<T>, amount: u64, recipient: address, ctx: &mut TxContext
    ): Coin<T> {
        if (coin::value(&input) == amount) {
            return input
        };

        let out = coin::split(&mut input, amount, ctx);
        transfer::transfer(input, recipient);

        return out
    }

    fun registry_add<A>(self: &mut PoolRegistry) {
        let a = type_name::get<A>();

        let item = PoolRegistryItem{ a };
        assert!(table::contains(&self.table, item) == false, EPoolAlreadyExists);

        table::add(&mut self.table, item, true)
    }

    
    fun new_refer_registry(ctx: &mut TxContext): ReferRegistry {
        ReferRegistry { 
            id: object::new(ctx),
            data: vec_map::empty()
        }
    }

    fun add_refer_registry(refer_registry: &mut ReferRegistry, refer: ID, referralCode: u64) {
        let item = ReferRegistryItem {
            refer,
            referralCode
        };
        let len = vec_map::size(&refer_registry.data);
        let i = 0;
        while (i < len) {            
            let (key, value) = vec_map::get_entry_by_idx(&refer_registry.data, i);
            assert!(key.refer != refer, EReferAlreadyExistsRefer);
            assert!(key.referralCode != referralCode, EReferAlreadyExistsCode);
            i =i + 1;
        };
        vec_map::insert(&mut refer_registry.data, item, true);
    }

    fun new_refTrader_registry(ctx: &mut TxContext): RefTraderRegistry {
        RefTraderRegistry {
            id: object::new(ctx),
            data: vec_map::empty()
        }
    }

    fun mint_tlp(tlp_storage: &mut TLPStorage, value: u64, ctx: &mut TxContext): Coin<TLP> {
        // We can create a Coin<IPX> with 0 value without minting
        if (value == 0) { coin::zero<TLP>(ctx) } else { tlp::mint(tlp_storage, value, ctx) }
    }

    fun add_refTrader_registry(
        refTrader_registry: &mut RefTraderRegistry, 
        trader: ID, 
        referralCode: u64, 
        refer_registry: & ReferRegistry
    ) {
        let item = RefTraderRegistryItem {
            trader,
            referralCode
        };
        let lenRefTrader = vec_map::size(&refTrader_registry.data);        

        let i = 0;
        while (i < lenRefTrader) {            
            let (key, value) = vec_map::get_entry_by_idx(&refTrader_registry.data, i);
            assert!(key.trader != trader, EReferAlreadyExistsTrader);
            i = i + 1;
        };


        let j = 0;
        let lenRefer = vec_map::size(&refer_registry.data);
        let isReferFlag = false;
        while (j < lenRefer) {
            let (key, value) = vec_map::get_entry_by_idx(&refer_registry.data, j);
            if(key.referralCode == referralCode) {
                if (key.refer != trader) { 
                    isReferFlag = true;
                }
            };
            j = j + 1;
        };
        assert!(isReferFlag == true, NotReferralCode);
        vec_map::insert(&mut refTrader_registry.data, item, true);
    }


    struct PoolRegistryItem has copy, drop, store  {
        a: TypeName
    }

    /// The pool create info that should be stored to the creator
    struct PoolCreateInfo has key {
        id: UID,
        pool_id: ID
    }

    struct PoolRegistry has key, store {
        id: UID,
        table: Table<PoolRegistryItem, bool>,
    }

    struct PoolCreationEvent has copy, drop {
        pool_id: ID,
    }

    /// Staking pool struct for tradeify
    struct StakingPool<phantom A, phantom B> has key {
        id: UID,
        balance_tlp: Balance<A>,
        balance_try: Balance<B>,
        stake_fee: u64
    }

    /// Staking pool creation event
    struct StakingPoolCreationEvent has copy, drop {
        staking_pool_id: ID,
    }
    struct StakeCreationEvent has copy, drop {
        stake_id: ID,
        owner: ID
    }

    struct StakingTimeInterval  has key, store {
        id: UID,
        interval: EpochTimeLock
    }

    struct StakingMeta<phantom A> has key, store {
        id: UID,
        owner: ID,
        staking_amount: u64,
        start_timestamp: u64,
        lock_time: u64
    }

    
    struct Refer has key, store {
        id: UID,
        refer: ID,
        referralCode: u64,
    }
    struct ReferRegistryItem has copy, drop, store  {
        refer: ID,
        referralCode: u64
    }
    struct ReferRegistry has key, store {
        id: UID,
        data: VecMap<ReferRegistryItem, bool>
    }
    struct ReferCreationEvent has copy, drop {
        refer: ID,
        referralCode: u64
    }

    struct Trader has key, store {
        id: UID,
        trader: ID,
        referralCode: u64
    }
    struct RefTraderRegistryItem has copy, drop, store  {
        trader: ID,
        referralCode: u64
    }
    struct RefTraderRegistry has key, store {
        id: UID,
        data: VecMap<RefTraderRegistryItem, bool>
    }
    struct RefTraderCreationEvent has copy, drop {
        trader: ID,
        referralCode: u64
    }

    struct ReferralStatus has key {
        id: UID,
        total_refer: u64,
        total_trader: u64
    }

    struct TradingPool has key, store {
        id: UID,
        tradingPoolFee: u64,
        openPosition: u64,
        closePosition: u64,
        totalPosition: u64,
        data: VecMap<OrderRegistryItem, bool>
    }

    // Trading type is 1, 2, 3.  1 = Market      2 = Limit       3 = Stop Market
    // Trading status is 1, 2, 3.   1 = pending     2 = fund        3 = closed

    struct OrderRegistryItem has copy, drop, store {
        trader: ID,
        inPoolID: ID,
        outPoolID: ID,
        marketPrice: u64,
        lastPrice: u64,
        tradingAmount: u64,
        calcAmount: u64,
        updateCalcAmount: u64,
        leverageValue: u64,
        referID: ID,
        hasRefer: u64,
        createdTimeStamp: u64,
        tradingType: u64,
        tradingStatus: u64,
        isEarn: u64,
    }

    struct PositionCreationEvent has copy, drop {
        trader: ID,
        inPoolID: ID,
        outPoolID: ID,
    }


    /// Pool struct for tradeify
    struct Pool<phantom A> has key {
        id: UID,
        balance_a: Balance<A>,
        lp_supply: u64,
        /// The liquidity provider fees expressed in basis points (1 bps is 0.01%)
        lp_fee_bps: u64,
    }

    fun init(ctx: &mut TxContext) {
        transfer::share_object(new_registry(ctx));
        transfer::share_object(
            ReferralStatus {
                id: object::new(ctx),
                total_refer: 0,
                total_trader: 0
            }
        );
        transfer::share_object(new_refer_registry(ctx));
        transfer::share_object(new_refTrader_registry(ctx));
        transfer::share_object(
            TradingPool {
                id: object::new(ctx),
                tradingPoolFee: 100,
                openPosition: 0,
                closePosition: 0,
                totalPosition: 0,
                data: vec_map::empty(),
            }
        );        
    }    

    // mint_token
    public entry fun mint_test_token<T>(c: &mut TreasuryCap<T>, amount: u64, ctx: &mut TxContext) {
        // Admin could mint with a amount set for testing usage        
        let recipient = tx_context::sender(ctx);
        coin::mint_and_transfer<T>(c, amount, recipient, ctx);
    }

    // create pool part
    public fun create_pool<A>(
        registry: &mut PoolRegistry,    
        tlp_storage: &mut TLPStorage, 
        init_a: Balance<A>,
        price_a: u64,
        lp_fee_bps: u64,
        ctx: &mut TxContext,
    ) {
        assert!(balance::value(&init_a) > 0, EZeroInput);
        assert!(lp_fee_bps < BPS_IN_100_PCT, EInvalidFeeParam);

        // add to registry (guarantees that there's only one pool per currency pair)
        registry_add<A>(registry);

        let deposit_a = balance::value(&init_a);
        let amt_lp = muldiv(deposit_a, price_a, TLP_PRICE);
        // let amt_lp_update = ceil_div_u64(amt_lp, DEFAULT_DECIMAL);

        let coin_lp = mint_tlp(tlp_storage, amt_lp, ctx);
        
        tlp::transfer(coin_lp, tx_context::sender(ctx));
        // create pool
        let pool = Pool<A> {
            id: object::new(ctx),
            balance_a: init_a,
            lp_supply: amt_lp,
            lp_fee_bps,
        };        
        event::emit(PoolCreationEvent { pool_id: object::id(&pool) });
        transfer::share_object(pool);
    }

    public fun create_pool_<A>(
        registry: &mut PoolRegistry,        
        tlp_storage: &mut TLPStorage, 
        init_a: Coin<A>,
        price_a: u64,
        lp_fee_bps: u64,
        ctx: &mut TxContext,
    ) {
        create_pool(
            registry,
            tlp_storage,
            coin::into_balance(init_a),
            price_a,
            lp_fee_bps,
            ctx
        );
    }

    // create liquidity pool
    public entry fun maybe_split_then_create_pool<A>(
        registry: &mut PoolRegistry,
        tlp_storage: &mut TLPStorage, 
        input_a: Coin<A>,
        amount_a: u64,
        price_a: u64,
        lp_fee_bps: u64,
        ctx: &mut TxContext
    ) {
        let init_a = maybe_split_and_transfer_rest(input_a, amount_a, tx_context::sender(ctx), ctx);
        create_pool_(registry, tlp_storage, init_a, price_a, lp_fee_bps, ctx);
    }

    public fun buy_tlp<A>(
        tlp_storage: &mut TLPStorage, 
        pool: &mut Pool<A>,
        input_a: Balance<A>,
        price_a: u64,
        ctx: &mut TxContext
    ) {        
        assert!(balance::value(&input_a) > 0, EZeroInput);   

        let deposit_a = balance::value(&input_a);
        let amt_lp_before_fee = muldiv(deposit_a, price_a, TLP_PRICE);
        let amt_lp = muldiv(amt_lp_before_fee, (BPS_IN_100_PCT - pool.lp_fee_bps), BPS_IN_100_PCT);
        
        pool.lp_supply = pool.lp_supply + amt_lp;
        let coin_lp = mint_tlp(tlp_storage, amt_lp, ctx);

        balance::join(
            &mut pool.balance_a,
            input_a
        );
        tlp::transfer(coin_lp, tx_context::sender(ctx));
    }

    public entry fun buy_tlp_<A>(
        tlp_storage: &mut TLPStorage, 
        pool: &mut Pool<A>,
        input_a: Coin<A>,
        amount_a: u64,
        price_a: u64,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let init_a = maybe_split_and_transfer_rest(input_a, amount_a, tx_context::sender(ctx), ctx);
        buy_tlp(tlp_storage, pool, coin::into_balance(init_a), price_a, ctx);
    }

    public fun sell_tlp<A> ( 
        tlp_storage: &mut TLPStorage,        
        pool: &mut Pool<A>,
        input: Balance<TLP>,
        price_a: u64,
        ctx: &mut TxContext
    ):Balance<A> {

        let input_tlp = balance::value(&input);
        let amt_out = muldiv(input_tlp, TLP_PRICE, price_a);
        
        pool.lp_supply = pool.lp_supply - input_tlp;
        tlp::burn(tlp_storage, coin::from_balance(input, ctx));        
        balance::split(&mut pool.balance_a, amt_out)
    }

    public entry fun sell_tlp_<A>(
        tlp_storage: &mut TLPStorage, 
        pool: &mut Pool<A>,
        input_tlp: Coin<TLP>,
        amount_tlp: u64,
        price_a: u64,
        ctx: &mut TxContext
    ) {        
        let sender = tx_context::sender(ctx);
        let input_lp = maybe_split_and_transfer_rest(input_tlp, amount_tlp, tx_context::sender(ctx), ctx);
        let out_balance = sell_tlp(tlp_storage, pool, coin::into_balance(input_lp), price_a, ctx);        
        destroy_or_transfer_balance(out_balance, sender, ctx)
    }

    public fun swap<A, B> (
        poolA: &mut Pool<A>,
        poolB: &mut Pool<B>,
        price_a: u64,
        price_b: u64,
        input_a: Balance<A>,
        ctx: &mut TxContext
    ):Balance<B> {
        assert!(balance::value(&input_a) > 0, EZeroInput);
        assert!(
            balance::value(&poolA.balance_a) > 0 && balance::value(&poolB.balance_a) > 0,
            ENoLiquidity
        );
        let out_pool_value = balance::value(&poolB.balance_a);
        let i_value = balance::value(&input_a);
        let value = muldiv(i_value, price_a, price_b); 
        let out_value = muldiv(value, (BPS_IN_100_PCT - SWAP_FEE), BPS_IN_100_PCT);
        
        assert!(out_value < out_pool_value, ENOUGHPOOL);

        balance::join(&mut poolA.balance_a, input_a);
        balance::split(&mut poolB.balance_a, out_value)
    }

    public entry fun swap_<A, B>(
        poolA: &mut Pool<A>,
        poolB: &mut Pool<B>,
        price_a: u64,
        price_b: u64,
        input_a: Coin<A>,
        amount_a: u64,
        ctx: &mut TxContext
    ) {
        let input = maybe_split_and_transfer_rest(input_a, amount_a, tx_context::sender(ctx), ctx);
        let out = swap(poolA, poolB, price_a, price_b, coin::into_balance(input), ctx);
        destroy_or_transfer_balance(out, tx_context::sender(ctx), ctx);
    }

    // Staking part 
    public fun create_staking_pool<A, B>(
        init_a: Coin<A>,
        init_b: Coin<B>,
        stake_fee: u64,
        ctx: &mut TxContext
    ) {
        let staking_pool = StakingPool<A, B> {
            id: object::new(ctx),
            balance_tlp: coin::into_balance(init_a),
            balance_try: coin::into_balance(init_b),
            stake_fee: stake_fee
        };
        event::emit(StakingPoolCreationEvent { staking_pool_id: object::id(&staking_pool) });
        transfer::share_object(staking_pool)
    }
    
    public entry fun create_staking_pool_<A, B>(
        input_a: Coin<A>,
        input_b: Coin<B>,
        amount_a: u64,
        amount_b: u64,
        stake_fee: u64,
        ctx: &mut TxContext
    ) {
        let init_a = maybe_split_and_transfer_rest(input_a, amount_a, tx_context::sender(ctx), ctx);
        let init_b = maybe_split_and_transfer_rest(input_b, amount_b, tx_context::sender(ctx), ctx);
        create_staking_pool(
            init_a,
            init_b,
            stake_fee,
            ctx
        )        
    }

    public fun deposit_try<A, B> (
        staking_pool: &mut StakingPool<A, B>,
        init_try: Coin<B>
    ) {
        let balance = coin::into_balance(init_try);
        balance::join(&mut staking_pool.balance_try, balance);
    }

    public entry fun deposit_try_<A, B> (
        staking_pool: &mut StakingPool<A, B>,
        input_try: Coin<B>,
        amount_try: u64,
        ctx: &mut TxContext
    ) {
        let init_try = maybe_split_and_transfer_rest(input_try, amount_try, tx_context::sender(ctx), ctx);
        deposit_try(staking_pool, init_try)
    }

    
    public fun stake_tlp<A, B>(
        staking_pool: &mut StakingPool<A, B>,
        input_tlp: Coin<A>,
        owner: ID,
        start_timestamp: u64,
        lock_time: u64,
        ctx: &mut TxContext
    ) {
        let balance_tlp = coin::into_balance(input_tlp);
        let stake_tlp = balance::value(&balance_tlp);
        balance::join(&mut staking_pool.balance_tlp, balance_tlp);
        let staking_data = StakingMeta<A>{
            id: object::new(ctx),
            owner: owner,
            staking_amount: stake_tlp,
            start_timestamp: start_timestamp,
            lock_time: lock_time
        };
        event::emit(StakeCreationEvent { stake_id: object::id(&staking_data), owner: owner });
        transfer::transfer(
            staking_data,
            tx_context::sender(ctx)
        )
    }
    public entry fun stake_tlp_<A, B> (
        staking_pool: &mut StakingPool<A, B>,
        input_tlp: Coin<A>,
        stake_amount: u64,
        owner: ID,
        start_timestamp: u64,
        lock_time: u64,
        ctx: &mut TxContext
    ) {
        let stake_tlp = maybe_split_and_transfer_rest(input_tlp, stake_amount, tx_context::sender(ctx), ctx);
        stake_tlp(staking_pool, stake_tlp, owner, start_timestamp, lock_time, ctx);
    }

    public fun deposit_tlp_stake<A, B>(
        staking_pool: &mut StakingPool<A, B>,
        user_stake: &mut StakingMeta<A>,
        input_tlp: Coin<A>,
        start_timestamp: u64,
        lock_time: u64,
        ctx: &mut TxContext
    ) {
        let balance_tlp = coin::into_balance(input_tlp);
        let stake_tlp = balance::value(&balance_tlp);
        balance::join(&mut staking_pool.balance_tlp, balance_tlp);
        user_stake.start_timestamp = start_timestamp;
        user_stake.staking_amount = user_stake.staking_amount + stake_tlp;
        user_stake.lock_time = lock_time;
    }
    public entry fun deposit_tlp_stake_<A, B> (
        staking_pool: &mut StakingPool<A, B>,        
        user_stake: &mut StakingMeta<A>,
        input_tlp: Coin<A>,
        stake_amount: u64,
        start_timestamp: u64,
        lock_time: u64,
        ctx: &mut TxContext
    ) {
        let stake_tlp = maybe_split_and_transfer_rest(input_tlp, stake_amount, tx_context::sender(ctx), ctx);
        deposit_tlp_stake(staking_pool, user_stake, stake_tlp, start_timestamp, lock_time, ctx);
    }


    /// get reward of staking
    public fun get_reward<A, B> (
        staking_pool: &mut StakingPool<A, B>,
        user_stake: &mut StakingMeta<A>,
        current_time: u64,    
        owner: ID,
    ): (Balance<B>) {
        assert!(current_time > (user_stake.start_timestamp + user_stake.lock_time), STAKINGLOCK);
        assert!(owner == user_stake.owner, INVALID_USER);
        let balance = (current_time - user_stake.start_timestamp) * user_stake.staking_amount / balance::value(&staking_pool.balance_tlp);
        user_stake.start_timestamp = current_time;
        return balance::split(&mut staking_pool.balance_try, balance)
    }

    public entry fun get_reward_<A, B> (
        staking_pool: &mut StakingPool<A, B>,
        user_stake: &mut StakingMeta<A>,
        current_time: u64,
        owner: ID,
        ctx: &mut TxContext,
    ) {
        let reward_out = get_reward(staking_pool, user_stake, current_time, owner);
        let sender = tx_context::sender(ctx);
        destroy_or_transfer_balance(reward_out, sender, ctx);
    }

    public fun unstake<A, B> (
        staking_pool: &mut StakingPool<A, B>,
        user_stake: &mut StakingMeta<A>,
        ctx: &mut TxContext,
    ):Balance<A> {        
        let out_amount = balance::split(&mut staking_pool.balance_tlp, (user_stake.staking_amount - user_stake.staking_amount * staking_pool.stake_fee / BPS_IN_100_PCT));
        user_stake.staking_amount = 0;
        out_amount
    }
    public entry fun unstake_<A, B>(
        staking_pool: &mut StakingPool<A, B>,
        user_stake: &mut StakingMeta<A>,
        ctx: &mut TxContext,
    ) {
        let out_tlp = unstake(staking_pool, user_stake, ctx);
        let sender = tx_context::sender(ctx);
        destroy_or_transfer_balance(out_tlp, sender, ctx);
    } 

    
    // Referral part
    public fun create_referral_code(
        ctx: &mut TxContext, 
        referalStaus: &mut ReferralStatus, 
        referralCode: u64,
        refer_registry: &mut ReferRegistry,
    ) {
        let refer_id = object::id_from_address(tx_context::sender(ctx));
        let refer = Refer{
            id: object::new(ctx),
            refer: refer_id,
            referralCode: referralCode
        };
        add_refer_registry(refer_registry, refer_id, referralCode);
        referalStaus.total_refer = referalStaus.total_refer + 1;
        event::emit(ReferCreationEvent {refer: refer_id, referralCode:referralCode});
        transfer::transfer(refer, tx_context::sender(ctx));
    }

    entry fun create_referral_code_(
        referralCode: u64,
        referalStaus: &mut ReferralStatus, 
        refer_registry: &mut ReferRegistry,
        ctx: &mut TxContext,
    ) {
        create_referral_code(ctx, referalStaus, referralCode, refer_registry);
    }

    public fun submit_referral_code (        
        ctx: &mut TxContext, 
        referalStaus: &mut ReferralStatus, 
        referralCode: u64,
        refTrader_registry: &mut RefTraderRegistry,
        refer_registry: &mut ReferRegistry,
    ) {
        let trader_id = object::id_from_address(tx_context::sender(ctx));
        let trader = Trader{
            id: object::new(ctx),
            trader: trader_id,
            referralCode: referralCode
        };
        add_refTrader_registry(refTrader_registry, trader_id, referralCode, refer_registry);
        referalStaus.total_trader = referalStaus.total_trader + 1;
        event::emit(RefTraderCreationEvent {trader: trader_id, referralCode:referralCode});
        transfer::transfer(trader, tx_context::sender(ctx));
    }

    entry fun submit_referral_code_(
        referralCode: u64,
        referalStaus: &mut ReferralStatus, 
        refTrader_registry: &mut RefTraderRegistry,
        refer_registry: &mut ReferRegistry,
        ctx: &mut TxContext,
    ) {
        submit_referral_code(ctx, referalStaus, referralCode, refTrader_registry, refer_registry);
    }    

    public fun create_position<A, B> (
        inPoolID: &mut Pool<A>,
        outPoolID: &mut Pool<B>,
        tradingPoolID: &mut TradingPool,
        marketPrice: u64,
        inputCoinA: Coin<A>,
        calcAmount: u64,
        leverageValue: u64,
        hasRefer: u64,
        referID: ID,
        createdTimeStamp: u64,
        tradingType: u64,
        ctx: &mut TxContext
    ) {        
        let _trader = object::id_from_address(tx_context::sender(ctx));
        let _inPoolID = object::id(inPoolID);
        let _outPoolID = object::id(outPoolID);

        let balance_A = coin::into_balance(inputCoinA);
        let _tradingAmount = balance::value(&balance_A);        
        let _tradingAmountUpdate = 0;
        
        if(hasRefer == 1) {            
            let refer_reward = muldiv(_tradingAmount, REFER_REWARD, BPS_IN_100_PCT);
            let balance_reward = balance::split(&mut balance_A, refer_reward);
            _tradingAmountUpdate = balance::value(&balance_A);
            destroy_or_transfer_balance(balance_reward, object::id_to_address(&referID), ctx);
        } else {
            _tradingAmountUpdate = _tradingAmount;
        };

        let tradingStatus = 1; // open
        let _updateCalcAmount = 0;
        let _isEarn = 0;
        let _lastPrice = 0;
        balance::join(&mut inPoolID.balance_a, balance_A);

        tradingPoolID.openPosition = tradingPoolID.openPosition + 1;
        tradingPoolID.totalPosition = tradingPoolID.totalPosition + 1;
        
        let item = OrderRegistryItem {
            trader: _trader,
            inPoolID: _inPoolID,
            outPoolID: _outPoolID,
            marketPrice: marketPrice,
            lastPrice: _lastPrice,
            tradingAmount: _tradingAmountUpdate,
            calcAmount: calcAmount,
            updateCalcAmount: _updateCalcAmount,
            leverageValue: leverageValue,
            referID: referID,
            hasRefer: hasRefer,
            createdTimeStamp: createdTimeStamp,
            tradingType: tradingType,
            tradingStatus: tradingStatus,
            isEarn: _isEarn,
        };
        vec_map::insert(&mut tradingPoolID.data, item, true);
        event::emit(PositionCreationEvent {trader: _trader, inPoolID: _inPoolID, outPoolID: _outPoolID});
    }

    public entry fun create_position_<A, B>(
        inPoolID: &mut Pool<A>,
        outPoolID: &mut Pool<B>,
        tradingPoolID: &mut TradingPool,
        coinA: Coin<A>,
        marketPrice: u64,
        tradingAmount: u64,
        calcAmount: u64,
        leverageValue: u64,
        hasRefer: u64,
        referID: ID,
        createdTimeStamp: u64,
        tradingType: u64,
        ctx: &mut TxContext,
    ) {        
        let _tradingAmount = maybe_split_and_transfer_rest(coinA, tradingAmount, tx_context::sender(ctx), ctx);
        create_position(
            inPoolID, 
            outPoolID, 
            tradingPoolID,
            marketPrice,                 
            _tradingAmount, 
            calcAmount,
            leverageValue,
            hasRefer,
            referID,
            createdTimeStamp,    
            tradingType,
            ctx,
        );
    }

    public fun create_position2<A> (
        inPoolID: &mut Pool<A>,
        tradingPoolID: &mut TradingPool,
        marketPrice: u64,
        inputCoinA: Coin<A>,
        calcAmount: u64,
        leverageValue: u64,
        hasRefer: u64,
        referID: ID,
        createdTimeStamp: u64,
        tradingType: u64,
        ctx: &mut TxContext
    ) {        
        let _trader = object::id_from_address(tx_context::sender(ctx));
        let _inPoolID = object::id(inPoolID);

        let balance_A = coin::into_balance(inputCoinA);
        let _tradingAmount = balance::value(&balance_A);        
        let _tradingAmountUpdate = 0;
        
        if(hasRefer == 1) {            
            let refer_reward = muldiv(_tradingAmount, REFER_REWARD, BPS_IN_100_PCT);
            let balance_reward = balance::split(&mut balance_A, refer_reward);
            _tradingAmountUpdate = balance::value(&balance_A);
            destroy_or_transfer_balance(balance_reward, object::id_to_address(&referID), ctx);
        } else {
            _tradingAmountUpdate = _tradingAmount;
        };

        let tradingStatus = 1; // open
        let _updateCalcAmount = 0;
        let _isEarn = 0;
        let _lastPrice = 0;
        balance::join(&mut inPoolID.balance_a, balance_A);

        tradingPoolID.openPosition = tradingPoolID.openPosition + 1;
        tradingPoolID.totalPosition = tradingPoolID.totalPosition + 1;
        
        let item = OrderRegistryItem {
            trader: _trader,
            inPoolID: _inPoolID,
            outPoolID: _inPoolID,
            marketPrice: marketPrice,
            lastPrice: _lastPrice,
            tradingAmount: _tradingAmountUpdate,
            calcAmount: calcAmount,
            updateCalcAmount: _updateCalcAmount,
            leverageValue: leverageValue,
            referID: referID,
            hasRefer: hasRefer,
            createdTimeStamp: createdTimeStamp,
            tradingType: tradingType,
            tradingStatus: tradingStatus,
            isEarn: _isEarn,
        };
        vec_map::insert(&mut tradingPoolID.data, item, true);
        event::emit(PositionCreationEvent {trader: _trader, inPoolID: _inPoolID, outPoolID: _inPoolID});
    }

    public entry fun create_position2_<A>(
        inPoolID: &mut Pool<A>,
        tradingPoolID: &mut TradingPool,
        coinA: Coin<A>,
        marketPrice: u64,
        tradingAmount: u64,
        calcAmount: u64,
        leverageValue: u64,
        hasRefer: u64,
        referID: ID,
        createdTimeStamp: u64,
        tradingType: u64,
        ctx: &mut TxContext,
    ) {        
        let _tradingAmount = maybe_split_and_transfer_rest(coinA, tradingAmount, tx_context::sender(ctx), ctx);
        create_position2(
            inPoolID, 
            tradingPoolID,
            marketPrice,                 
            _tradingAmount, 
            calcAmount,
            leverageValue,
            hasRefer,
            referID,
            createdTimeStamp,    
            tradingType,
            ctx,
        );
    } 

    public fun close_position<A, B>(
        inPoolID: &mut Pool<A>,
        outPoolID: &mut Pool<B>,
        tradingPoolID: &mut TradingPool,
        createdTimeStamp: u64,
        current_priceA: u64,
        current_priceB: u64,
        ctx: &mut TxContext
    ): Balance<A> {

        let leverage = 0;
        let tradingAmount = 0;
        let updateCalcAmountValue = 0;
        let isEarn = 0;

        let len = vec_map::size(&tradingPoolID.data);
        let i = 0;
        while (i < len) {

            let (key, value) = vec_map::get_entry_by_idx(&tradingPoolID.data, i);
            
            if(key.createdTimeStamp == createdTimeStamp) { 
                assert!(key.trader == object::id_from_address(tx_context::sender(ctx)), NOTOWNER);
                let trader = key.trader;
                let inPoolID = key.inPoolID; 
                let outPoolID = key.outPoolID; 
                let marketPrice = key.marketPrice; 
                let calcAmount = key.calcAmount; 
                let tradingType = key.tradingType;
                
                if(tradingType == 0) { 
                    if(current_priceB > marketPrice) {
                        isEarn = 1;
                        updateCalcAmountValue = muldiv(calcAmount, (current_priceB - marketPrice), current_priceA);
                    } else {
                        isEarn = 2;
                        updateCalcAmountValue = muldiv(calcAmount, (marketPrice - current_priceB), current_priceA);
                    };
                } else {
                    if(current_priceB < marketPrice) {
                        isEarn = 1;
                        updateCalcAmountValue = muldiv(calcAmount, (marketPrice- current_priceB), current_priceA);
                    } else {
                        isEarn = 2;
                        updateCalcAmountValue = muldiv(calcAmount, (current_priceB - marketPrice), current_priceA);
                    };
                };

                tradingAmount = key.tradingAmount; 
                let updateCalcAmount = updateCalcAmountValue; 
                let leverageValue = key.leverageValue; 
                let referID = key.referID; 
                let hasRefer = key.hasRefer;
                let createdTimeStamp = key.createdTimeStamp; 
                let tradingStatus = 2;  // close status

                vec_map::remove_entry_by_idx(&mut tradingPoolID.data, i);

                let item = OrderRegistryItem {
                    trader: trader,
                    inPoolID: inPoolID,
                    outPoolID: outPoolID,
                    marketPrice: marketPrice,
                    lastPrice: current_priceB,
                    tradingAmount: tradingAmount,
                    calcAmount: calcAmount,
                    updateCalcAmount: updateCalcAmount,
                    leverageValue: leverageValue,
                    referID: referID,
                    hasRefer: hasRefer,
                    createdTimeStamp: createdTimeStamp,
                    tradingType: tradingType,
                    tradingStatus: tradingStatus,
                    isEarn: isEarn,
                };
                vec_map::insert(&mut tradingPoolID.data, item, true);
            };
            i = i + 1;
        };

        let out_amount = 0;

        if (isEarn == 1) {
            out_amount = tradingAmount + updateCalcAmountValue;
        } else if (isEarn == 2) {
            out_amount = tradingAmount - updateCalcAmountValue;
        };

        tradingPoolID.openPosition = tradingPoolID.openPosition - 1;
        tradingPoolID.closePosition = tradingPoolID.closePosition + 1;

        balance::split(&mut inPoolID.balance_a, out_amount)
    }

    public entry fun close_position_<A, B>(
        inPoolID: &mut Pool<A>,
        outPoolID: &mut Pool<B>,
        tradingPoolID: &mut TradingPool,
        createdTimeStamp: u64,
        current_priceA: u64,
        current_priceB: u64,
        ctx: &mut TxContext
    ) {
        let amount = close_position(inPoolID, outPoolID, tradingPoolID, createdTimeStamp, current_priceA, current_priceB, ctx);   
        let sender = tx_context::sender(ctx);     
        destroy_or_transfer_balance(amount, sender, ctx);
    }
    public fun close_position2<A>(
        inPoolID: &mut Pool<A>,
        tradingPoolID: &mut TradingPool,
        createdTimeStamp: u64,
        current_priceA: u64,
        ctx: &mut TxContext
    ): Balance<A> {

        let leverage = 0;
        let tradingAmount = 0;
        let updateCalcAmountValue = 0;
        let isEarn = 0;

        let len = vec_map::size(&tradingPoolID.data);
        let i = 0;
        while (i < len) {

            let (key, value) = vec_map::get_entry_by_idx(&tradingPoolID.data, i);
            
            if(key.createdTimeStamp == createdTimeStamp) { 
                assert!(key.trader == object::id_from_address(tx_context::sender(ctx)), NOTOWNER);
                let trader = key.trader;
                let inPoolID = key.inPoolID; 
                let outPoolID = key.outPoolID; 
                let marketPrice = key.marketPrice; 
                let calcAmount = key.calcAmount; 
                let tradingType = key.tradingType; 
                if(tradingType == 0) {
                    if(current_priceA > marketPrice) {
                        isEarn = 1;
                        updateCalcAmountValue = muldiv(calcAmount, (current_priceA - marketPrice), current_priceA);
                    } else {
                        isEarn = 2;
                        updateCalcAmountValue = muldiv(calcAmount, (marketPrice - current_priceA), current_priceA);
                    };
                } else {
                    if(current_priceA < marketPrice) {
                        isEarn = 1;
                        updateCalcAmountValue = muldiv(calcAmount, (marketPrice - current_priceA), current_priceA);
                    } else {
                        isEarn = 2;
                        updateCalcAmountValue = muldiv(calcAmount, (current_priceA - marketPrice), current_priceA);
                    };
                };

                tradingAmount = key.tradingAmount; 
                let updateCalcAmount = updateCalcAmountValue; 
                let leverageValue = key.leverageValue; 
                let referID = key.referID; 
                let hasRefer = key.hasRefer;
                let createdTimeStamp = key.createdTimeStamp; 
                let tradingStatus = 2;  // close status

                vec_map::remove_entry_by_idx(&mut tradingPoolID.data, i);

                let item = OrderRegistryItem {
                    trader: trader,
                    inPoolID: inPoolID,
                    outPoolID: outPoolID,
                    marketPrice: marketPrice,
                    lastPrice: current_priceA,
                    tradingAmount: tradingAmount,
                    calcAmount: calcAmount,
                    updateCalcAmount: updateCalcAmount,
                    leverageValue: leverageValue,
                    referID: referID,
                    hasRefer: hasRefer,
                    createdTimeStamp: createdTimeStamp,
                    tradingType: tradingType,
                    tradingStatus: tradingStatus,
                    isEarn: isEarn,
                };
                vec_map::insert(&mut tradingPoolID.data, item, true);
            };
            i = i + 1;
        };

        let out_amount = 0;

        if (isEarn == 1) {
            out_amount = tradingAmount + updateCalcAmountValue;
        } else if (isEarn == 2) {
            out_amount = tradingAmount - updateCalcAmountValue;
        };

        tradingPoolID.openPosition = tradingPoolID.openPosition - 1;
        tradingPoolID.closePosition = tradingPoolID.closePosition + 1;

        balance::split(&mut inPoolID.balance_a, out_amount)
    }

    public entry fun close_position2_<A>(
        inPoolID: &mut Pool<A>,
        tradingPoolID: &mut TradingPool,
        createdTimeStamp: u64,
        current_priceA: u64,
        ctx: &mut TxContext
    ) {
        let amount = close_position2(inPoolID, tradingPoolID, createdTimeStamp, current_priceA, ctx);   
        let sender = tx_context::sender(ctx);     
        destroy_or_transfer_balance(amount, sender, ctx);
    }

}