use anchor_lang::prelude::*;

declare_id!("DMmHWdzTeZwChv2uZbdqCDRECkP2WBQFttfY7xJYvVB5");

const MAX_ID_LEN: usize = 64;
const SECONDS_IN_24H: i64 = 86_400;

#[program]
pub mod rate_my_politician {
    use super::*;

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

    pub fn submit_rating(
        ctx: Context<SubmitRating>,
        politician_id: String,
        integrity: u8,
        work_ethic: u8,
        promises_kept: u8,
        overall: u8,
        zk_verified: bool,
    ) -> Result<()> {
        require!(politician_id.len() <= MAX_ID_LEN, RmpError::IdTooLong);
        require!(
            (1..=5).contains(&integrity)
                && (1..=5).contains(&work_ethic)
                && (1..=5).contains(&promises_kept)
                && (1..=5).contains(&overall),
            RmpError::InvalidRating
        );

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
        rating.zk_verified = zk_verified;
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
        require!(
            (1..=5).contains(&integrity)
                && (1..=5).contains(&work_ethic)
                && (1..=5).contains(&promises_kept)
                && (1..=5).contains(&overall),
            RmpError::InvalidRating
        );

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
}

#[account]
pub struct PoliticianAccount {
    pub politician_id: String,
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
    // 4 (string prefix) + 64 (max id) + 32 (pubkey) + 5×8 (u64s) + 1 (bump) + 2×8 (i64s)
    pub const LEN: usize = 8 + 4 + 64 + 32 + 8 + 8 + 8 + 8 + 8 + 1 + 8 + 8;
}

#[account]
pub struct RatingAccount {
    pub politician_id: String,
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
    // 4 + 64 + 32 + 4×1 + 1 + 8 + 1
    pub const LEN: usize = 8 + 4 + 64 + 32 + 1 + 1 + 1 + 1 + 1 + 8 + 1;
}

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
}
