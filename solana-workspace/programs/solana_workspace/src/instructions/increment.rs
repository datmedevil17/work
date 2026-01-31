use anchor_lang::prelude::*;
use crate::state::Counter;

#[derive(Accounts)]
pub struct Increment<'info> {
    #[account(mut)]
    pub counter: Account<'info, Counter>,
}

pub fn handler(ctx: Context<Increment>) -> Result<()> {
    let counter = &mut ctx.accounts.counter;
    counter.count += 1;
    msg!("Counter incremented. Current count: {}", counter.count);
    Ok(())
}