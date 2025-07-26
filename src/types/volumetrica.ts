// Volumetrica API Types

// Base response wrapper
export interface VolumetricaResponse<T> {
  success: boolean;
  data?: T;
  statusCode?: number;
  message?: string;
  details?: string[];
}

// User Management
export interface User {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  country: string;
  state?: string;
  phone?: string;
  status: UserStatus;
  externalId?: string;
  createdAt?: string;
  managementMode?: UserManagementMode;
}

export enum UserStatus {
  Active = 0,
  Inactive = 1,
  Invited = 2,
}

export enum UserManagementMode {
  Shared = 0,
  Dedicated = 1,
}

export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  country: string;
  state?: string;
  phone?: string;
  password?: string;
  encryptionMode?: EncryptionMode;
  forceNewPassword?: boolean;
  externalId?: string;
}

export interface CreateUserResponse {
  userId: string;
  password?: string;
}

export enum EncryptionMode {
  None = 0,
  AES256 = 1,
}

export interface UserInviteRequest {
  country: string;
  externalId?: string;
}

export interface UserInviteResponse {
  userId: string;
  status: UserStatus;
  inviteUrl: string;
}

export interface LoginUrlRequest {
  userId: string;
}

export interface LoginUrlResponse {
  loginUrl: string;
}

// Trading Account Types
export interface TradingAccount {
  accountId: string;
  userId: string;
  header: string;
  description?: string;
  currency: Currency;
  mode: AccountMode;
  portfolioMode: PortfolioMode;
  status: AccountStatus;
  balance: number;
  equity: number;
  usedMargin: number;
  freeMargin: number;
  marginLevel: number;
  unrealizedPnL: number;
  realizedPnL: number;
  dailyPnL: number;
  weeklyPnL: number;
  monthlyPnL: number;
  openPositions: number;
  tradingRuleId?: string;
  drawdown: number;
  maxDrawdown: number;
  runup: number;
  createdAt: string;
  enabledAt?: string;
  expirationDate?: string;
  reason?: DisableReason;
}

export enum Currency {
  EUR = 0,
  USD = 1,
}

export enum AccountMode {
  Evaluation = 0,
  SimFunded = 1,
  Funded = 2,
  Live = 3,
  Trial = 4,
  Contest = 5,
  Training = 100,
}

export enum PortfolioMode {
  Netting = 0,
  Hedging = 1,
}

export enum AccountStatus {
  Initialized = 0,
  Enabled = 1,
  ChallengeSuccess = 2,
  ChallengeFailed = 4,
  Disabled = 8,
}

export interface CreateAccountRequest {
  userId: string;
  currency: Currency;
  mode: AccountMode;
  balance: number;
  portfolioMode?: PortfolioMode;
  header?: string;
  description?: string;
  disableOtherAccountsEnabled?: boolean;
  expirationMode?: ExpirationMode;
  endDate?: string;
  expirationDays?: number;
  accountRuleId?: string;
  accountCustomRule?: TradingRule;
  subscriptionDetail?: SubscriptionDetail;
}

export interface CreateAccountResponse {
  accountId: string;
  tradingRuleId?: string;
}

export enum ExpirationMode {
  NeverExpires = 0,
  UseEndDate = 1,
  DaysFromActivation = 2,
  DaysFromFirstOrder = 3,
  DaysFromFirstExecution = 4,
}

export interface SubscriptionDetail {
  dataFeedProducts: number[];
  platform: Platform;
  volumetricaPlatform?: VolumetricaPlatform;
}

export enum Platform {
  VOLUMETRICA_TRADING = 0,
  ATAS = 1,
  QUANTOWER = 2,
}

export enum VolumetricaPlatform {
  VolSys = 0,
  VolBook = 1,
}

export interface EnableAccountRequest {
  accountId: string;
}

export interface DisableAccountRequest {
  accountId: string;
  reason: string;
  forceClose?: boolean;
}

