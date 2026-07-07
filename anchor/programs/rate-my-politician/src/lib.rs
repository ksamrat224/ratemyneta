use anchor_lang::prelude::*;

declare_id!("DMmHWdzTeZwChv2uZbdqCDRECkP2WBQFttfY7xJYvVB5");

const MAX_ID_LEN: usize = 64;
const MAX_PARTY_ID_LEN: usize = 32;
const SECONDS_IN_24H: i64 = 86_400;

// ─────────────────────────────────────────────
// PROGRAM
// ─────────────────────────────────────────────

#[program]
pub mod rate_my_politician {
    use super::*;

    // ── Politician instructions ──────────────

    pub fn initialize_politician(
        ctx: Context<InitializePolitician>,
        politician_id: String,
    ) -> Result<()> {
        require!(politician_id.len() <= MAX_ID_LEN, RmpError::IdTooLong);

        let account = &mut ctx.accounts.politician_account;
        let clock = Clock::get()?;

        account.politician_id = politician_id;
        account.authority = ctx.accounts.authority.key();
        account.total_ratings = 0;
        account.integrity_sum = 0;
        account.work_ethic_sum = 0;
        account.promises_kept_sum = 0;
        account.overall_sum = 0;
        account.bump = ctx.bumps.politician_account;
        account.created_at = clock.unix_timestamp;
        account.last_updated = clock.unix_timestamp;

        Ok(())
    }

    /// Standard (wallet-linked) politician rating.
    /// zk_verified is always false here — only the anonymous nullifier path
    /// may produce ZK-verified ratings.
    pub fn submit_rating(
        ctx: Context<SubmitRating>,
        politician_id: String,
        integrity: u8,
        work_ethic: u8,
        promises_kept: u8,
        overall: u8,
    ) -> Result<()> {
        require!(politician_id.len() <= MAX_ID_LEN, RmpError::IdTooLong);
        validate_rating_values(integrity, work_ethic, promises_kept, overall)?;

        let clock = Clock::get()?;
        let politician = &mut ctx.accounts.politician_account;
        let rating = &mut ctx.accounts.rating_account;

        politician.integrity_sum = politician
            .integrity_sum
            .checked_add(integrity as u64)
            .ok_or(RmpError::Overflow)?;
        politician.work_ethic_sum = politician
            .work_ethic_sum
            .checked_add(work_ethic as u64)
            .ok_or(RmpError::Overflow)?;
        politician.promises_kept_sum = politician
            .promises_kept_sum
            .checked_add(promises_kept as u64)
            .ok_or(RmpError::Overflow)?;
        politician.overall_sum = politician
            .overall_sum
            .checked_add(overall as u64)
            .ok_or(RmpError::Overflow)?;
        politician.total_ratings = politician
            .total_ratings
            .checked_add(1)
            .ok_or(RmpError::Overflow)?;
        politician.last_updated = clock.unix_timestamp;

        rating.politician_id = politician_id;
        rating.voter = ctx.accounts.voter.key();
        rating.integrity = integrity;
        rating.work_ethic = work_ethic;
        rating.promises_kept = promises_kept;
        rating.overall = overall;
        rating.zk_verified = false;
        rating.timestamp = clock.unix_timestamp;
        rating.bump = ctx.bumps.rating_account;

        Ok(())
    }

