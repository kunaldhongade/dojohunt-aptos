module dojohunt::dojohunt_staking {
    use std::signer;
    use std::error;
    use std::option::{Self, Option};
    use aptos_framework::coin;
    use aptos_framework::timestamp;
    use aptos_framework::account;
    use aptos_framework::account::SignerCapability;
    use dojohunt::dojohunt_token::DojoHuntCoin;

    /// Constants
    const MIN_STAKING_PERIOD_SECONDS: u64 = 86400; // 1 day minimum
    const MAX_STAKING_PERIOD_SECONDS: u64 = 7776000; // 90 days maximum
    const CHALLENGES_REQUIRED: u64 = 5;
    const EARLY_UNSTAKE_FEE_PERCENT: u64 = 5;
    const FEE_DENOMINATOR: u64 = 100;

    /// Errors
    const E_NO_ACTIVE_STAKE: u64 = 1;
    const E_STAKE_ALREADY_EXISTS: u64 = 2;
    const E_STAKING_PERIOD_EXPIRED: u64 = 3;
    const E_CHALLENGE_ALREADY_COMPLETED: u64 = 4;
    const E_INVALID_AMOUNT: u64 = 5;
    const E_NOT_OWNER: u64 = 6;
    const E_NO_FEES: u64 = 7;
    const E_INVALID_PERIOD: u64 = 8;

    /// Stake information
    struct Stake has store, drop {
        amount: u64,
        start_time: u64,
        end_time: u64,
        challenges_completed: u64,
        is_active: bool,
    }

    /// Stake info for view functions (return type)
    struct StakeInfo has copy, drop {
        wallet_address: address,
        amount: u64,
        start_time: u64,
        end_time: u64,
        challenges_completed: u64,
        is_active: bool,
    }

    /// Challenge completion tracking
    struct ChallengeCompletions has key {
        completions: std::table::Table<u64, bool>,
    }

    /// Staking pool state
    struct StakingPool has key {
        stakes: std::table::Table<address, Stake>,
        total_staked: u64,
        total_fees: u64,
        owner: address,
        signer_cap: Option<SignerCapability>,
        resource_addr: address,
    }

    /// Owner capability
    struct OwnerCapability has key {}

    /// Initialize the staking module
    fun init_module(deployer: &signer) {
        let deployer_addr = signer::address_of(deployer);
        
        move_to(
            deployer,
            StakingPool {
                stakes: std::table::new(),
                total_staked: 0,
                total_fees: 0,
                owner: deployer_addr,
                signer_cap: option::none(),
                resource_addr: @dojohunt, // Temporary, will be set by setup_resource_account
            }
        );

        move_to(deployer, OwnerCapability {});
    }

    /// Setup resource account (must be called by owner after deployment)
    public entry fun setup_resource_account(owner: &signer) acquires StakingPool {
        assert!(
            exists<OwnerCapability>(signer::address_of(owner)),
            error::permission_denied(E_NOT_OWNER)
        );

        let pool = borrow_global_mut<StakingPool>(@dojohunt);
        assert!(option::is_none(&pool.signer_cap), error::invalid_state(E_STAKE_ALREADY_EXISTS));

        // Create resource account
        let (resource_signer, signer_cap) = account::create_resource_account(owner, b"dojohunt_staking");
        let resource_addr = signer::address_of(&resource_signer);

        pool.signer_cap = option::some(signer_cap);
        pool.resource_addr = resource_addr;
    }

    /// Stake tokens with custom period
    public entry fun stake(
        user: &signer,
        amount: u64,
        period_seconds: u64,
    ) acquires StakingPool {
        let pool = borrow_global_mut<StakingPool>(@dojohunt);
        let user_addr = signer::address_of(user);
        
        assert!(amount > 0, error::invalid_argument(E_INVALID_AMOUNT));
        
        // Validate staking period
        assert!(
            period_seconds >= MIN_STAKING_PERIOD_SECONDS && period_seconds <= MAX_STAKING_PERIOD_SECONDS,
            error::invalid_argument(E_INVALID_PERIOD)
        );
        
        // Check if user already has an active stake
        assert!(
            !std::table::contains(&pool.stakes, user_addr) || 
            !std::table::borrow(&pool.stakes, user_addr).is_active,
            error::already_exists(E_STAKE_ALREADY_EXISTS)
        );

        // Transfer tokens from user to resource account
        assert!(option::is_some(&pool.signer_cap), error::invalid_state(E_STAKE_ALREADY_EXISTS));
        coin::transfer<DojoHuntCoin>(user, pool.resource_addr, amount);

        // Remove old stake if exists
        if (std::table::contains(&pool.stakes, user_addr)) {
            std::table::remove(&mut pool.stakes, user_addr);
        };

        let current_time = timestamp::now_seconds();
        let end_time = current_time + period_seconds;

        // Create new stake
        std::table::add(
            &mut pool.stakes,
            user_addr,
            Stake {
                amount,
                start_time: current_time,
                end_time,
                challenges_completed: 0,
                is_active: true,
            }
        );

        pool.total_staked = pool.total_staked + amount;
    }

    /// Unstake tokens
    public entry fun unstake(
        user: &signer,
    ) acquires StakingPool {
        let pool = borrow_global_mut<StakingPool>(@dojohunt);
        let user_addr = signer::address_of(user);
        
        assert!(
            std::table::contains(&pool.stakes, user_addr),
            error::not_found(E_NO_ACTIVE_STAKE)
        );

        let stake_ref = std::table::borrow_mut(&mut pool.stakes, user_addr);
        assert!(stake_ref.is_active, error::not_found(E_NO_ACTIVE_STAKE));

        let amount = stake_ref.amount;
        let challenges_completed = stake_ref.challenges_completed;
        let completed = challenges_completed >= CHALLENGES_REQUIRED;

        let fee = 0;
        if (!completed) {
            fee = (amount * EARLY_UNSTAKE_FEE_PERCENT) / FEE_DENOMINATOR;
            pool.total_fees = pool.total_fees + fee;
        };

        let return_amount = amount - fee;

        // Mark stake as inactive
        stake_ref.is_active = false;
        pool.total_staked = pool.total_staked - amount;

        // Transfer tokens back to user from resource account
        let signer_cap_ref = option::borrow(&pool.signer_cap);
        let resource_signer = account::create_signer_with_capability(signer_cap_ref);
        coin::transfer<DojoHuntCoin>(&resource_signer, user_addr, return_amount);
    }

    /// Complete a challenge
    public entry fun complete_challenge(
        user: &signer,
        challenge_id: u64,
    ) acquires StakingPool, ChallengeCompletions {
        let pool = borrow_global_mut<StakingPool>(@dojohunt);
        let user_addr = signer::address_of(user);
        
        assert!(
            std::table::contains(&pool.stakes, user_addr),
            error::not_found(E_NO_ACTIVE_STAKE)
        );

        let stake_ref = std::table::borrow_mut(&mut pool.stakes, user_addr);
        assert!(stake_ref.is_active, error::not_found(E_NO_ACTIVE_STAKE));

        let current_time = timestamp::now_seconds();
        assert!(
            current_time <= stake_ref.end_time,
            error::invalid_state(E_STAKING_PERIOD_EXPIRED)
        );

        // Initialize challenge completions if needed
        if (!exists<ChallengeCompletions>(user_addr)) {
            move_to(
                user,
                ChallengeCompletions {
                    completions: std::table::new(),
                }
            );
        };

        let completions = borrow_global_mut<ChallengeCompletions>(user_addr);
        
        // Check if challenge already completed
        if (std::table::contains(&completions.completions, challenge_id)) {
            if (*std::table::borrow(&completions.completions, challenge_id)) {
                return // Already completed
            }
        };

        // Mark challenge as completed
        if (!std::table::contains(&completions.completions, challenge_id)) {
            std::table::add(&mut completions.completions, challenge_id, true);
        } else {
            *std::table::borrow_mut(&mut completions.completions, challenge_id) = true;
        };

        stake_ref.challenges_completed = stake_ref.challenges_completed + 1;
    }

    /// Batch complete challenges
    public entry fun complete_challenges(
        user: &signer,
        challenge_ids: vector<u64>,
    ) acquires StakingPool, ChallengeCompletions {
        let pool = borrow_global_mut<StakingPool>(@dojohunt);
        let user_addr = signer::address_of(user);
        
        assert!(
            std::table::contains(&pool.stakes, user_addr),
            error::not_found(E_NO_ACTIVE_STAKE)
        );

        let stake_ref = std::table::borrow_mut(&mut pool.stakes, user_addr);
        assert!(stake_ref.is_active, error::not_found(E_NO_ACTIVE_STAKE));

        let current_time = timestamp::now_seconds();
        assert!(
            current_time <= stake_ref.end_time,
            error::invalid_state(E_STAKING_PERIOD_EXPIRED)
        );

        // Initialize challenge completions if needed
        if (!exists<ChallengeCompletions>(user_addr)) {
            move_to(
                user,
                ChallengeCompletions {
                    completions: std::table::new(),
                }
            );
        };

        let completions = borrow_global_mut<ChallengeCompletions>(user_addr);
        let len = std::vector::length(&challenge_ids);
        let i = 0;

        while (i < len) {
            let challenge_id = *std::vector::borrow(&challenge_ids, i);
            
            // Check if already completed
            if (!std::table::contains(&completions.completions, challenge_id) ||
                !*std::table::borrow(&completions.completions, challenge_id)) {
                
                if (!std::table::contains(&completions.completions, challenge_id)) {
                    std::table::add(&mut completions.completions, challenge_id, true);
                } else {
                    *std::table::borrow_mut(&mut completions.completions, challenge_id) = true;
                };
                
                stake_ref.challenges_completed = stake_ref.challenges_completed + 1;
            };
            
            i = i + 1;
        };
    }


    /// Get stake information
   #[view]
    public fun get_stake(
        user: address,
    ): (u64, u64, u64, bool, u64, u64) acquires StakingPool {
        let pool = borrow_global<StakingPool>(@dojohunt);
        if (!std::table::contains(&pool.stakes, user)) {
            return (0, 0, 0, false, 0, CHALLENGES_REQUIRED)
        };

        let stake_ref = std::table::borrow(&pool.stakes, user);
        (
            stake_ref.amount,
            stake_ref.start_time,
            stake_ref.end_time,
            stake_ref.is_active,
            stake_ref.challenges_completed,
            CHALLENGES_REQUIRED,
        )
    }

    /// Check if challenge is completed
    public fun is_challenge_completed(
        user: address,
        challenge_id: u64,
    ): bool acquires ChallengeCompletions {
        if (!exists<ChallengeCompletions>(user)) {
            return false
        };

        let completions = borrow_global<ChallengeCompletions>(user);
        if (!std::table::contains(&completions.completions, challenge_id)) {
            return false
        };

        *std::table::borrow(&completions.completions, challenge_id)
    }

    /// Get contract balance
 #[view]
    public fun get_contract_balance(): u64 acquires StakingPool {
        let pool = borrow_global<StakingPool>(@dojohunt);
        if (option::is_some(&pool.signer_cap)) {
            coin::balance<DojoHuntCoin>(pool.resource_addr)
        } else {
            0
        }
    }

    /// Get all active stakes (returns vector of StakeInfo)
    /// Note: Without staker_addresses tracking, this returns empty vector
    /// Use get_stake(address) for individual stake queries
     #[view]
    public fun get_all_active_stakes(): vector<StakeInfo> {
        // Cannot iterate over Table without keys, return empty vector
        std::vector::empty<StakeInfo>()
    }

    /// Get all stakes including inactive (returns vector of StakeInfo)
    /// Note: Without staker_addresses tracking, this returns empty vector
    /// Use get_stake(address) for individual stake queries
     #[view]
    public fun get_all_stakes(): vector<StakeInfo> {
        // Cannot iterate over Table without keys, return empty vector
        std::vector::empty<StakeInfo>()
    }

    /// Get all addresses that have stakes
    /// Note: Without staker_addresses tracking, this returns empty vector
     #[view]
    public fun get_all_stakers(): vector<address> {
        // Cannot iterate over Table without keys, return empty vector
        std::vector::empty<address>()
    }

    /// Get pool statistics
     #[view]
    public fun get_pool_stats(): (u64, u64, u64) acquires StakingPool {
        let pool = borrow_global<StakingPool>(@dojohunt);
        // Cannot count stakers without tracking, return 0
        (pool.total_staked, pool.total_fees, 0)
    }

    /// Get user's completed challenges (returns vector of challenge IDs)
    /// Note: Without challenge_ids tracking, this returns empty vector
    /// Use is_challenge_completed(address, u64) to check individual challenges
     #[view]
    public fun get_user_completed_challenges(
        _user: address,
    ): vector<u64> {
        // Cannot iterate over Table without keys, return empty vector
        std::vector::empty<u64>()
    }

    /// Get count of completed challenges for a user
    /// Note: Returns the count from the user's stake, not from ChallengeCompletions table
     #[view]
    public fun get_user_challenges_count(
        user: address,
    ): u64 acquires StakingPool {
        let pool = borrow_global<StakingPool>(@dojohunt);
        if (!std::table::contains(&pool.stakes, user)) {
            return 0
        };
        let stake_ref = std::table::borrow(&pool.stakes, user);
        stake_ref.challenges_completed
    }

    /// Withdraw fees (owner only)
    public entry fun withdraw_fees(
        owner: &signer,
    ) acquires StakingPool {
        assert!(
            exists<OwnerCapability>(signer::address_of(owner)),
            error::permission_denied(E_NOT_OWNER)
        );

        let pool = borrow_global_mut<StakingPool>(@dojohunt);
        let fees = pool.total_fees;
        assert!(fees > 0, error::invalid_state(E_NO_FEES));

        pool.total_fees = 0;
        // Transfer fees to owner from resource account
        let signer_cap_ref = option::borrow(&pool.signer_cap);
        let resource_signer = account::create_signer_with_capability(signer_cap_ref);
        coin::transfer<DojoHuntCoin>(&resource_signer, signer::address_of(owner), fees);
    }
}

