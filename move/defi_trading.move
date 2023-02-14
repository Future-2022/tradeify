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

    /// The number of basis points in 100%.
    const BPS_IN_100_PCT: u64 = 100 * 100;

    const ETableNotEmpty: u64 = 0;
    const EReferAlreadyExistsTrader: u64 = 124;
    const EReferAlreadyExistsRefer: u64 = 125;
    const EReferAlreadyExistsCode: u64 = 126;
    const NotReferralCode: u64 = 127;
    const EExcessiveSlippage: u64 = 356;
    /// For when supplied Coin is zero.
    /// The input amount is zero.
    const EZeroInput: u64 = 1;
    /// The pool ID doesn't match the required.
    const EInvalidPoolID: u64 = 2;
    /// There's no liquidity in the pool.
    const ENoLiquidity: u64 = 3;
    /// Fee parameter is not valid.
    const EInvalidFeeParam: u64 = 4;
    /// The provided admin capability doesn't belong to this pool.
    const EInvalidAdminCap: u64 = 5;
    /// Pool pair coin types must be ordered alphabetically (`A` < `B`) and mustn't be equal.
    const EInvalidPair: u64 = 6;
    /// Pool for this pair already exists.
    const EPoolAlreadyExists: u64 = 7;

    const INVALID_USER: u64 = 136;
    const ETOKEN_TIME_LOCK_IS_SOME: u64 = 137;
    const STAKINGLOCK: u64 = 135;

    const INVALIDACS: u64 = 300;

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

    /// Creat a new empty `PoolRegistry`.
    fun new_registry(ctx: &mut TxContext): PoolRegistry {
        PoolRegistry { 
            id: object::new(ctx),
            table: table::new(ctx)
        }
    }

    fun registry_add<A, B>(self: &mut PoolRegistry) {
        let a = type_name::get<A>();
        let b = type_name::get<B>();
        assert!(cmp_type_names(&a, &b) == 0, EInvalidPair);
        
        let item = PoolRegistryItem{ a, b };
        assert!(table::contains(&self.table, item) == false, EPoolAlreadyExists);

        table::add(&mut self.table, item, true)
    }
    /// A shared object to wrapped the test token supply
    struct TestTokenSupply has key {
        id: UID,
        supply_btc: u64,
        supply_eth: u64,
        supply_try: u64
    }

    struct PoolRegistryItem has copy, drop, store  {
        a: TypeName,
        b: TypeName
    }

    struct AdminCap has key, store {
        id: UID,
    }

    /// The capability of the tradeify, used for inidicating 
    /// admin-level operation
    struct SwapCap has key {
        id: UID,
        pool_create_counter: u64,
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

    struct LiquidityEvent has copy, drop {
        // The add liqulity pool id
        pool_id: ID,
        // Whether it is a added/removed liqulity event or remove liquidity event
        is_added: bool,
        // The x amount to added/removed
        x_amount: u64,
        // The y amount to added/removed
        y_amount: u64,
        // The lsp amount to added/removed
        tlp_amount: u64
    }

    struct TLP has drop {}

    /// Pool struct for tradeify
    struct Pool<phantom A, phantom B> has key {
        id: UID,
        balance_a: Balance<A>,
        balance_b: Balance<B>,
        lp_supply: Supply<TLP>,
        /// The liquidity provider fees expressed in basis points (1 bps is 0.01%)
        lp_fee_bps: u64,
        /// Admin fees are calculated as a percentage of liquidity provider fees.
        admin_fee_pct: u64,
        /// Admin fees are deposited into this balance. They can be colleced by
        /// this pool's PoolAdminCap bearer.
        admin_fee_balance: Balance<TLP>
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
        openPosition: u64,
        closePosition: u64,
        totalPosition: u64,
        data: VecMap<OrderRegistryItem, bool>
    }

    // Trading type is 1, 2, 3.  1 = Market      2 = Limit       3 = Stop Market
    // Trading status is 1, 2, 3.   1 = pending     2 = fund        3 = closed

    struct OrderRegistryItem has copy, drop, store {
        trader: ID,
        tradingType: u64,
        hasRefer: u64,
        referID: ID,
        originalTradingAmount: u64,
        pairID: ID,
        leverage: u64,
        marketPrice: u64,
        tradingStatus: u64,
        createdTimeStamp: u64,
    }

    struct PositionCreationEvent has copy, drop {
        trader: ID
    }

    /// Module initializer is empty - to publish a new Pool one has
    /// to create a type which will mark LSPs.
    /// Initializes the `PoolRegistry` objects and shares it, and transfers `AdminCap` to sender.
    fun init(ctx: &mut TxContext) {
        transfer::share_object(new_registry(ctx));
        transfer::transfer(
            AdminCap{ id: object::new(ctx) },
            tx_context::sender(ctx)
        );
        transfer::share_object(
            TestTokenSupply { 
                id: object::new(ctx),
                supply_btc: 0,
                supply_eth: 0,
                supply_try: 0,
            }
        );
        transfer::share_object(new_refer_registry(ctx));
        transfer::share_object(new_refTrader_registry(ctx));
        transfer::share_object(
            ReferralStatus {
                id: object::new(ctx),
                total_refer: 0,
                total_trader: 0
            }
        );
        transfer::share_object(
            TradingPool {
                id: object::new(ctx),
                openPosition: 0,
                closePosition: 0,
                totalPosition: 0,
                data: vec_map::empty(),
            }
        )
    }

    public fun create_long_position<A, B> (
        poolID: &mut Pool<A, B>,
        tradingPoolID: &mut TradingPool,
        marketPrice: u64,
        inputCoinA: Coin<A>,
        inputCoinB: Coin<B>,
        firstCoinAmount: u64,
        secondCoinAmount: u64,
        positionAmount: u64,
        createdTimeStamp: u64,
        leverageValue: u64,
        hasRefer: u64,
        isACS: u64,
        referID: ID,
        tradingType: u64,
        ctx: &mut TxContext
    ) {        
        let trader_id = object::id_from_address(tx_context::sender(ctx));
        let pairID = object::id(poolID);
        let tradingStatus = 1;
        let _tradingAmount = 0;
        if(isACS == 1) {
            _tradingAmount = secondCoinAmount;
        }  else {
            _tradingAmount = firstCoinAmount;
        };
        let balance_A = coin::into_balance(inputCoinA);
        let balance_B = coin::into_balance(inputCoinB);
        let trading_A = balance::value(&balance_A);
        let trading_B = balance::value(&balance_B);

        balance::join(&mut poolID.balance_a, balance_A);
        balance::join(&mut poolID.balance_b, balance_B);
        
        let item = OrderRegistryItem {
            trader: trader_id,
            tradingType: tradingType,
            hasRefer: hasRefer,
            referID: referID,
            originalTradingAmount: _tradingAmount,
            pairID: pairID,
            leverage: leverageValue,
            marketPrice: marketPrice,
            tradingStatus: tradingStatus,
            createdTimeStamp: createdTimeStamp,
        };
        vec_map::insert(&mut tradingPoolID.data, item, true);
        event::emit(PositionCreationEvent {trader: trader_id});
    }

    public entry fun create_long_position_<A, B>(
        poolID: &mut Pool<A, B>,
        tradingPoolID: &mut TradingPool,
        marketPrice: u64,
        inputCoinA: Coin<A>,
        inputCoinB: Coin<B>,
        firstCoinAmount: u64,
        secondCoinAmount: u64,
        positionAmount: u64,
        createdTimeStamp: u64,
        leverageValue: u64,
        hasRefer: u64,
        isACS: u64,
        referAddress: ID,
        tradingType: u64,
        ctx: &mut TxContext
    ) {
        if(isACS == 1) {
            let _tradingAmount = maybe_split_and_transfer_rest(inputCoinA, firstCoinAmount, tx_context::sender(ctx), ctx);
            create_long_position(
                poolID, 
                tradingPoolID,
                marketPrice, 
                _tradingAmount, 
                inputCoinB, 
                firstCoinAmount, 
                secondCoinAmount, 
                positionAmount,
                createdTimeStamp,
                leverageValue,
                hasRefer,
                isACS,
                referAddress,
                tradingType,    
                ctx,
            );
        } else {
            assert!(isACS == 0, INVALIDACS);
            let _tradingAmount = maybe_split_and_transfer_rest(inputCoinB, firstCoinAmount, tx_context::sender(ctx), ctx);
            create_long_position(
                poolID, 
                tradingPoolID,
                marketPrice, 
                inputCoinA, 
                _tradingAmount, 
                firstCoinAmount, 
                secondCoinAmount, 
                positionAmount,
                createdTimeStamp,
                leverageValue,
                hasRefer,
                isACS,
                referAddress,
                tradingType,
                ctx,    
            );
        }
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

    // entry fun init_token_id<T>(c: &mut TreasuryCap<T>,d: &mut TreasuryCap<T>, token_supply: &mut TestTokenSupply) {
    //     token_supply.btc_id = object::uid_to_inner(&c);
    //     token_supply.eth_id = object::uid_to_inner(&c);
    // }
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

    entry fun mint_test_token_btc<T>(c: &mut TreasuryCap<T>, token_supply: &mut TestTokenSupply, amount: u64, recipient: address, ctx: &mut TxContext) {
        // Admin could mint with a amount set for testing usage
        token_supply.supply_btc = token_supply.supply_btc + amount;
        coin::mint_and_transfer<T>(c, amount, recipient, ctx);
    }

    entry fun mint_test_token_eth<T>(c: &mut TreasuryCap<T>, token_supply: &mut TestTokenSupply, amount: u64, recipient: address, ctx: &mut TxContext) {
        // Admin could mint with a amount set for testing usage
        token_supply.supply_eth = token_supply.supply_eth + amount;
        coin::mint_and_transfer<T>(c, amount, recipient, ctx); 
    }
    
    entry fun mint_test_token_try<T>(c: &mut TreasuryCap<T>, token_supply: &mut TestTokenSupply, amount: u64, recipient: address, ctx: &mut TxContext) {
        // Admin could mint with a amount set for testing usage
        token_supply.supply_try = token_supply.supply_try + amount;
        coin::mint_and_transfer<T>(c, amount, recipient, ctx); 
    }

    /// Calclates swap result and fees based on the input amount and current pool state.
    fun calc_swap_result(
        i_value: u64,
        i_pool_value: u64,
        o_pool_value: u64,
        pool_lp_value: u64,
        lp_fee_bps: u64,
        admin_fee_pct: u64
    ): (u64, u64) {
        // calc out value
        let lp_fee_value = ceil_muldiv(i_value, lp_fee_bps, BPS_IN_100_PCT);
        let in_after_lp_fee = i_value - lp_fee_value;
        let out_value = muldiv(in_after_lp_fee, o_pool_value, i_pool_value + in_after_lp_fee);

        // calc admin fee
        let admin_fee_value = muldiv(lp_fee_value, admin_fee_pct, 100);
        // dL = L * sqrt((A + dA) / A) - L = sqrt(L^2(A + dA) / A) - L
        let admin_fee_in_lp = (math::sqrt_u128(
            muldiv_u128(
                (pool_lp_value as u128) * (pool_lp_value as u128),
                ((i_pool_value + i_value) as u128),
                ((i_pool_value + i_value - admin_fee_value) as u128)
            )
        ) as u64) - pool_lp_value;

        (out_value, admin_fee_in_lp)
    }

    public fun create_pool<A, B>(
        registry: &mut PoolRegistry,
        init_a: Balance<A>,
        init_b: Balance<B>,
        lp_fee_bps: u64,
        admin_fee_pct: u64,
        ctx: &mut TxContext,
    ): Balance<TLP> {

        // sanity checks
        assert!(balance::value(&init_a) > 0 && balance::value(&init_b) > 0, EZeroInput);
        assert!(lp_fee_bps < BPS_IN_100_PCT, EInvalidFeeParam);
        assert!(admin_fee_pct <= 100, EInvalidFeeParam);

        // add to registry (guarantees that there's only one pool per currency pair)
        registry_add<A, B>(registry);

        // create pool
        let pool = Pool<A, B> {
            id: object::new(ctx),
            balance_a: init_a,
            balance_b: init_b,
            lp_supply: create_supply(TLP {}),
            lp_fee_bps,
            admin_fee_pct,
            admin_fee_balance: balance::zero<TLP>()
        };

        // mint initial lp tokens
        let lp_amt = mulsqrt(balance::value(&pool.balance_a), balance::value(&pool.balance_b));
        let lp_balance = balance::increase_supply(&mut pool.lp_supply, lp_amt);

        event::emit(PoolCreationEvent { pool_id: object::id(&pool) });
        transfer::share_object(pool);

        lp_balance
    }

    /// Entry function. Creates a new Pool with provided initial balances. Transfers
    /// the initial LP coins to the sender.
    public fun create_pool_<A, B>(
        registry: &mut PoolRegistry,
        init_a: Coin<A>,
        init_b: Coin<B>,
        lp_fee_bps: u64,
        admin_fee_pct: u64,
        ctx: &mut TxContext,
    ) {
        let lp_balance = create_pool(
            registry,
            coin::into_balance(init_a),
            coin::into_balance(init_b),
            lp_fee_bps,
            admin_fee_pct,
            ctx
        );
        transfer::transfer(
            coin::from_balance(lp_balance, ctx),
            tx_context::sender(ctx)
        );
    }

    /// Deposit liquidity into pool. The deposit will use up the maximum amount of
    /// the provided balances possible depending on the current pool ratio. Usually
    /// this means that all of either `input_a` or `input_b` will be fully used, while
    /// the other only partially. Otherwise, both input values will be fully used.
    /// Returns the remaining input amounts (if any) and LPCoin of appropriate value.
    /// Fails if the value of the issued LPCoin is smaller than `min_lp_out`. 
    public fun deposit<A, B>(
        pool: &mut Pool<A, B>,
        input_a: Balance<A>,
        input_b: Balance<B>,
        min_lp_out: u64
    ): (Balance<A>, Balance<B>, Balance<TLP>) {
        // sanity checks
        assert!(balance::value(&input_a) > 0, EZeroInput);
        assert!(balance::value(&input_b) > 0, EZeroInput);

        // calculate the deposit amounts
        let dab: u128 = (balance::value(&input_a) as u128) * (balance::value(&pool.balance_b) as u128);
        let dba: u128 = (balance::value(&input_b) as u128) * (balance::value(&pool.balance_a) as u128);

        let deposit_a: u64;
        let deposit_b: u64;
        let lp_to_issue: u64;
        if (dab > dba) {
            deposit_b = balance::value(&input_b);
            deposit_a = (ceil_div_u128(
                dba,
                (balance::value(&pool.balance_b) as u128),
            ) as u64);
            lp_to_issue = muldiv(
                deposit_b,
                balance::supply_value(&pool.lp_supply),
                balance::value(&pool.balance_b)
            );
        } else if (dab < dba) {
            deposit_a = balance::value(&input_a);
            deposit_b = (ceil_div_u128(
                dab,
                (balance::value(&pool.balance_a) as u128),
            ) as u64);
            lp_to_issue = muldiv(
                deposit_a,
                balance::supply_value(&pool.lp_supply),
                balance::value(&pool.balance_a)
            );
        } else {
            deposit_a = balance::value(&input_a);
            deposit_b = balance::value(&input_b);
            if (balance::supply_value(&pool.lp_supply) == 0) {
                // in this case both pool balances are 0 and lp supply is 0
                lp_to_issue = mulsqrt(deposit_a, deposit_b);
            } else {
                // the ratio of input a and b matches the ratio of pool balances
                lp_to_issue = muldiv(
                    deposit_a,
                    balance::supply_value(&pool.lp_supply),
                    balance::value(&pool.balance_a)
                );
            }
        };

        // deposit amounts into pool 
        balance::join(
            &mut pool.balance_a,
            balance::split(&mut input_a, deposit_a)
        );
        balance::join(
            &mut pool.balance_b,
            balance::split(&mut input_b, deposit_b)
        );

        // mint lp coin
        assert!(lp_to_issue >= min_lp_out, EExcessiveSlippage);
        let lp = balance::increase_supply(&mut pool.lp_supply, lp_to_issue);

        // return
        (input_a, input_b, lp)
    }

    /// Entry function. Deposit liquidity into pool. The deposit will use up the maximum
    /// amount of the provided coins possible depending on the current pool ratio. Usually
    /// this means that all of either `input_a` or `input_b` will be fully used, while
    /// the other only partially. Otherwise, both input values will be fully used.
    /// Transfers the remaining input amounts (if any) and LPCoin of appropriate value
    /// to the sender. Fails if the value of the issued LPCoin is smaller than `min_lp_out`. 
    public fun deposit_<A, B>(
        pool: &mut Pool<A, B>,
        input_a: Coin<A>,
        input_b: Coin<B>,
        min_lp_out: u64,
        ctx: &mut TxContext
    ) {
        let (remaining_a, remaining_b, lp) = deposit(
            pool, coin::into_balance(input_a), coin::into_balance(input_b), min_lp_out
        );

        // transfer the output amounts to the caller (if any)
        let sender = tx_context::sender(ctx);
        destroy_or_transfer_balance(remaining_a, sender, ctx);
        destroy_or_transfer_balance(remaining_b, sender, ctx);
        destroy_or_transfer_balance(lp, sender, ctx);
    }

    public fun withdraw<A, B>(
        pool: &mut Pool<A, B>,
        lp_in: Balance<TLP>,
        min_a_out: u64,
        min_b_out: u64,
    ): (Balance<A>, Balance<B>) {
        // sanity checks
        assert!(balance::value(&lp_in) > 0, EZeroInput);

        // calculate output amounts
        let lp_in_value = balance::value(&lp_in);
        let pool_a_value = balance::value(&pool.balance_a);
        let pool_b_value = balance::value(&pool.balance_b);
        let pool_lp_value = balance::supply_value(&pool.lp_supply);

        let a_out = muldiv(lp_in_value, pool_a_value, pool_lp_value);
        let b_out = muldiv(lp_in_value, pool_b_value, pool_lp_value);
        assert!(a_out >= min_a_out, EExcessiveSlippage);
        assert!(b_out >= min_b_out, EExcessiveSlippage);

        // burn lp tokens
        balance::decrease_supply(&mut pool.lp_supply, lp_in);

        // return amounts
        (
            balance::split(&mut pool.balance_a, a_out),
            balance::split(&mut pool.balance_b, b_out)
        )
    }

    /// Entry function. Burns the provided LPCoin and withdraws corresponding
    /// pool balances. Fails if the withdrawn balances are smaller than
    /// `min_a_out` and `min_b_out` respectively. Transfers the withdrawn balances
    /// to the sender.
    public fun withdraw_<A, B>(
        pool: &mut Pool<A, B>,
        lp_in: Coin<TLP>,
        min_a_out: u64,
        min_b_out: u64,
        ctx: &mut TxContext
    ) {
        let (a_out, b_out) = withdraw(pool, coin::into_balance(lp_in), min_a_out, min_b_out);

        let sender = tx_context::sender(ctx);
        destroy_or_transfer_balance(a_out, sender, ctx);
        destroy_or_transfer_balance(b_out, sender, ctx);
    }

    public fun swap_a<A, B>(
        pool: &mut Pool<A, B>, input: Balance<A>, min_out: u64,
    ): Balance<B> {
        // sanity checks
        assert!(balance::value(&input) > 0, EZeroInput);
        assert!(
            balance::value(&pool.balance_a) > 0 && balance::value(&pool.balance_b) > 0,
            ENoLiquidity
        );

        // calculate swap result
        let i_value = balance::value(&input);
        let i_pool_value = balance::value(&pool.balance_a);
        let o_pool_value = balance::value(&pool.balance_b);
        let pool_lp_value = balance::supply_value(&pool.lp_supply);

        let (out_value, admin_fee_in_lp) = calc_swap_result(
            i_value, i_pool_value, o_pool_value, pool_lp_value, pool.lp_fee_bps, pool.admin_fee_pct
        );

        assert!(out_value >= min_out, EExcessiveSlippage);

        // deposit admin fee
        balance::join(
            &mut pool.admin_fee_balance,
            balance::increase_supply(&mut pool.lp_supply, admin_fee_in_lp)
        );

        // deposit input
        balance::join(&mut pool.balance_a, input);

        // return output
        balance::split(&mut pool.balance_b, out_value)
    }

    /// Entry function. Swaps the provided amount of A for B. Fails if the resulting
    /// amount of B is smaller than `min_out`. Transfers the resulting Coin to the sender.
    public fun swap_a_<A, B>(
        pool: &mut Pool<A, B>, input: Coin<A>, min_out: u64, ctx: &mut TxContext
    ) {
        let out = swap_a(pool, coin::into_balance(input), min_out);
        destroy_or_transfer_balance(out, tx_context::sender(ctx), ctx);
    }

    public fun swap_b<A, B>(
        pool: &mut Pool<A, B>, input: Balance<B>, min_out: u64
    ): Balance<A> {
        // sanity checks
        assert!(balance::value(&input) > 0, EZeroInput);
        assert!(
            balance::value(&pool.balance_a) > 0 && balance::value(&pool.balance_b) > 0,
            ENoLiquidity
        );

        // calculate swap result
        let i_value = balance::value(&input);
        let i_pool_value = balance::value(&pool.balance_b);
        let o_pool_value = balance::value(&pool.balance_a);
        let pool_lp_value = balance::supply_value(&pool.lp_supply);

        let (out_value, admin_fee_in_lp) = calc_swap_result(
            i_value, i_pool_value, o_pool_value, pool_lp_value, pool.lp_fee_bps, pool.admin_fee_pct
        );

        assert!(out_value >= min_out, EExcessiveSlippage);

        // deposit admin fee
        balance::join(
            &mut pool.admin_fee_balance,
            balance::increase_supply(&mut pool.lp_supply, admin_fee_in_lp)
        );

        // deposit input
        balance::join(&mut pool.balance_b, input);

        // return output
        balance::split(&mut pool.balance_a, out_value)
    }

    /// Entry function. Swaps the provided amount of B for A. Fails if the resulting
    /// amount of A is smaller than `min_out`. Transfers the resulting Coin to the sender.
    public fun swap_b_<A, B>(
        pool: &mut Pool<A, B>, input: Coin<B>, min_out: u64, ctx: &mut TxContext
    ) {
        let out = swap_b(pool, coin::into_balance(input), min_out);
        destroy_or_transfer_balance(out, tx_context::sender(ctx), ctx);
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

    /// Splits the input Coins to desired values and then does the pool creation. Returns the remainders
    /// to the sender (if any).
    public entry fun maybe_split_then_create_pool<A, B>(
        registry: &mut PoolRegistry,
        input_a: Coin<A>,
        amount_a: u64,
        input_b: Coin<B>,
        amount_b: u64,
        lp_fee_bps: u64,
        admin_fee_pct: u64,
        ctx: &mut TxContext
    ) {
        let init_a = maybe_split_and_transfer_rest(input_a, amount_a, tx_context::sender(ctx), ctx);
        let init_b = maybe_split_and_transfer_rest(input_b, amount_b, tx_context::sender(ctx), ctx);
        create_pool_(registry, init_a, init_b, lp_fee_bps, admin_fee_pct, ctx);
    }
    public entry fun maybe_split_then_deposit<A, B>(
        pool: &mut Pool<A, B>,
        input_a: Coin<A>,
        amount_a: u64,
        input_b: Coin<B>,
        amount_b: u64,
        min_lp_out: u64,
        ctx: &mut TxContext
    ) {
        let input_a = maybe_split_and_transfer_rest(input_a, amount_a, tx_context::sender(ctx), ctx);
        let input_b = maybe_split_and_transfer_rest(input_b, amount_b, tx_context::sender(ctx), ctx);
        deposit_(pool, input_a, input_b, min_lp_out, ctx);
    }
    public entry fun maybe_split_then_withdraw<A, B>(
        pool: &mut Pool<A, B>,
        lp_in: Coin<TLP>,
        amount: u64,
        min_a_out: u64,
        min_b_out: u64,
        ctx: &mut TxContext
    ) {
        let input_lp = maybe_split_and_transfer_rest(lp_in, amount, tx_context::sender(ctx), ctx);
        withdraw_(pool, input_lp, min_a_out, min_b_out, ctx);
    }

    public entry fun maybe_split_then_swap_a<A, B>(
        pool: &mut Pool<A, B>, input: Coin<A>, amount: u64, min_out: u64, ctx: &mut TxContext
    ) {
        let input = maybe_split_and_transfer_rest(input, amount, tx_context::sender(ctx), ctx);
        swap_a_(pool, input, min_out, ctx);
    }

    public entry fun maybe_split_then_swap_b<A, B>(
        pool: &mut Pool<A, B>, input: Coin<B>, amount: u64, min_out: u64, ctx: &mut TxContext
    ) {
        let input = maybe_split_and_transfer_rest(input, amount, tx_context::sender(ctx), ctx);
        swap_b_(pool, input, min_out, ctx);
    }

    
    public fun create_staking_pool<A, B>(
        init_a: Coin<A>,
        init_b: Coin<B>,
        stake_fee: u64,
        ctx: &mut TxContext
    ) {
        let staking_pool = StakingPool<A,B> {
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
        let out_amount = balance::split(&mut staking_pool.balance_tlp, (user_stake.staking_amount - user_stake.staking_amount * staking_pool.stake_fee / 100));
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
}