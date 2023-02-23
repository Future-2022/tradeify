module referral::referral {
    use sui::object::{Self, UID, ID};
    use sui::coin::{Self, Coin, TreasuryCap};
    use sui::balance::{Self, Balance, Supply, create_supply};
    use sui::transfer;
    use sui::math;
    use sui::event;
    use sui::vec_map::{Self, VecMap};
    use sui::tx_context::{Self, TxContext};
    use sui::table::{Self, Table};
    use std::type_name::{Self, TypeName};

    const ETableNotEmpty: u64 = 0;
    const EReferAlreadyExistsTrader: u64 = 124;
    const EReferAlreadyExistsRefer: u64 = 125;
    const EReferAlreadyExistsCode: u64 = 126;
    const NotReferralCode: u64 = 127;

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
    //
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
                };
            };
            j = j + 1;
        };
        assert!(isReferFlag == true, NotReferralCode);
        vec_map::insert(&mut refTrader_registry.data, item, true);
    }

    fun init(ctx: &mut TxContext) {
        transfer::share_object(new_refer_registry(ctx));
        transfer::share_object(new_refTrader_registry(ctx));
        transfer::share_object(
            ReferralStatus {
                id: object::new(ctx),
                total_refer: 0,
                total_trader: 0
            }
        )
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