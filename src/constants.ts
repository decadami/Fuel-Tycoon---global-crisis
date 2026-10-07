import { WorldEvent } from './types';

export const INITIAL_MONEY = 1500;
export const INITIAL_BASE_COST = 3.15;
export const INITIAL_GAS_PRICE = 3.50;
export const INITIAL_SATISFACTION = 80;
export const MAX_INVENTORY = 10000;
export const DAILY_MAINTENANCE = 150;
export const STORE_MAINTENANCE = 50;
export const CARWASH_MAINTENANCE = 80;
export const ELECTRIC_MAINTENANCE = 40;

export const POSSIBLE_EVENTS: Omit<WorldEvent, 'id' | 'duration'>[] = [
  {
    title: "OPEC Production Cut",
    description: "Major oil producers agree to slash output. Wholesale prices spike. EV interest rises.",
    type: 'WAR',
    costImpact: 1.45,
    demandImpact: 0.95,
    electricDemandImpact: 1.2,
    isBreaking: false,
  },
  {
    title: "Regional Pipeline Leak",
    description: "A major pipeline is offline for repairs. Local supply is tight. EV charging demand ticks up.",
    type: 'WAR',
    costImpact: 1.25,
    demandImpact: 1.0,
    electricDemandImpact: 1.1,
    isBreaking: true,
  },
  {
    title: "Strategic Reserve Release",
    description: "Government releases oil reserves to stabilize the market. Gas is cheap again.",
    type: 'DISCOVERY',
    costImpact: 0.85,
    demandImpact: 1.0,
    electricDemandImpact: 0.9,
    isBreaking: false,
  },
  {
    title: "Massive Shale Discovery",
    description: "New extraction techniques unlock vast reserves. Prices tumble. EV growth slows.",
    type: 'DISCOVERY',
    costImpact: 0.65,
    demandImpact: 1.05,
    electricDemandImpact: 0.8,
    isBreaking: false,
  },
  {
    title: "EV Tax Credit Expansion",
    description: "More people switching to electric. Gas demand is fading, but charging is booming.",
    type: 'NEW_FUEL',
    costImpact: 1.0,
    demandImpact: 0.75,
    electricDemandImpact: 1.85,
    isBreaking: false,
  },
  {
    title: "Public Transit Strike",
    description: "Buses and trains are down. Everyone is driving or charging today!",
    type: 'ECONOMIC_BOOM',
    costImpact: 1.05,
    demandImpact: 1.55,
    electricDemandImpact: 1.45,
    isBreaking: true,
  },
  {
    title: "Summer Travel Season",
    description: "Vacationers hitting the road. Demand is surging for all fuels.",
    type: 'ECONOMIC_BOOM',
    costImpact: 1.15,
    demandImpact: 1.35,
    electricDemandImpact: 1.25,
    isBreaking: false,
  },
  {
    title: "Severe Winter Storm",
    description: "People staying home. Driving is minimal, but the grid is strained by heating.",
    type: 'RECESSION',
    costImpact: 0.95,
    demandImpact: 0.45,
    electricCostImpact: 1.5,
    electricDemandImpact: 0.5,
    isBreaking: false,
  },
  {
    title: "Refinery Fire",
    description: "A major refinery is out of commission. Supply is critical. EV adoption accelerates.",
    type: 'WAR',
    costImpact: 1.65,
    demandImpact: 0.9,
    electricDemandImpact: 1.3,
    isBreaking: true,
  },
  {
    title: "Tech Sector Layoffs",
    description: "Commuting drops as the economy cools down. Energy demand falls across the board.",
    type: 'RECESSION',
    costImpact: 0.85,
    demandImpact: 0.8,
    electricDemandImpact: 0.85,
    isBreaking: false,
  },
  {
    title: "Nuclear Plant Collapse",
    description: "A major power plant is offline. Electricity prices spike. People revert to gas cars.",
    type: 'WAR',
    costImpact: 1.1,
    demandImpact: 1.4,
    electricCostImpact: 2.5,
    isBreaking: true,
  },
  {
    title: "Solar Breakthrough",
    description: "New panel efficiency records. Electricity is cheap. Gas demand takes a hit.",
    type: 'DISCOVERY',
    costImpact: 1.0,
    demandImpact: 0.8,
    electricCostImpact: 0.5,
    isBreaking: false,
  },
  {
    title: "Grid Overload",
    description: "Heatwave causing strain on the grid. EVs are stuck; gas cars are the only option.",
    type: 'WAR',
    costImpact: 1.1,
    demandImpact: 1.3,
    electricCostImpact: 1.4,
    electricDemandImpact: 1.2,
    isBreaking: true,
  }
];