    pub fn update_rating(
        ctx: Context<UpdateRating>,
        integrity: u8,
        work_ethic: u8,
        promises_kept: u8,
        overall: u8,
    ) -> Result<()> {
        validate_rating_values(integrity, work_ethic, promises_kept, overall)?;

        let clock = Clock::get()?;
        let rating = &ctx.accounts.rating_account;

        require!(
            clock.unix_timestamp - rating.timestamp <= SECONDS_IN_24H,
            RmpError::UpdateWindowExpired
        );

        let politician = &mut ctx.accounts.politician_account;

        politician.integrity_sum = politician
            .integrity_sum
            .checked_sub(rating.integrity as u64)
            .and_then(|v| v.checked_add(integrity as u64))
            .ok_or(RmpError::Overflow)?;
        politician.work_ethic_sum = politician
            .work_ethic_sum
            .checked_sub(rating.work_ethic as u64)
            .and_then(|v| v.checked_add(work_ethic as u64))
            .ok_or(RmpError::Overflow)?;
        politician.promises_kept_sum = politician
            .promises_kept_sum
            .checked_sub(rating.promises_kept as u64)
            .and_then(|v| v.checked_add(promises_kept as u64))
            .ok_or(RmpError::Overflow)?;
        politician.overall_sum = politician
            .overall_sum
            .checked_sub(rating.overall as u64)
            .and_then(|v| v.checked_add(overall as u64))
            .ok_or(RmpError::Overflow)?;
        politician.last_updated = clock.unix_timestamp;

        let rating = &mut ctx.accounts.rating_account;
        rating.integrity = integrity;
        rating.work_ethic = work_ethic;
        rating.promises_kept = promises_kept;
        rating.overall = overall;
        rating.timestamp = clock.unix_timestamp;

        Ok(())
    }

    // ── Anonymous (ZK nullifier) politician rating ──

    /// Anonymous rating: voter provides a Poseidon nullifier instead of their pubkey.
    /// The NullifierAccount PDA enforces one-rating-per-nullifier without revealing identity.
    pub fn submit_rating_anonymous(
        ctx: Context<SubmitRatingAnonymous>,
        politician_id: String,
        nullifier: [u8; 32],
        integrity: u8,
        work_ethic: u8,
        promises_kept: u8,
        overall: u8,
    ) -> Result<()> {
        require!(politician_id.len() <= MAX_ID_LEN, RmpError::IdTooLong);
        validate_rating_values(integrity, work_ethic, promises_kept, overall)?;

        let clock = Clock::get()?;
        let politician = &mut ctx.accounts.politician_account;

        // Record the nullifier so it can never be reused
        let null_acct = &mut ctx.accounts.nullifier_account;
        null_acct.nullifier = nullifier;
        null_acct.target_type = 0; // 0 = politician
        null_acct.bump = ctx.bumps.nullifier_account;
        null_acct.created_at = clock.unix_timestamp;

        // Update aggregate sums
        politician.integrity_sum = politician
            .integrity_sum
            .checked_add(integrity as u64)
            .ok_or(RmpError::Overflow)?;
        politician.work_ethic_sum = politician
            .work_ethic_sum
            .checked_add(work_ethic as u64)
            .ok_or(RmpError::Overflow)?;
        politician.promises_kept_sum = politician
            .promises_kept_sum
            .checked_add(promises_kept as u64)
            .ok_or(RmpError::Overflow)?;
        politician.overall_sum = politician
            .overall_sum
            .checked_add(overall as u64)
            .ok_or(RmpError::Overflow)?;
        politician.total_ratings = politician
            .total_ratings
            .checked_add(1)
            .ok_or(RmpError::Overflow)?;
        politician.last_updated = clock.unix_timestamp;

        // Store the anonymous rating
        let anon_rating = &mut ctx.accounts.anon_rating_account;
        anon_rating.politician_id = politician_id;
        anon_rating.nullifier = nullifier;
        anon_rating.integrity = integrity;
        anon_rating.work_ethic = work_ethic;
        anon_rating.promises_kept = promises_kept;
        anon_rating.overall = overall;
        anon_rating.timestamp = clock.unix_timestamp;
        anon_rating.bump = ctx.bumps.anon_rating_account;

        Ok(())
    }

    // ── Party instructions ───────────────────

    pub fn initialize_party(
        ctx: Context<InitializeParty>,
        party_id: String,
    ) -> Result<()> {
        require!(party_id.len() <= MAX_PARTY_ID_LEN, RmpError::PartyIdTooLong);

        let account = &mut ctx.accounts.party_account;
        let clock = Clock::get()?;

        account.party_id = party_id;
        account.authority = ctx.accounts.authority.key();
        account.total_ratings = 0;
        account.development_sum = 0;
        account.anti_corruption_sum = 0;
        account.popularity_sum = 0;
        account.reform_effort_sum = 0;
        account.governance_sum = 0;
        account.bump = ctx.bumps.party_account;
        account.created_at = clock.unix_timestamp;
        account.last_updated = clock.unix_timestamp;

        Ok(())
    }

