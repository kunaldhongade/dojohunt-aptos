module dojohunt::dojohunt_token {
    use std::signer;
    use std::error;
    use std::string::{Self, String};
    use aptos_framework::coin;
    use aptos_framework::managed_coin;

    /// Declare the coin type
    struct DojoHuntCoin has drop {}

    /// Token metadata
    struct TokenMetadata has key {
        name: String,
        symbol: String,
        decimals: u8,
        logo_uri: String,
        website: String,
        description: String,
        metadata_uri: String,
        twitter: String,
        discord: String,
        telegram: String,
        github: String,
        documentation: String,
    }

    /// Owner capabilities
    struct OwnerCapability has key {}

    /// Initialize the token module (called automatically on deployment)
    fun init_module(deployer: &signer) {
        // Store owner capability
        move_to(deployer, OwnerCapability {});
    }

    /// Initialize the token (must be called by owner after deployment)
    public entry fun initialize_token(
        owner: &signer,
        name: vector<u8>,
        symbol: vector<u8>,
        decimals: u8,
        logo_uri: vector<u8>,
        website: vector<u8>,
        description: vector<u8>,
    ) {
        assert!(
            exists<OwnerCapability>(signer::address_of(owner)),
            error::permission_denied(1)
        );

        // Check if already initialized
        assert!(
            !exists<TokenMetadata>(@dojohunt),
            error::already_exists(2)
        );

        // Initialize the coin
        managed_coin::initialize<DojoHuntCoin>(
            owner,
            name,
            symbol,
            decimals,
            false, // freeze not supported
        );

        // Store metadata
        move_to(
            owner,
            TokenMetadata {
                name: string::utf8(name),
                symbol: string::utf8(symbol),
                decimals,
                logo_uri: string::utf8(logo_uri),
                website: string::utf8(website),
                description: string::utf8(description),
                metadata_uri: string::utf8(b""),
                twitter: string::utf8(b""),
                discord: string::utf8(b""),
                telegram: string::utf8(b""),
                github: string::utf8(b""),
                documentation: string::utf8(b""),
            }
        );
    }

    /// Mint tokens to an address (owner only)
    public entry fun mint(
        owner: &signer,
        to: address,
        amount: u64,
    ) {
        assert!(exists<OwnerCapability>(signer::address_of(owner)), 1);
        managed_coin::mint<DojoHuntCoin>(owner, to, amount);
    }

    /// Burn tokens from an address
    public entry fun burn(
        account: &signer,
        amount: u64,
    ) {
        let coins = coin::withdraw<DojoHuntCoin>(account, amount);
        coin::destroy_zero(coins);
    }

    /// Update logo URI
    public entry fun set_logo_uri(
        owner: &signer,
        logo_uri: vector<u8>,
    ) acquires TokenMetadata {
        assert!(exists<OwnerCapability>(signer::address_of(owner)), 1);
        let metadata = borrow_global_mut<TokenMetadata>(@dojohunt);
        metadata.logo_uri = string::utf8(logo_uri);
    }

    /// Update website
    public entry fun set_website(
        owner: &signer,
        website: vector<u8>,
    ) acquires TokenMetadata {
        assert!(exists<OwnerCapability>(signer::address_of(owner)), 1);
        let metadata = borrow_global_mut<TokenMetadata>(@dojohunt);
        metadata.website = string::utf8(website);
    }

    /// Update description
    public entry fun set_description(
        owner: &signer,
        description: vector<u8>,
    ) acquires TokenMetadata {
        assert!(exists<OwnerCapability>(signer::address_of(owner)), 1);
        let metadata = borrow_global_mut<TokenMetadata>(@dojohunt);
        metadata.description = string::utf8(description);
    }

    /// Update metadata URI
    public entry fun set_metadata_uri(
        owner: &signer,
        metadata_uri: vector<u8>,
    ) acquires TokenMetadata {
        assert!(exists<OwnerCapability>(signer::address_of(owner)), 1);
        let metadata = borrow_global_mut<TokenMetadata>(@dojohunt);
        metadata.metadata_uri = string::utf8(metadata_uri);
    }

    /// Update social links
    public entry fun set_social_links(
        owner: &signer,
        twitter: vector<u8>,
        discord: vector<u8>,
        telegram: vector<u8>,
        github: vector<u8>,
    ) acquires TokenMetadata {
        assert!(exists<OwnerCapability>(signer::address_of(owner)), 1);
        let metadata = borrow_global_mut<TokenMetadata>(@dojohunt);
        metadata.twitter = string::utf8(twitter);
        metadata.discord = string::utf8(discord);
        metadata.telegram = string::utf8(telegram);
        metadata.github = string::utf8(github);
    }

    /// Update documentation
    public entry fun set_documentation(
        owner: &signer,
        documentation: vector<u8>,
    ) acquires TokenMetadata {
        assert!(exists<OwnerCapability>(signer::address_of(owner)), 1);
        let metadata = borrow_global_mut<TokenMetadata>(@dojohunt);
        metadata.documentation = string::utf8(documentation);
    }

    /// Get metadata
    #[view]
    public fun get_metadata(): (
        String,
        String,
        u8,
        String,
        String,
        String,
        String,
        String,
        String,
        String,
        String,
        String,
    ) acquires TokenMetadata {
        let metadata = borrow_global<TokenMetadata>(@dojohunt);
        (
            metadata.name,
            metadata.symbol,
            metadata.decimals,
            metadata.logo_uri,
            metadata.website,
            metadata.description,
            metadata.metadata_uri,
            metadata.twitter,
            metadata.discord,
            metadata.telegram,
            metadata.github,
            metadata.documentation,
        )
    }

    /// Get balance
    public fun balance_of(addr: address): u64 {
        coin::balance<DojoHuntCoin>(addr)
    }

    /// Transfer coins
    public entry fun transfer(
        from: &signer,
        to: address,
        amount: u64,
    ) {
        coin::transfer<DojoHuntCoin>(from, to, amount);
    }
}

