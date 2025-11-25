use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_2022::{self, Token2022, MintTo, Burn},
    token_interface::{Mint, TokenAccount},
};

declare_id!("CA7Z9VgsUuDWZreqaUfJztBgEgi6ksW9iyW9pjvMarKU");

// PDA Seeds
pub const PROPERTY_STATE_SEED: &[u8] = b"property";
pub const PROPERTY_VAULT_SEED: &[u8] = b"property_vault";

// SAS Program ID (Solana Attestation Service)
// TODO: Replace with actual SAS program ID when available
pub const SAS_PROGRAM_ID: Pubkey = Pubkey::new_from_array([0; 32]);

#[program]
pub mod hub_token_program {
    use super::*;

    /// Initialize a new real estate property as a tokenized asset
    pub fn initialize_property(
        ctx: Context<InitializeProperty>,
        property_name: String,
        property_symbol: String,
        decimals: u8,
        total_supply: u64,
        property_details: PropertyDetails,
    ) -> Result<()> {
        require!(property_name.len() <= 50, RwaError::PropertyNameTooLong);
        require!(property_symbol.len() <= 10, RwaError::PropertySymbolTooLong);
        require!(total_supply > 0, RwaError::InvalidTotalSupply);

        let property_state = &mut ctx.accounts.property_state;
        property_state.authority = ctx.accounts.authority.key();
        property_state.mint = ctx.accounts.mint.key();
        property_state.property_name = property_name.clone();
        property_state.property_symbol = property_symbol.clone();
        property_state.total_supply = total_supply;
        property_state.circulating_supply = 0;
        property_state.details = property_details.clone();
        property_state.is_active = true;
        property_state.created_at = Clock::get()?.unix_timestamp;
        property_state.updated_at = Clock::get()?.unix_timestamp;
        property_state.bump = ctx.bumps.property_state;

        emit!(PropertyInitialized {
            mint: ctx.accounts.mint.key(),
            authority: ctx.accounts.authority.key(),
            property_name,
            property_symbol,
            total_supply,
            property_address: property_details.property_address,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Mint property tokens to an investor (requires KYC via SAS)
    pub fn mint_property_tokens(
        ctx: Context<MintPropertyTokens>,
        amount: u64,
    ) -> Result<()> {
        let property_state = &mut ctx.accounts.property_state;

        require!(property_state.is_active, RwaError::PropertyNotActive);
        require!(
            property_state.circulating_supply + amount <= property_state.total_supply,
            RwaError::ExceedsMaxSupply
        );

        // TODO: Verify SAS attestation for KYC
        // verify_sas_attestation(&ctx.accounts.investor_attestation)?;

        // Mint tokens
        let mint_key = property_state.mint;
        let seeds = &[
            PROPERTY_STATE_SEED,
            mint_key.as_ref(),
            &[property_state.bump],
        ];
        let signer_seeds = &[&seeds[..]];

        let cpi_context = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.investor_token_account.to_account_info(),
                authority: property_state.to_account_info(),
            },
            signer_seeds,
        );

        token_2022::mint_to(cpi_context, amount)?;

        property_state.circulating_supply += amount;
        property_state.updated_at = Clock::get()?.unix_timestamp;

        emit!(TokensMinted {
            mint: ctx.accounts.mint.key(),
            investor: ctx.accounts.investor.key(),
            amount,
            circulating_supply: property_state.circulating_supply,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Burn property tokens (redemption)
    pub fn burn_property_tokens(
        ctx: Context<BurnPropertyTokens>,
        amount: u64,
    ) -> Result<()> {
        let property_state = &mut ctx.accounts.property_state;

        // Burn tokens
        let cpi_context = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Burn {
                mint: ctx.accounts.mint.to_account_info(),
                from: ctx.accounts.investor_token_account.to_account_info(),
                authority: ctx.accounts.investor.to_account_info(),
            },
        );

        token_2022::burn(cpi_context, amount)?;

        property_state.circulating_supply -= amount;
        property_state.updated_at = Clock::get()?.unix_timestamp;

        emit!(TokensBurned {
            mint: ctx.accounts.mint.key(),
            investor: ctx.accounts.investor.key(),
            amount,
            circulating_supply: property_state.circulating_supply,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Update property metadata (authority only)
    pub fn update_property_details(
        ctx: Context<UpdatePropertyDetails>,
        new_details: PropertyDetails,
    ) -> Result<()> {
        let property_state = &mut ctx.accounts.property_state;

        property_state.details = new_details.clone();
        property_state.updated_at = Clock::get()?.unix_timestamp;

        emit!(PropertyUpdated {
            mint: ctx.accounts.mint.key(),
            property_address: new_details.property_address,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Toggle property active status (authority only)
    pub fn toggle_property_status(
        ctx: Context<TogglePropertyStatus>,
    ) -> Result<()> {
        let property_state = &mut ctx.accounts.property_state;

        property_state.is_active = !property_state.is_active;
        property_state.updated_at = Clock::get()?.unix_timestamp;

        emit!(PropertyStatusChanged {
            mint: ctx.accounts.mint.key(),
            is_active: property_state.is_active,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }
}

// ============================================================================
// Contexts
// ============================================================================

#[derive(Accounts)]
#[instruction(property_name: String, property_symbol: String, decimals: u8)]
pub struct InitializeProperty<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    /// The Token-2022 mint for the property
    #[account(
        init,
        payer = authority,
        mint::decimals = decimals,
        mint::authority = property_state,
        mint::token_program = token_program,
    )]
    pub mint: Box<InterfaceAccount<'info, Mint>>,

    /// PropertyState PDA
    #[account(
        init,
        payer = authority,
        space = 8 + PropertyState::INIT_SPACE,
        seeds = [PROPERTY_STATE_SEED, mint.key().as_ref()],
        bump,
    )]
    pub property_state: Box<Account<'info, PropertyState>>,

    pub token_program: Program<'info, Token2022>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct MintPropertyTokens<'info> {
    /// Property authority
    #[account(mut)]
    pub authority: Signer<'info>,

    /// Investor receiving tokens (must have valid SAS attestation)
    /// CHECK: Verified via SAS attestation
    pub investor: UncheckedAccount<'info>,

    /// PropertyState PDA
    #[account(
        mut,
        seeds = [PROPERTY_STATE_SEED, mint.key().as_ref()],
        bump = property_state.bump,
        has_one = authority @ RwaError::Unauthorized,
        has_one = mint @ RwaError::InvalidMint,
    )]
    pub property_state: Box<Account<'info, PropertyState>>,

    /// The property token mint
    #[account(mut)]
    pub mint: Box<InterfaceAccount<'info, Mint>>,

    /// Investor's token account
    #[account(
        init,
        payer = authority,
        associated_token::mint = mint,
        associated_token::authority = investor,
        associated_token::token_program = token_program,
    )]
    pub investor_token_account: Box<InterfaceAccount<'info, TokenAccount>>,

    /// SAS Attestation account for investor KYC
    /// CHECK: Will be verified using SAS program
    #[account()]
    pub investor_attestation: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token2022>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct BurnPropertyTokens<'info> {
    /// Investor burning their tokens
    #[account(mut)]
    pub investor: Signer<'info>,

    /// PropertyState PDA
    #[account(
        mut,
        seeds = [PROPERTY_STATE_SEED, mint.key().as_ref()],
        bump = property_state.bump,
        has_one = mint @ RwaError::InvalidMint,
    )]
    pub property_state: Box<Account<'info, PropertyState>>,

    /// The property token mint
    #[account(mut)]
    pub mint: Box<InterfaceAccount<'info, Mint>>,

    /// Investor's token account
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = investor,
        associated_token::token_program = token_program,
    )]
    pub investor_token_account: Box<InterfaceAccount<'info, TokenAccount>>,

    pub token_program: Program<'info, Token2022>,
}