    /// Standard (wallet-linked) party rating — 5 categories, each 1–5.
    pub fn submit_party_rating(
        ctx: Context<SubmitPartyRating>,
        party_id: String,
        development: u8,
        anti_corruption: u8,
        popularity: u8,
        reform_effort: u8,
        governance: u8,
    ) -> Result<()> {
        require!(party_id.len() <= MAX_PARTY_ID_LEN, RmpError::PartyIdTooLong);
        validate_party_rating_values(development, anti_corruption, popularity, reform_effort, governance)?;

        let clock = Clock::get()?;
        let party = &mut ctx.accounts.party_account;
        let rating = &mut ctx.accounts.party_rating_account;

        party.development_sum = party
            .development_sum
            .checked_add(development as u64)
            .ok_or(RmpError::Overflow)?;
        party.anti_corruption_sum = party
            .anti_corruption_sum
            .checked_add(anti_corruption as u64)
            .ok_or(RmpError::Overflow)?;
        party.popularity_sum = party
            .popularity_sum
            .checked_add(popularity as u64)
            .ok_or(RmpError::Overflow)?;
        party.reform_effort_sum = party
            .reform_effort_sum
            .checked_add(reform_effort as u64)
            .ok_or(RmpError::Overflow)?;
        party.governance_sum = party
            .governance_sum
            .checked_add(governance as u64)
            .ok_or(RmpError::Overflow)?;
        party.total_ratings = party
            .total_ratings
            .checked_add(1)
            .ok_or(RmpError::Overflow)?;
        party.last_updated = clock.unix_timestamp;

        rating.party_id = party_id;
        rating.voter = ctx.accounts.voter.key();
        rating.development = development;
        rating.anti_corruption = anti_corruption;
        rating.popularity = popularity;
        rating.reform_effort = reform_effort;
        rating.governance = governance;
        rating.timestamp = clock.unix_timestamp;
        rating.bump = ctx.bumps.party_rating_account;

        Ok(())
    }

    pub fn update_party_rating(
        ctx: Context<UpdatePartyRating>,
        development: u8,
        anti_corruption: u8,
        popularity: u8,
        reform_effort: u8,
        governance: u8,
    ) -> Result<()> {
        validate_party_rating_values(development, anti_corruption, popularity, reform_effort, governance)?;

        let clock = Clock::get()?;
        let old = &ctx.accounts.party_rating_account;

        require!(
            clock.unix_timestamp - old.timestamp <= SECONDS_IN_24H,
            RmpError::UpdateWindowExpired
        );

        let party = &mut ctx.accounts.party_account;

        party.development_sum = party
            .development_sum
            .checked_sub(old.development as u64)
            .and_then(|v| v.checked_add(development as u64))
            .ok_or(RmpError::Overflow)?;
        party.anti_corruption_sum = party
            .anti_corruption_sum
            .checked_sub(old.anti_corruption as u64)
            .and_then(|v| v.checked_add(anti_corruption as u64))
            .ok_or(RmpError::Overflow)?;
        party.popularity_sum = party
            .popularity_sum
            .checked_sub(old.popularity as u64)
            .and_then(|v| v.checked_add(popularity as u64))
            .ok_or(RmpError::Overflow)?;
        party.reform_effort_sum = party
            .reform_effort_sum
            .checked_sub(old.reform_effort as u64)
            .and_then(|v| v.checked_add(reform_effort as u64))
            .ok_or(RmpError::Overflow)?;
        party.governance_sum = party
            .governance_sum
            .checked_sub(old.governance as u64)
            .and_then(|v| v.checked_add(governance as u64))
            .ok_or(RmpError::Overflow)?;
        party.last_updated = clock.unix_timestamp;

        let rating = &mut ctx.accounts.party_rating_account;
        rating.development = development;
        rating.anti_corruption = anti_corruption;
        rating.popularity = popularity;
        rating.reform_effort = reform_effort;
        rating.governance = governance;
        rating.timestamp = clock.unix_timestamp;

        Ok(())
    }

