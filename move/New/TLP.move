module trading::tlp {  
    use std::option;
    use sui::object::{Self, UID};
    use sui::tx_context::{TxContext};
    use sui::balance::{Self, Supply};
    use sui::transfer;
    use sui::coin::{Self, Coin};
    use sui::url;

    friend trading::pool;
    struct TLP has drop {}

    struct TLPStorage has key {
        id: UID,
        supply: Supply<TLP>
    }
    
    fun init(witness: TLP, ctx: &mut TxContext) {
        // Create the IPX governance token with 9 decimals
        let (treasury, metadata) = coin::create_currency<TLP>(
            witness, 
            9,
            b"TLP",
            b"Tradeify LP Token",
            b"The governance token of Tradeify LP",
            option::none(),
            ctx
        );
        // Transform the treasury_cap into a supply struct to allow this contract to mint/burn DNR
        let supply = coin::treasury_into_supply(treasury);
  
        transfer::share_object(
            TLPStorage {
                id: object::new(ctx),
                supply
            }
        );
    
        // Freeze the metadata object
        transfer::freeze_object(metadata);
    }

    public(friend) fun mint(storage: &mut TLPStorage, value: u64, ctx: &mut TxContext): Coin<TLP> {
        coin::from_balance(balance::increase_supply(&mut storage.supply, value), ctx)
    }
    
    public(friend) fun burn(storage: &mut TLPStorage, coin_dnr: Coin<TLP>): u64 {
        balance::decrease_supply(&mut storage.supply, coin::into_balance(coin_dnr))
    }
    
    public(friend) fun transfer(c: coin::Coin<TLP>, recipient: address) {
        transfer::transfer(c, recipient);
    }    
}