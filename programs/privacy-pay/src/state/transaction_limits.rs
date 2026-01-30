use anchor_lang::prelude::*;

/// Track daily cross-border transaction limits per user
#[account]
pub struct TransactionLimits {
    /// User's wallet address
    pub user: Pubkey,

    /// Total cross-border amount spent today (in lamports)
    pub daily_cross_border_spent: u64,

    /// Daily cross-border limit (default: 10 SOL = 10,000,000,000 lamports)
    pub daily_cross_border_limit: u64,

    /// Last reset date (Unix timestamp)
    pub last_reset_date: i64,

    /// Total domestic transactions today
    pub domestic_tx_count: u32,

    /// Total cross-border transactions today
    pub cross_border_tx_count: u32,

    /// PDA bump
    pub bump: u8,
}

impl TransactionLimits {
    pub const LEN: usize = 8 + 32 + 8 + 8 + 8 + 4 + 4 + 1;

    /// Default daily cross-border limit: 10 SOL
    pub const DEFAULT_DAILY_LIMIT: u64 = 10 * 1_000_000_000; // 10 SOL in lamports

    /// Check if enough time has passed to reset daily limits
    pub fn should_reset(&self, now: i64) -> bool {
        let seconds_per_day = 86_400i64;
        (now - self.last_reset_date) >= seconds_per_day
    }

    /// Reset daily counters
    pub fn reset_daily(&mut self, now: i64) {
        self.daily_cross_border_spent = 0;
        self.domestic_tx_count = 0;
        self.cross_border_tx_count = 0;
        self.last_reset_date = now;
    }

    /// Check if cross-border transaction would exceed limit
    pub fn can_spend_cross_border(&self, amount: u64) -> bool {
        self.daily_cross_border_spent + amount <= self.daily_cross_border_limit
    }

    /// Add cross-border spending
    pub fn add_cross_border_spending(&mut self, amount: u64) -> Result<()> {
        require!(
            self.can_spend_cross_border(amount),
            TransactionLimitError::DailyLimitExceeded
        );

        self.daily_cross_border_spent += amount;
        self.cross_border_tx_count += 1;
        Ok(())
    }

    /// Add domestic transaction
    pub fn add_domestic_transaction(&mut self) {
        self.domestic_tx_count += 1;
    }
}

/// Transaction record for history
#[account]
pub struct TransactionRecord {
    /// Unique transaction ID
    pub tx_id: [u8; 32],

    /// User who initiated transaction
    pub user: Pubkey,

    /// Recipient address (encrypted in proof)
    pub recipient: Pubkey,

    /// Amount in lamports
    pub amount: u64,

    /// Is cross-border transaction
    pub is_cross_border: bool,

    /// Transaction status: 0 = pending, 1 = confirmed, 2 = failed
    pub status: u8,

    /// Timestamp
    pub timestamp: i64,

    /// On-chain signature
    pub signature: String,

    /// PDA bump
    pub bump: u8,
}

impl TransactionRecord {
    pub const LEN: usize = 8 + 32 + 32 + 32 + 8 + 1 + 1 + 8 + (4 + 88) + 1; // 256 bytes
}

#[error_code]
pub enum TransactionLimitError {
    #[msg("Daily cross-border transaction limit exceeded")]
    DailyLimitExceeded,

    #[msg("Invalid transaction amount")]
    InvalidAmount,

    #[msg("Transaction recording failed")]
    RecordingFailed,
}
