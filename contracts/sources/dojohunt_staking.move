module dojohunt::dojohunt_staking {
    use std::signer;
    use std::error;
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::timestamp;
    use dojohunt::dojohunt_token::DojoHuntCoin;

    /// Constants
    const STAKING_PERIOD_SECONDS: u64 = 432000; // 5 days
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

    /// Stake information
    struct Stake has store {
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
            }
        );

        move_to(deployer, OwnerCapability {});
    }

    /// Stake tokens
    public entry fun stake(
        user: &signer,
        amount: u64,
    ) acquires StakingPool {
        let pool = borrow_global_mut<StakingPool>(@dojohunt);
        let user_addr = signer::address_of(user);
        
        assert!(amount > 0, error::invalid_argument(E_INVALID_AMOUNT));
        
        // Check if user already has an active stake
        assert!(
            !std::table::contains(&pool.stakes, user_addr) || 
            !std::table::borrow(&pool.stakes, user_addr).is_active,
            error::already_exists(E_STAKE_ALREADY_EXISTS)
        );

        // Transfer tokens from user to contract
        let coins = coin::withdraw<DojoHuntCoin>(user, amount);
        coin::deposit<DojoHuntCoin>(@dojohunt, coins);

        // Remove old stake if exists
        if (std::table::contains(&pool.stakes, user_addr)) {
            std::table::remove(&mut pool.stakes, user_addr);
        };

        let current_time = timestamp::now_seconds();
        let end_time = current_time + STAKING_PERIOD_SECONDS;

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

        // Transfer tokens back to user
        coin::transfer<DojoHuntCoin>(@dojohunt, user_addr, return_amount);
    }

    /// Complete a challenge
    public entry fun complete_challenge(
        user: &signer,
        challenge_id: u64,
    ) acquires StakingPool {
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
    ) acquires StakingPool {
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
    ): bool {
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
    public fun get_contract_balance(): u64 {
        coin::balance<DojoHuntCoin>(@dojohunt)
    }

    /// Withdraw fees (owner only)
    public entry fun withdraw_fees(
        owner: &signer,
    ) acquires StakingPool, OwnerCapability {
        assert!(
            exists<OwnerCapability>(signer::address_of(owner)),
            error::permission_denied(E_NOT_OWNER)
        );

        let pool = borrow_global_mut<StakingPool>(@dojohunt);
        let fees = pool.total_fees;
        assert!(fees > 0, error::invalid_state(E_NO_FEES));

        pool.total_fees = 0;
        coin::transfer<DojoHuntCoin>(@dojohunt, signer::address_of(owner), fees);
    }
}