    /// Anonymous party rating via ZK nullifier.
    pub fn submit_party_rating_anonymous(
        ctx: Context<SubmitPartyRatingAnonymous>,
        party_id: String,
        nullifier: [u8; 32],
        development: u8,
        anti_corruption: u8,
        popularity: u8,
        reform_effort: u8,
        governance: u8,
    ) -> Result<()> {
        require!(party_id.len() <= MAX_PARTY_ID_LEN, RmpError::PartyIdTooLong);
        validate_party_rating_values(development, anti_corruption, popularity, reform_effort, governance)?;

        let clock = Clock::get()?;

        let null_acct = &mut ctx.accounts.nullifier_account;
        null_acct.nullifier = nullifier;
        null_acct.target_type = 1; // 1 = party
        null_acct.bump = ctx.bumps.nullifier_account;
        null_acct.created_at = clock.unix_timestamp;

        let party = &mut ctx.accounts.party_account;
        party.development_sum = party
            .development_sum
            .checked_add(development as u64)
            .ok_or(RmpError::Overflow)?;
        party.anti_corruption_sum = party
            .anti_corruption_sum
            .checked_add(anti_corruption as u64)
            .ok_or(RmpError::Overflow)?;
        party.popularity_sum = party
            .popularity_sum
            .checked_add(popularity as u64)
            .ok_or(RmpError::Overflow)?;
        party.reform_effort_sum = party
            .reform_effort_sum
            .checked_add(reform_effort as u64)
            .ok_or(RmpError::Overflow)?;
        party.governance_sum = party
            .governance_sum
            .checked_add(governance as u64)
            .ok_or(RmpError::Overflow)?;
        party.total_ratings = party
            .total_ratings
            .checked_add(1)
            .ok_or(RmpError::Overflow)?;
        party.last_updated = clock.unix_timestamp;

        let anon = &mut ctx.accounts.anon_party_rating_account;
        anon.party_id = party_id;
        anon.nullifier = nullifier;
        anon.development = development;
        anon.anti_corruption = anti_corruption;
        anon.popularity = popularity;
        anon.reform_effort = reform_effort;
        anon.governance = governance;
        anon.timestamp = clock.unix_timestamp;
        anon.bump = ctx.bumps.anon_party_rating_account;

        Ok(())
    }
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

fn validate_rating_values(integrity: u8, work_ethic: u8, promises_kept: u8, overall: u8) -> Result<()> {
    require!(
        (1..=5).contains(&integrity)
            && (1..=5).contains(&work_ethic)
            && (1..=5).contains(&promises_kept)
            && (1..=5).contains(&overall),
        RmpError::InvalidRating
    );
    Ok(())
}

fn validate_party_rating_values(
    development: u8,
    anti_corruption: u8,
    popularity: u8,
    reform_effort: u8,
    governance: u8,
) -> Result<()> {
    require!(
        (1..=5).contains(&development)
            && (1..=5).contains(&anti_corruption)
            && (1..=5).contains(&popularity)
            && (1..=5).contains(&reform_effort)
            && (1..=5).contains(&governance),
        RmpError::InvalidPartyRating
    );
    Ok(())
}

// ─────────────────────────────────────────────
// ACCOUNT STRUCTS
// ─────────────────────────────────────────────

#[account]
pub struct PoliticianAccount {
    pub politician_id: String,    // max 64
    pub authority: Pubkey,
    pub total_ratings: u64,
    pub integrity_sum: u64,
    pub work_ethic_sum: u64,
    pub promises_kept_sum: u64,
    pub overall_sum: u64,
    pub bump: u8,
    pub created_at: i64,
    pub last_updated: i64,
}

impl PoliticianAccount {
    // 8 discriminator + 4+64 string + 32 pubkey + 5×8 u64 + 1 bump + 2×8 i64
    pub const LEN: usize = 8 + 4 + 64 + 32 + 8 + 8 + 8 + 8 + 8 + 1 + 8 + 8;
}

#[account]
pub struct RatingAccount {
    pub politician_id: String,    // max 64
    pub voter: Pubkey,
    pub integrity: u8,
    pub work_ethic: u8,
    pub promises_kept: u8,
    pub overall: u8,
    pub zk_verified: bool,
    pub timestamp: i64,
    pub bump: u8,
}

impl RatingAccount {
    pub const LEN: usize = 8 + 4 + 64 + 32 + 1 + 1 + 1 + 1 + 1 + 8 + 1;
}

#[account]
pub struct NullifierAccount {
    pub nullifier: [u8; 32],
    pub target_type: u8,          // 0 = politician, 1 = party
    pub bump: u8,
    pub created_at: i64,
}

impl NullifierAccount {
    pub const LEN: usize = 8 + 32 + 1 + 1 + 8;
}

#[account]
pub struct AnonRatingAccount {
    pub politician_id: String,    // max 64
    pub nullifier: [u8; 32],
    pub integrity: u8,
    pub work_ethic: u8,
    pub promises_kept: u8,
    pub overall: u8,
    pub timestamp: i64,
    pub bump: u8,
}

impl AnonRatingAccount {
    pub const LEN: usize = 8 + 4 + 64 + 32 + 1 + 1 + 1 + 1 + 8 + 1;
}

#[account]
pub struct PartyAccount {
    pub party_id: String,         // max 32
    pub authority: Pubkey,
    pub total_ratings: u64,
    pub development_sum: u64,
    pub anti_corruption_sum: u64,
    pub popularity_sum: u64,
    pub reform_effort_sum: u64,
    pub governance_sum: u64,
    pub bump: u8,
    pub created_at: i64,
    pub last_updated: i64,
}

impl PartyAccount {
    // 8 + 4+32 + 32 + 6×8 + 1 + 2×8
    pub const LEN: usize = 8 + 4 + 32 + 32 + 8 + 8 + 8 + 8 + 8 + 8 + 1 + 8 + 8;
}

#[account]
pub struct PartyRatingAccount {
    pub party_id: String,         // max 32
    pub voter: Pubkey,
    pub development: u8,
    pub anti_corruption: u8,
    pub popularity: u8,
    pub reform_effort: u8,
    pub governance: u8,
    pub timestamp: i64,
    pub bump: u8,
}

impl PartyRatingAccount {
    pub const LEN: usize = 8 + 4 + 32 + 32 + 1 + 1 + 1 + 1 + 1 + 8 + 1;
}

#[account]
pub struct AnonPartyRatingAccount {
    pub party_id: String,         // max 32
    pub nullifier: [u8; 32],
    pub development: u8,
    pub anti_corruption: u8,
    pub popularity: u8,
    pub reform_effort: u8,
    pub governance: u8,
    pub timestamp: i64,
    pub bump: u8,
}

impl AnonPartyRatingAccount {
    pub const LEN: usize = 8 + 4 + 32 + 32 + 1 + 1 + 1 + 1 + 1 + 8 + 1;
}

// ─────────────────────────────────────────────
// CONTEXT STRUCTS
// ─────────────────────────────────────────────

#[derive(Accounts)]
#[instruction(politician_id: String)]
pub struct InitializePolitician<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = PoliticianAccount::LEN,
        seeds = [b"politician", politician_id.as_bytes()],
        bump,
    )]
    pub politician_account: Account<'info, PoliticianAccount>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(politician_id: String)]
