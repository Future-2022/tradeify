module tradeifys::pool {
    use sui::object::{Self, UID, ID};
    use sui::coin::{Self, Coin, TreasuryCap};
    use sui::balance::{Self, Balance, Supply};
    use sui::transfer;
    use sui::math;
    use sui::event;
    use sui::tx_context::{Self, TxContext};

    /// For when supplied Coin is zero.
    const EInvalidParameter: u64 = 13400;
    /// For when pool fee is set incorrectly.  Allowed values are: [0-10000)
    const EWrongFee: u64 = 134001;
    /// For when someone tries to swap in an empty pool.
    const EReservesEmpty: u64 = 1340;
    /// For when initial LSP amount is zero.02
    const EShareEmpty: u64 = 13400;
    /// For when someone attemps to add more liquidity than u128 Math allows.3
    const EPoolFull: u64 = 134004;
    /// For when the internal operation overflow.
    const EOperationOverflow: u64 = 134005;
    /// For when some intrinsic computation error detects
    const EComputationError: u64 = 134006;
    /// Can not operate this operation
    const EPermissionDenied: u64 = 134007;
    /// Not enough balance for operation
    const ENotEnoughBalance: u64 = 134008;
    /// Not coin registed [NOT AVALIABLE]
    const ECoinNotRegister: u64 = 134009;
    /// Pool freezes for operation
    const EPoolFreeze: u64 = 134009;
    /// Slippage limit error
    const ESlippageLimit: u64 = 134010;

    /// The integer scaling setting for fees calculation.
    const BPS_SCALING: u128 = 10000;
    /// The maximum number of u64
    const U64_MAX: u128 = 18446744073709551615;
    

    /// A shared object to wrapped the test token supply
    struct TestTokenSupply has key {
        id: UID,
        supply_btc: u64,
        supply_eth: u64,
        btc_id: UID,
        eth_id: UID
    }

    /// The capability of the Suiswap, used for inidicating 
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

    struct PoolCreateEvent has copy, drop {
        pool_id: ID
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
        lsp_amount: u64
    }

    struct LSP<phantom X, phantom Y> has drop {}

    /// Pool struct for Suiswap
    struct Pool<phantom X, phantom Y> has key {
        id: UID,
        /// The index of the pool
        index: u64,
        /// The balance of X token in the pool
        x: Balance<X>,
        /// The balance of token in the pool
        y: Balance<Y>,
        /// The balance of X that admin collects
        x_admin: Balance<X>,
        /// The balance of token that admin collects
        y_admin: Balance<Y>,
        /// The pool lsp supply
        lsp_supply: Supply<LSP<X, Y>>,
        /// Admin fee is denominated in basis points, in bps
        admin_fee: u64,
        /// Liqudity fee is denominated in basis points, in bps
        lp_fee: u64,
        /// Whether the pool is freezed for swapping and adding liquidity
        freeze: bool
    }

    /// Module initializer is empty - to publish a new Pool one has
    /// to create a type which will mark LSPs.
    fun init(ctx: &mut TxContext) {
        init_impl(ctx);
    }

    fun init_impl(ctx: &mut TxContext) {
        transfer::transfer(
            SwapCap { 
                id: object::new(ctx),
                pool_create_counter: 0,
            }, 
            tx_context::sender(ctx)
        );

        transfer::share_object(
            TestTokenSupply { 
                id: object::new(ctx),
                btc_id: object::new(ctx),
                supply_btc: 0,
                eth_id: object::new(ctx),
                supply_eth: 0
            }
        );
    }
    // entry fun init_token_id<T>(c: &mut TreasuryCap<T>,d: &mut TreasuryCap<T>, token_supply: &mut TestTokenSupply) {
    //     token_supply.btc_id = object::uid_to_inner(&c);
    //     token_supply.eth_id = object::uid_to_inner(&c);
    // }

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

    entry fun create_pool<X, Y>(cap: &mut SwapCap, admin_fee: u64, lp_fee: u64, ctx: &mut TxContext) {
        do_create_pool<X, Y>(cap, admin_fee, lp_fee, ctx);
    }
    entry fun add_liquidity<X, Y>(pool: &mut Pool<X, Y>, x: Coin<X>, y: Coin<Y>, in_x_amount: u64, in_y_amount: u64, ctx: &mut TxContext) {
        do_add_liquidity(pool, x, y, in_x_amount, in_y_amount, ctx);
    }
    fun do_create_pool<X, Y>(cap: &mut SwapCap, admin_fee: u64, lp_fee: u64, ctx: &mut TxContext) {

        assert!(lp_fee >= 0, EWrongFee);
        assert!(admin_fee >= 0, EWrongFee);
        assert!(lp_fee + admin_fee < (BPS_SCALING as u64), EWrongFee);

        // Initial share of LSP is the sqrt(a) * sqrt(b)
        let lsp_supply = balance::create_supply(LSP<X, Y> {});
        let pool_uid = object::new(ctx);

        let pool_id = object::uid_to_inner(&pool_uid);
        transfer::share_object(
            Pool {
                id: pool_uid,
                index: cap.pool_create_counter,
                x: balance::zero(),
                y: balance::zero(),
                x_admin: balance::zero(),
                y_admin: balance::zero(),
                lsp_supply: lsp_supply,
                admin_fee: admin_fee,
                lp_fee: lp_fee,
                freeze: false
            }
        );
        cap.pool_create_counter = cap.pool_create_counter + 1;

        // Transfer the pool create info to the user
        transfer::transfer(
            PoolCreateInfo {
                id: object::new(ctx),
                pool_id: pool_id
            },
            tx_context::sender(ctx)
        );

        // Emit the pool create event
        event::emit(PoolCreateEvent {
            pool_id: pool_id
        });
    }
    public fun get_amounts<X, Y>(pool: &Pool<X, Y>): (u64, u64, u64) {
        (
            balance::value(&pool.x),
            balance::value(&pool.y),
            balance::supply_value(&pool.lsp_supply),
        )
    }
    fun do_add_liquidity<X, Y>(pool: &mut Pool<X, Y>, x: Coin<X>, y: Coin<Y>, in_x_amount: u64, in_y_amount: u64, ctx: &mut TxContext) {
        assert!(coin::value(&x) >= in_x_amount && in_x_amount > 0, EInvalidParameter);
        assert!(coin::value(&y) >= in_y_amount && in_y_amount > 0, EInvalidParameter);
        assert!(pool.freeze == false, EPoolFreeze);

        let pool_id = object::uid_to_inner(&pool.id);
        let x_added = in_x_amount;
        let y_added = in_y_amount;

        let x_balance_ori = coin::into_balance(x);
        let y_balance_ori = coin::into_balance(y);
        let x_blance = balance::split(&mut x_balance_ori, x_added);
        let y_balance = balance::split(&mut y_balance_ori, y_added);

        let (x_amt, y_amt, lsp_supply) = get_amounts(pool);
        let share_minted = if (lsp_supply > 0) {
            let x_shared_minted: u128 = ((x_added as u128) * (lsp_supply as u128)) / (x_amt as u128);
            let y_shared_minted: u128 = ((y_added as u128) * (lsp_supply as u128)) / (y_amt as u128);
            let share_minted: u128 = if (x_shared_minted < y_shared_minted) { x_shared_minted } else { y_shared_minted };
            let share_minted: u64 = (share_minted as u64);
            share_minted
        } else {
            // When it is a initialzed deposit, we compute using sqrt(x_added) * sqrt(y_added)
            let share_minted: u64 = math::sqrt(x_added) * math::sqrt(y_added);
            share_minted
        };

        let _ = balance::join(&mut pool.x, x_blance);
        let _ = balance::join(&mut pool.y, y_balance);
        let lsp_coin = coin::from_balance(
            balance::increase_supply(&mut pool.lsp_supply, share_minted), 
            ctx
        );
        
        // Check:
        // x_amt / lsp_supply <= x_amt_after / lsp_supply_after
        //    ==> x_amt * lsp_supply_after <= x_amt_after * lsp_supply
        let (x_amt_after, y_amt_after, lsp_supply_after) = get_amounts(pool); {
            let x_amt_ = (x_amt as u128);
            let y_amt_ = (y_amt as u128);
            let lsp_supply_ = (lsp_supply as u128);
            let x_amt_after_ = (x_amt_after as u128);
            let y_amt_after_ = (y_amt_after as u128);
            let lsp_supply_after_ = (lsp_supply_after as u128);
            assert!(x_amt_ * lsp_supply_after_ <= x_amt_after_ * lsp_supply_, EComputationError);
            assert!(y_amt_ * lsp_supply_after_ <= y_amt_after_ * lsp_supply_, EComputationError);
        };

        transfer::transfer(
            lsp_coin,
            tx_context::sender(ctx)
        );

        // Transfer back or destroy x coin
        let cx = coin::from_balance(x_balance_ori, ctx);
        if (coin::value(&cx) > 0) { 
            transfer::transfer(cx, tx_context::sender(ctx)); 
        } else {
            coin::destroy_zero(cx);
        };

        // Transfer back or destroy y coin
        let cy = coin::from_balance(y_balance_ori, ctx);
        if (coin::value(&cy) > 0) {
            transfer::transfer(cy, tx_context::sender(ctx));
        } else {
            coin::destroy_zero(cy);
        };


        event::emit(LiquidityEvent {
            pool_id: pool_id,
            is_added: true,
            x_amount: x_added,
            y_amount: y_added,
            lsp_amount: share_minted
        });
    }
}