#[derive(Accounts)]
pub struct UpdatePropertyDetails<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    /// PropertyState PDA
    #[account(
        mut,
        seeds = [PROPERTY_STATE_SEED, mint.key().as_ref()],
        bump = property_state.bump,
        has_one = authority @ RwaError::Unauthorized,
        has_one = mint @ RwaError::InvalidMint,
    )]
    pub property_state: Box<Account<'info, PropertyState>>,

    /// The property token mint
    pub mint: Box<InterfaceAccount<'info, Mint>>,
}

#[derive(Accounts)]
pub struct TogglePropertyStatus<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    /// PropertyState PDA
    #[account(
        mut,
        seeds = [PROPERTY_STATE_SEED, mint.key().as_ref()],
        bump = property_state.bump,
        has_one = authority @ RwaError::Unauthorized,
        has_one = mint @ RwaError::InvalidMint,
    )]
    pub property_state: Box<Account<'info, PropertyState>>,

    /// The property token mint
    pub mint: Box<InterfaceAccount<'info, Mint>>,
}

// ============================================================================
// State Accounts
// ============================================================================

#[account]
#[derive(InitSpace)]
pub struct PropertyState {
    pub authority: Pubkey,
    pub mint: Pubkey,
    #[max_len(50)]
    pub property_name: String,
    #[max_len(10)]
    pub property_symbol: String,
    pub total_supply: u64,
    pub circulating_supply: u64,
    pub details: PropertyDetails,
    pub is_active: bool,
    pub created_at: i64,
    pub updated_at: i64,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub struct PropertyDetails {
    #[max_len(200)]
    pub property_address: String,
    #[max_len(100)]
    pub property_type: String, // e.g., "Residential", "Commercial", "Industrial"
    pub total_value_usd: u64, // Total property value in USD (cents)
    pub rental_yield_bps: u16, // Annual rental yield in basis points (e.g., 500 = 5%)
    #[max_len(500)]
    pub metadata_uri: String, // IPFS or Arweave URI with full property details
}

// ============================================================================
// Events
// ============================================================================

#[event]
pub struct PropertyInitialized {
    pub mint: Pubkey,
    pub authority: Pubkey,
    pub property_name: String,
    pub property_symbol: String,
    pub total_supply: u64,
    pub property_address: String,
    pub timestamp: i64,
}

#[event]
pub struct TokensMinted {
    pub mint: Pubkey,
    pub investor: Pubkey,
    pub amount: u64,
    pub circulating_supply: u64,
    pub timestamp: i64,
}

#[event]
pub struct TokensBurned {
    pub mint: Pubkey,
    pub investor: Pubkey,
    pub amount: u64,
    pub circulating_supply: u64,
    pub timestamp: i64,
}

#[event]
pub struct PropertyUpdated {
    pub mint: Pubkey,
    pub property_address: String,
    pub timestamp: i64,
}

#[event]
pub struct PropertyStatusChanged {
    pub mint: Pubkey,
    pub is_active: bool,
    pub timestamp: i64,
}

// ============================================================================
// Errors
// ============================================================================

#[error_code]
pub enum RwaError {
    #[msg("Unauthorized: Only property authority can perform this action")]
    Unauthorized,
    #[msg("Property name too long (max 50 characters)")]
    PropertyNameTooLong,
    #[msg("Property symbol too long (max 10 characters)")]
    PropertySymbolTooLong,
    #[msg("Invalid total supply")]
    InvalidTotalSupply,
    #[msg("Exceeds maximum supply")]
    ExceedsMaxSupply,
    #[msg("Property is not active")]
    PropertyNotActive,
    #[msg("Invalid mint account")]
    InvalidMint,
    #[msg("KYC verification required (SAS attestation not found or invalid)")]
    KycVerificationRequired,
}

// ============================================================================
// Helper Functions
// ============================================================================

// TODO: Implement SAS attestation verification
// fn verify_sas_attestation(attestation_account: &AccountInfo) -> Result<()> {
//     // Verify that the attestation account is owned by SAS program
//     // Verify that the attestation is valid and not expired
//     // Verify that the attestation claim matches KYC requirements
//     Ok(())
// }