pub struct SubmitRating<'info> {
    #[account(mut)]
    pub voter: Signer<'info>,
    #[account(
        mut,
        seeds = [b"politician", politician_id.as_bytes()],
        bump = politician_account.bump,
    )]
    pub politician_account: Account<'info, PoliticianAccount>,
    #[account(
        init,
        payer = voter,
        space = RatingAccount::LEN,
        seeds = [b"rating", politician_id.as_bytes(), voter.key().as_ref()],
        bump,
    )]
    pub rating_account: Account<'info, RatingAccount>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateRating<'info> {
    #[account(mut)]
    pub voter: Signer<'info>,
    #[account(
        mut,
        seeds = [b"politician", rating_account.politician_id.as_bytes()],
        bump = politician_account.bump,
    )]
    pub politician_account: Account<'info, PoliticianAccount>,
    #[account(
        mut,
        seeds = [b"rating", rating_account.politician_id.as_bytes(), voter.key().as_ref()],
        bump = rating_account.bump,
        has_one = voter,
    )]
    pub rating_account: Account<'info, RatingAccount>,
}

#[derive(Accounts)]
#[instruction(politician_id: String, nullifier: [u8; 32])]
pub struct SubmitRatingAnonymous<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        mut,
        seeds = [b"politician", politician_id.as_bytes()],
        bump = politician_account.bump,
    )]
    pub politician_account: Account<'info, PoliticianAccount>,
    /// Prevents the same nullifier from being used twice (double-vote guard).
    #[account(
        init,
        payer = payer,
        space = NullifierAccount::LEN,
        seeds = [b"nullifier", nullifier.as_ref()],
        bump,
    )]
    pub nullifier_account: Account<'info, NullifierAccount>,
    #[account(
        init,
        payer = payer,
        space = AnonRatingAccount::LEN,
        seeds = [b"anon_rating", nullifier.as_ref()],
        bump,
    )]
    pub anon_rating_account: Account<'info, AnonRatingAccount>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(party_id: String)]