export interface ChangeAccountStatusRequest {
  accountId: string;
  status: AccountStatus;
  reason?: string;
  forceClose?: boolean;
}

export enum DisableReason {
  TRADING_RULE_BALANCE = "TRADING_RULE_BALANCE",
  TRADING_RULE_RUNUP = "TRADING_RULE_RUNUP",
  TRADING_RULE_MAX_DD = "TRADING_RULE_MAX_DD",
  TRADING_RULE_MAX_INTRADAY_DD = "TRADING_RULE_MAX_INTRADAY_DD",
  TRADING_RULE_MAX_INTRADAY_RUNUP = "TRADING_RULE_MAX_INTRADAY_RUNUP",
  TRADING_RULE_MAX_POS_OPEN_LOSS = "TRADING_RULE_MAX_POS_OPEN_LOSS",
  TRADING_RULE_MAX_POS_OPEN_GAIN = "TRADING_RULE_MAX_POS_OPEN_GAIN",
  TRADING_RULE_MAX_OPEN_LOSS = "TRADING_RULE_MAX_OPEN_LOSS",
  TRADING_RULE_MAX_OPEN_GAIN = "TRADING_RULE_MAX_OPEN_GAIN",
  TRADING_RULE_MAX_NUMBER_TRADES = "TRADING_RULE_MAX_NUMBER_TRADES",
  TRADING_RULE_OVERNIGHT = "TRADING_RULE_OVERNIGHT",
  TRADING_RULE_OVERWEEK = "TRADING_RULE_OVERWEEK",
}

// Trading Rules
export interface TradingRule {
  id?: string;
  name: string;
  description?: string;
  groupUniverseId?: string;
  maxDrawdown?: RiskParameter;
  runup?: RiskParameter;
  intradayDrawdown?: RiskParameter;
  intradayRunup?: RiskParameter;
  maxPositionLoss?: RiskParameter;
  maxPositionGain?: RiskParameter;
  maxPortfolioLoss?: RiskParameter;
  maxPortfolioGain?: RiskParameter;
  maxDailyTrades?: number;
  minSessionNumbers?: number;
  overnightAllowed?: boolean;
  overweekAllowed?: boolean;
}

export interface RiskParameter {
  enabled: boolean;
  action: RiskAction;
  value?: number;
  percentage?: number;
  selection?: RiskValueSelection;
  anchor?: RiskAnchor;
}

export enum RiskAction {
  None = 0,
  ChallengeFail = 1,
  Flat = 2,
  IntradayDisable = 3,
}

export enum RiskValueSelection {
  Value = 0,
  Percentage = 1,
  Both = 2,
}

export enum RiskAnchor {
  Balance = 0,
  Equity = 1,
}

export interface ChangeTradingRuleRequest {
  accountId: string;
  tradingRuleId: string;
}

// Group Universe
export interface GroupUniverse {
  id: string;
  name: string;
  description?: string;
  symbols: SymbolOverride[];
}

export interface SymbolOverride {
  symbol: string;
  margin?: number;
  commission?: number;
  enabled: boolean;
}

// Webhook Types
export interface WebhookEvent<T> {
  eventType: WebhookEventType;
  eventCategory: WebhookCategory;
  timestamp: string;
  data: T;
}

export enum WebhookCategory {
  Accounts = 0,
  Positions = 1,
  TradeReport = 3,
  OrganizationUser = 5,
}

export enum WebhookEventType {
  Created = 0,
  Updated = 1,
  Deleted = 2,
  Overnight = 3,
}

// Trade and Position Types
export interface Position {
  positionId: string;
  accountId: string;
  symbol: string;
  side: Side;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  unrealizedPnL: number;
  margin: number;
  openTime: string;
}

export enum Side {
  Buy = 0,
  Sell = 1,
}

export interface Trade {
  tradeId: string;
  accountId: string;
  symbol: string;
  side: Side;
  quantity: number;
  price: number;
  commission: number;
  realizedPnL: number;
  executionTime: string;
}

// Utility Types
export interface PaginationRequest {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}