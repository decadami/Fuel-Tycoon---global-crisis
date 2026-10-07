export type EventType = 'WAR' | 'DISCOVERY' | 'NEW_FUEL' | 'NEW_ENGINE' | 'ECONOMIC_BOOM' | 'RECESSION' | 'NORMAL';

export interface WorldEvent {
  id: string;
  title: string;
  description: string;
  type: EventType;
  costImpact: number; // Multiplier for base cost
  demandImpact: number; // Multiplier for demand
  electricCostImpact?: number; // Multiplier for electric cost
  electricDemandImpact?: number; // Multiplier for electric demand
  duration: number; // Days
  isBreaking?: boolean;
  startDay?: number;
  startHour?: number;
}

export interface GameState {
  money: number;
  gasPrice: number;
  baseCost: number;
  satisfaction: number; // 0 to 100
  day: number;
  hour: number;
  minute: number;
  inventory: number;
  maxInventory: number;
  activeEvents: WorldEvent[];
  history: {
    day: number;
    profit: number;
    satisfaction: number;
  }[];
  dailyStats: {
    revenue: number;
    sales: number;
    profit: number;
    gasRevenue: number;
    electricRevenue: number;
    storeRevenue: number;
    carWashRevenue: number;
    adRevenueBoost: number;
    maintenanceCosts: number;
    marketingCosts: number;
    restockCosts: number;
    upgradeCosts: number;
  };
  playerName: string;
  isGameOver: boolean;
  gameOverReason: string;
  showSummary: boolean;
  showNewsPreview: boolean;
  isClosed: boolean;
  breakingNews: WorldEvent | null;
  helpType: string | null;
  showWelcome: boolean;
  showCloseConfirm: boolean;
  expiredEvents: WorldEvent[];
  showSupportModal: boolean;
  showHighPriceWarning: boolean;
  showOutOfFuelWarning: boolean;
  hasShownOutOfFuelWarning: boolean;
  eventEnding: WorldEvent | null;
  highPriceWarningCooldown: number; // Game minutes
  adExpiryDay: number | null;
  adExpiryHour: number | null;
  hasConvenienceStore: boolean;
  hasCarWash: boolean;
  hasElectricStation: boolean;
  electricPrice: number;
  electricBaseCost: number;
  tutorialStep: number;
}
