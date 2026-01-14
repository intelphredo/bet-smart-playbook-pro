import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object Model for the main application pages
 * Provides reusable selectors and actions for E2E tests
 */

export class HomePage {
  readonly page: Page;
  readonly matchCards: Locator;
  readonly leagueFilter: Locator;
  readonly dateFilter: Locator;
  readonly betSlipButton: Locator;
  readonly navigationLinks: Locator;
  readonly loadingSpinner: Locator;

  constructor(page: Page) {
    this.page = page;
    this.matchCards = page.locator('[data-testid="match-card"]');
    this.leagueFilter = page.locator('[data-testid="league-filter"]');
    this.dateFilter = page.locator('[data-testid="date-filter"]');
    this.betSlipButton = page.locator('[data-testid="bet-slip-button"]');
    this.navigationLinks = page.locator('nav a');
    this.loadingSpinner = page.locator('[data-testid="loading"]');
  }

  async goto() {
    await this.page.goto('/');
  }

  async waitForLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  async selectLeague(league: string) {
    await this.leagueFilter.click();
    await this.page.getByRole('option', { name: league }).click();
  }

  async clickMatchCard(index: number = 0) {
    await this.matchCards.nth(index).click();
  }

  async openBetSlip() {
    await this.betSlipButton.click();
  }
}

export class AuthPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;
  readonly signUpButton: Locator;
  readonly toggleAuthMode: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByPlaceholder(/email/i);
    this.passwordInput = page.getByPlaceholder(/password/i);
    this.signInButton = page.getByRole('button', { name: /sign in/i });
    this.signUpButton = page.getByRole('button', { name: /sign up/i });
    this.toggleAuthMode = page.getByRole('button', { name: /create|have an account/i });
    this.errorMessage = page.locator('[role="alert"]');
  }

  async goto() {
    await this.page.goto('/auth');
  }

  async signIn(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }

  async signUp(email: string, password: string) {
    await this.toggleAuthMode.click();
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signUpButton.click();
  }
}

export class BetSlipPage {
  readonly page: Page;
  readonly betSlipDrawer: Locator;
  readonly betSlipItems: Locator;
  readonly stakeInput: Locator;
  readonly placeBetButton: Locator;
  readonly clearAllButton: Locator;
  readonly parlayToggle: Locator;
  readonly potentialPayout: Locator;
  readonly closeButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.betSlipDrawer = page.locator('[data-testid="bet-slip-drawer"]');
    this.betSlipItems = page.locator('[data-testid="bet-slip-item"]');
    this.stakeInput = page.locator('input[type="number"]');
    this.placeBetButton = page.getByRole('button', { name: /place bet/i });
    this.clearAllButton = page.getByRole('button', { name: /clear all/i });
    this.parlayToggle = page.locator('[data-testid="parlay-toggle"]');
    this.potentialPayout = page.locator('[data-testid="potential-payout"]');
    this.closeButton = page.locator('[data-testid="close-bet-slip"]');
  }

  async enterStake(stake: number) {
    await this.stakeInput.first().fill(stake.toString());
  }

  async placeBet() {
    await this.placeBetButton.click();
  }

  async clearAll() {
    await this.clearAllButton.click();
  }

  async toggleParlay() {
    await this.parlayToggle.click();
  }
}

export class BetHistoryPage {
  readonly page: Page;
  readonly betRows: Locator;
  readonly filterButtons: Locator;
  readonly statsCards: Locator;
  readonly refreshButton: Locator;
  readonly tabs: Locator;

  constructor(page: Page) {
    this.page = page;
    this.betRows = page.locator('[data-testid="bet-row"]');
    this.filterButtons = page.locator('[data-testid="filter-button"]');
    this.statsCards = page.locator('[data-testid="stat-card"]');
    this.refreshButton = page.getByRole('button', { name: /refresh/i });
    this.tabs = page.getByRole('tab');
  }

  async goto() {
    await this.page.goto('/bet-history');
  }

  async selectTab(tabName: string) {
    await this.tabs.getByText(tabName).click();
  }

  async filterByStatus(status: string) {
    await this.filterButtons.getByText(status).click();
  }
}

export class PredictionsPage {
  readonly page: Page;
  readonly predictionCards: Locator;
  readonly algorithmSelector: Locator;
  readonly confidenceIndicators: Locator;
  readonly refreshButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.predictionCards = page.locator('[data-testid="prediction-card"]');
    this.algorithmSelector = page.locator('[data-testid="algorithm-selector"]');
    this.confidenceIndicators = page.locator('[data-testid="confidence"]');
    this.refreshButton = page.getByRole('button', { name: /refresh/i });
  }

  async goto() {
    await this.page.goto('/predictions');
  }

  async selectAlgorithm(algorithm: string) {
    await this.algorithmSelector.click();
    await this.page.getByRole('option', { name: algorithm }).click();
  }
}