pub struct InitializeParty<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = PartyAccount::LEN,
        seeds = [b"party", party_id.as_bytes()],
        bump,
    )]
    pub party_account: Account<'info, PartyAccount>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(party_id: String)]
pub struct SubmitPartyRating<'info> {
    #[account(mut)]
    pub voter: Signer<'info>,
    #[account(
        mut,
        seeds = [b"party", party_id.as_bytes()],
        bump = party_account.bump,
    )]
    pub party_account: Account<'info, PartyAccount>,
    #[account(
        init,
        payer = voter,
        space = PartyRatingAccount::LEN,
        seeds = [b"party_rating", party_id.as_bytes(), voter.key().as_ref()],
        bump,
    )]
    pub party_rating_account: Account<'info, PartyRatingAccount>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdatePartyRating<'info> {
    #[account(mut)]
    pub voter: Signer<'info>,
    #[account(
        mut,
        seeds = [b"party", party_rating_account.party_id.as_bytes()],
        bump = party_account.bump,
    )]
    pub party_account: Account<'info, PartyAccount>,
    #[account(
        mut,
        seeds = [b"party_rating", party_rating_account.party_id.as_bytes(), voter.key().as_ref()],
        bump = party_rating_account.bump,
        has_one = voter,
    )]
    pub party_rating_account: Account<'info, PartyRatingAccount>,
}

#[derive(Accounts)]
#[instruction(party_id: String, nullifier: [u8; 32])]
pub struct SubmitPartyRatingAnonymous<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        mut,
        seeds = [b"party", party_id.as_bytes()],
        bump = party_account.bump,
    )]
    pub party_account: Account<'info, PartyAccount>,
    /// Shared nullifier namespace — same nullifier cannot rate both a politician and a party anonymously.
    #[account(
        init,
        payer = payer,
        space = NullifierAccount::LEN,
        seeds = [b"nullifier", nullifier.as_ref()],
        bump,
    )]
    pub nullifier_account: Account<'info, NullifierAccount>,
    #[account(
        init,
        payer = payer,
        space = AnonPartyRatingAccount::LEN,
        seeds = [b"anon_party_rating", nullifier.as_ref()],
        bump,
    )]
    pub anon_party_rating_account: Account<'info, AnonPartyRatingAccount>,
    pub system_program: Program<'info, System>,
}

// ─────────────────────────────────────────────
// ERRORS
// ─────────────────────────────────────────────

#[error_code]
pub enum RmpError {
    #[msg("Rating must be between 1 and 5")]
    InvalidRating,
    #[msg("Politician ID must be 64 characters or fewer")]
    IdTooLong,
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("Update window of 24h has expired")]
    UpdateWindowExpired,
    #[msg("Party rating values must be between 1 and 5")]
    InvalidPartyRating,
    #[msg("Party ID must be 32 characters or fewer")]
    PartyIdTooLong,
    #[msg("This nullifier has already been used — double-vote prevented")]
    NullifierAlreadyUsed,
}
