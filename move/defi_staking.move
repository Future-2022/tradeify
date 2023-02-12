module staking::staking {
    use sui::object::{Self, UID, ID};
    use sui::coin::{Self, Coin, TreasuryCap};
    use sui::balance::{Self, Balance, Supply, create_supply};
    use sui::transfer;
    use sui::math;
    use sui::staking_pool;
    use sui::locked_coin;
    use sui::event;
    use sui::epoch_time_lock::{Self, EpochTimeLock, new, epoch};   
    use sui::tx_context::{Self, TxContext};
    use sui::table::{Self, Table};
    use std::type_name::{Self, TypeName};
    use std::vector; 
    use std::option::{Self, Option};

    /// The number of basis points in 100%.
    const BPS_IN_100_PCT: u64 = 100 * 100;  
    const INVALID_USER: u64 = 136;
    const EDESTROY_NON_ZERO_BALANCE: u64 = 5;
    const EINSUFFICIENT_POOL_TOKEN_BALANCE: u64 = 0;
    const EINSUFFICIENT_REWARDS_POOL_BALANCE: u64 = 4;
    const EINSUFFICIENT_SUI_TOKEN_BALANCE: u64 = 3;
    const EPENDING_DELEGATION_DOES_NOT_EXIST: u64 = 8;    
    const ETOKEN_TIME_LOCK_IS_SOME: u64 = 6;
    const EWITHDRAW_AMOUNT_CANNOT_BE_ZERO: u64 = 2;
    const EWRONG_DELEGATION: u64 = 7;
    const STAKINGLOCK: u64 = 125;
    const EWRONG_POOL: u64 = 1;

    const EEpochAlreadyPassed: u64 = 0;
    const EEpochNotYetEnded: u64 = 1;
    
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
}