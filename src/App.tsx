import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Fuel, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  AlertTriangle, 
  Newspaper, 
  Play,
  RotateCcw,
  Info,
  Droplets,
  BarChart3,
  Clock,
  Plus,
  Minus,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  ShoppingBag,
  Globe,
  Apple,
  Smartphone,
  Heart,
  Coffee,
  Gamepad2,
  Zap,
  ExternalLink,
  X
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  GameState, 
  WorldEvent 
} from './types';
import GasStationVisual from './components/GasStationVisual';
import { 
  INITIAL_MONEY, 
  INITIAL_BASE_COST, 
  INITIAL_GAS_PRICE, 
  INITIAL_SATISFACTION, 
  MAX_INVENTORY, 
  DAILY_MAINTENANCE,
  STORE_MAINTENANCE,
  CARWASH_MAINTENANCE,
  ELECTRIC_MAINTENANCE,
  POSSIBLE_EVENTS 
} from './constants';

export default function App() {
  const [state, setState] = useState<GameState>({
    money: INITIAL_MONEY,
    gasPrice: INITIAL_GAS_PRICE,
    baseCost: INITIAL_BASE_COST,
    satisfaction: INITIAL_SATISFACTION,
    day: 1,
    hour: 6, // Start at 6 AM
    minute: 0,
    inventory: MAX_INVENTORY * 0.5,
    maxInventory: MAX_INVENTORY,
    activeEvents: [],
    history: [],
    dailyStats: { 
      revenue: 0, 
      sales: 0, 
      profit: 0,
      gasRevenue: 0,
      electricRevenue: 0,
      storeRevenue: 0,
      carWashRevenue: 0,
      adRevenueBoost: 0,
      maintenanceCosts: 0,
      marketingCosts: 0,
      restockCosts: 0,
      upgradeCosts: 0
    },
    playerName: 'Tycoon',
    isGameOver: false,
    gameOverReason: '',
    showSummary: false,
    showNewsPreview: false,
    isClosed: false,
    breakingNews: null,
    helpType: null,
    showWelcome: true,
    showCloseConfirm: false,
    expiredEvents: [],
    showSupportModal: false,
    showHighPriceWarning: false,
    showOutOfFuelWarning: false,
    hasShownOutOfFuelWarning: false,
    eventEnding: null,
    highPriceWarningCooldown: 0,
    adExpiryDay: null,
    adExpiryHour: null,
    hasConvenienceStore: false,
    hasCarWash: false,
    hasElectricStation: false,
    electricPrice: 0.45,
    electricBaseCost: 0.12,
    tutorialStep: 0,
  });

  const [logs, setLogs] = useState<string[]>(["Station is OPEN for business."]);
  const [isPaused, setIsPaused] = useState(false);
  const priceIntervalRef = React.useRef<any>(null);

  const startPriceChange = (delta: number, type: 'gas' | 'electric' = 'gas') => {
    if (priceIntervalRef.current) return;
    
    const field = type === 'gas' ? 'gasPrice' : 'electricPrice';
    const min = type === 'gas' ? 0.1 : 0.01;
    
    // Immediate change
    setState(s => ({ ...s, [field]: Math.max(min, s[field] + delta) }));
    
    // Start interval after a short delay (300ms)
    priceIntervalRef.current = setTimeout(() => {
      priceIntervalRef.current = setInterval(() => {
        setState(s => ({ ...s, [field]: Math.max(min, s[field] + delta) }));
      }, 50);
    }, 300);
  };

  const stopPriceChange = () => {
    if (priceIntervalRef.current) {
      clearTimeout(priceIntervalRef.current);
      clearInterval(priceIntervalRef.current);
      priceIntervalRef.current = null;
    }
  };

  const addLog = (msg: string) => {
    setLogs(prev => [msg, ...prev].slice(0, 20));
  };

  // Game Loop
  useEffect(() => {
    const interval = setInterval(() => {
      setState(prev => {
        if (
          prev.isGameOver || 
          prev.showSummary || 
          prev.showNewsPreview || 
          prev.breakingNews || 
          prev.helpType || 
          isPaused || 
          prev.isClosed || 
          prev.showHighPriceWarning || 
          prev.showOutOfFuelWarning || 
          prev.eventEnding || 
          prev.showWelcome ||
          prev.showSupportModal ||
          prev.showCloseConfirm ||
          prev.expiredEvents.length > 0
        ) {
          return prev;
        }

        let nextMinute = prev.minute + 10;
        let nextHour = prev.hour;
        let shouldAutoClose = false;

        if (nextMinute >= 60) {
          nextMinute = 0;
          nextHour += 1;
        }

        // Auto-close at 10 PM (22:00)
        if (nextHour >= 22) {
          shouldAutoClose = true;
        }

        // Randomly trigger breaking news during the day (0.3% chance per 10 mins)
        let newBreakingNews = null;
        
        const newlyExpired = prev.activeEvents.filter(e => {
          if (e.startDay === undefined || e.startHour === undefined) return false;
          const expireDay = e.startDay + e.duration;
          const expireHour = e.startHour;
          
          const hasExpired = (prev.day > expireDay) || (prev.day === expireDay && prev.hour >= expireHour);
          return hasExpired;
        });

        let newActiveEvents = prev.activeEvents.filter(e => !newlyExpired.find(ne => ne.id === e.id));
        const updatedExpiredEvents = [...prev.expiredEvents, ...newlyExpired];
        
        // Trigger event ending popup if any event just expired
        const eventEnding = newlyExpired.length > 0 ? newlyExpired[0] : null;

        // Reduced breaking news chance (0.15%) and only if less than 2 events active
        if (Math.random() < 0.0015 && newActiveEvents.length < 2) {
          const breakingTemplates = POSSIBLE_EVENTS.filter(e => e.isBreaking);
          const randomEventTemplate = breakingTemplates[Math.floor(Math.random() * breakingTemplates.length)];
          newBreakingNews = {
            ...randomEventTemplate,
            id: 'breaking-' + Math.random().toString(36).substr(2, 9),
            duration: 3, // Increased to 3 days to ensure it lasts at least two full shifts
            startDay: prev.day,
            startHour: prev.hour,
          };
          newActiveEvents.unshift(newBreakingNews);
        }

        // Calculate current impacts from events
        let currentCostMult = 1;
        let currentDemandMult = 1;
        let currentElectricCostMult = 1;
        let currentElectricDemandMult = 1;

        newActiveEvents.forEach(e => {
          currentCostMult *= e.costImpact;
          currentDemandMult *= e.demandImpact;
          if (e.electricCostImpact) currentElectricCostMult *= e.electricCostImpact;
          if (e.electricDemandImpact) currentElectricDemandMult *= e.electricDemandImpact;
        });

        // Advertising impact
        const isAdActive = prev.adExpiryDay !== null && 
          (prev.day < prev.adExpiryDay || (prev.day === prev.adExpiryDay && prev.hour < (prev.adExpiryHour || 0)));
        
        if (isAdActive) {
          currentDemandMult *= 1.35; // 35% demand boost from ads
          currentElectricDemandMult *= 1.35;
        }

        const currentBaseCost = INITIAL_BASE_COST * currentCostMult;
        const currentElectricBaseCost = 0.12 * currentElectricCostMult;
        
        // Calculate Real-time Demand (per 10 mins)
        // Steeper demand curve: customers are very sensitive to price
        const priceRatio = prev.gasPrice / currentBaseCost;
        let demand = (12 + Math.random() * 12) * currentDemandMult;
        
        demand *= (prev.satisfaction / 100);

        // If price is more than 5% above cost, demand starts dropping fast
        if (priceRatio > 1.05) {
          demand *= Math.pow(0.4, (priceRatio - 1.05) * 8);
        }
        // If price is below cost, demand increases
        if (priceRatio < 1.0) {
          demand *= (1 + (1 - priceRatio) * 2);
        }

        const actualSales = Math.min(prev.inventory, Math.floor(demand));
        
        // Electric Station Logic
        let electricRevenue = 0;
        let electricCost = 0;
        let electricSales = 0;
        if (prev.hasElectricStation) {
          const electricPriceRatio = prev.electricPrice / currentElectricBaseCost;
          let eDemand = (4 + Math.random() * 4) * currentElectricDemandMult;
          eDemand *= (prev.satisfaction / 100);

          if (electricPriceRatio > 1.2) {
            eDemand *= Math.pow(0.5, (electricPriceRatio - 1.2) * 5);
          }

          electricSales = Math.floor(eDemand);
          electricRevenue = electricSales * prev.electricPrice;
          electricCost = electricSales * currentElectricBaseCost;
        }

        // Convenience Store & Car Wash Logic (influenced by density/demand)
        let storeRevenue = 0;
        let carWashRevenue = 0;
        const density = demand / 24; // Normalized density

        if (prev.hasConvenienceStore) {
          // Store revenue: $2-$5 per customer-density unit
          storeRevenue = (density * (2 + Math.random() * 3)) * 5; 
        }

        if (prev.hasCarWash) {
          // Car wash: 15% of customers use it, $12 per wash
          const washCustomers = demand * 0.15;
          carWashRevenue = washCustomers * 12;
        }

        // Check for warnings
        let showHighPriceWarning = false;
        let newHighPriceWarningCooldown = Math.max(0, prev.highPriceWarningCooldown - 10);

        if (demand < 1 && prev.gasPrice / currentBaseCost > 1.2 && newHighPriceWarningCooldown === 0) {
          showHighPriceWarning = true;
          newHighPriceWarningCooldown = 120; // 2 hours of game time cooldown (~2.4 seconds)
        }

        let showOutOfFuelWarning = false;
        let hasShownOutOfFuelWarning = prev.hasShownOutOfFuelWarning;
        
        if (prev.inventory <= 0 && !prev.isClosed) {
          if (!hasShownOutOfFuelWarning) {
            showOutOfFuelWarning = true;
            hasShownOutOfFuelWarning = true;
          }
        } else if (prev.inventory > 0) {
          hasShownOutOfFuelWarning = false;
        }

        const revenue = (actualSales * prev.gasPrice) + electricRevenue + storeRevenue + carWashRevenue;
        const costOfGoods = (actualSales * currentBaseCost) + electricCost;
        const profit = revenue - costOfGoods;

        let adRevenueBoost = 0;
        if (isAdActive) {
          // Ad boost is 35% of demand. 
          // So 0.35 / 1.35 of the total revenue is from ads.
          adRevenueBoost = revenue * (0.35 / 1.35);
        }

        let satisfactionChange = 0;
        if (priceRatio < 1.05) satisfactionChange = 0.25; // Very fair price
        else if (priceRatio < 1.12) satisfactionChange = 0.10; // Fair price
        else if (priceRatio > 1.20) satisfactionChange = -0.3; // Expensive
        else if (priceRatio > 1.35) satisfactionChange = -0.8; // Gouging
        
        const newSatisfaction = Math.max(0, Math.min(100, prev.satisfaction + satisfactionChange));

        // Check Game Over
        let isGameOver = false;
        let gameOverReason = '';
        
        if (newSatisfaction < 10) {
          isGameOver = true;
          gameOverReason = "Riot! Customers have destroyed your station due to poor service and high prices.";
        }

        const finalDailyStats = {
          revenue: prev.dailyStats.revenue + revenue,
          sales: prev.dailyStats.sales + actualSales,
          profit: prev.dailyStats.profit + profit,
          gasRevenue: prev.dailyStats.gasRevenue + (actualSales * prev.gasPrice),
          electricRevenue: prev.dailyStats.electricRevenue + electricRevenue,
          storeRevenue: prev.dailyStats.storeRevenue + storeRevenue,
          carWashRevenue: prev.dailyStats.carWashRevenue + carWashRevenue,
          adRevenueBoost: (prev.dailyStats.adRevenueBoost || 0) + adRevenueBoost,
          maintenanceCosts: prev.dailyStats.maintenanceCosts || 0,
          marketingCosts: prev.dailyStats.marketingCosts || 0,
          restockCosts: prev.dailyStats.restockCosts || 0,
          upgradeCosts: prev.dailyStats.upgradeCosts || 0
        };

        if (shouldAutoClose) {
          // Calculate total maintenance
          let totalMaintenance = DAILY_MAINTENANCE;
          if (prev.hasConvenienceStore) totalMaintenance += STORE_MAINTENANCE;
          if (prev.hasCarWash) totalMaintenance += CARWASH_MAINTENANCE;
          if (prev.hasElectricStation) totalMaintenance += ELECTRIC_MAINTENANCE;

          finalDailyStats.maintenanceCosts = totalMaintenance;

          const endOfDayProfit = finalDailyStats.profit - totalMaintenance;
          const finalHistory = [...prev.history, { day: prev.day, profit: endOfDayProfit, satisfaction: newSatisfaction }].slice(-10);
          const finalMoney = prev.money + revenue - totalMaintenance;

          if (finalMoney < 0) {
            isGameOver = true;
            gameOverReason = "Bankrupt! You couldn't afford the daily maintenance fees.";
          }
          
          return {
            ...prev,
            money: finalMoney,
            satisfaction: newSatisfaction,
            inventory: prev.inventory - actualSales,
            dailyStats: finalDailyStats,
            history: finalHistory,
            isGameOver,
            gameOverReason,
            showSummary: true,
            isClosed: true,
            hour: 22,
            minute: 0,
            breakingNews: null,
            activeEvents: newActiveEvents,
            expiredEvents: updatedExpiredEvents,
            eventEnding: eventEnding
          };
        }

        return {
          ...prev,
          money: prev.money + revenue,
          satisfaction: newSatisfaction,
          hour: nextHour,
          minute: nextMinute,
          inventory: prev.inventory - actualSales,
          baseCost: currentBaseCost,
          electricBaseCost: currentElectricBaseCost,
          dailyStats: finalDailyStats,
          isGameOver,
          gameOverReason,
          breakingNews: newBreakingNews,
          activeEvents: newActiveEvents,
          expiredEvents: updatedExpiredEvents,
          showHighPriceWarning,
          showOutOfFuelWarning,
          hasShownOutOfFuelWarning,
          eventEnding: eventEnding,
          highPriceWarningCooldown: newHighPriceWarningCooldown
        };
      });
    }, 200);

    return () => clearInterval(interval);
  }, [state.isGameOver, state.showSummary, state.showNewsPreview, state.breakingNews, state.helpType, isPaused, state.isClosed, state.gasPrice, state.showHighPriceWarning, state.showOutOfFuelWarning, state.eventEnding, state.showWelcome]);

  // Tutorial and Start Flow
  const startDayOne = () => {
    setState(prev => {
      // Potentially generate a starting event for Day 1
      let initialEvents: WorldEvent[] = [];
      if (Math.random() < 0.5) {
        const standardTemplates = POSSIBLE_EVENTS.filter(e => !e.isBreaking);
        const randomEventTemplate = standardTemplates[Math.floor(Math.random() * standardTemplates.length)];
        initialEvents.push({
          ...randomEventTemplate,
          id: Math.random().toString(36).substr(2, 9),
          duration: Math.floor(Math.random() * 3) + 3,
          startDay: 1,
          startHour: 6,
        });
      }

      let currentCostMult = 1;
      initialEvents.forEach(e => {
        currentCostMult *= e.costImpact;
      });

      return {
        ...prev,
        showWelcome: false,
        showNewsPreview: true,
        activeEvents: initialEvents,
        baseCost: INITIAL_BASE_COST * currentCostMult,
      };
    });
  };

  const nextTutorialStep = () => {
    setState(p => ({ ...p, tutorialStep: p.tutorialStep + 1 }));
  };

  const showNews = () => {
    setState(prev => {
      const nextDay = prev.day + 1;
      
      let finalActiveEvents = [...prev.activeEvents];

      // Dynamic event triggering for a more relaxed pace
      // 30% chance if no events, 10% if 1 event, 0% if 2+ events
      let spawnChance = 0.30;
      if (finalActiveEvents.length === 1) spawnChance = 0.10;
      if (finalActiveEvents.length >= 2) spawnChance = 0;

      if (Math.random() < spawnChance) {
        const standardTemplates = POSSIBLE_EVENTS.filter(e => !e.isBreaking);
        const randomEventTemplate = standardTemplates[Math.floor(Math.random() * standardTemplates.length)];
        const newEvent: WorldEvent = {
          ...randomEventTemplate,
          id: Math.random().toString(36).substr(2, 9),
          duration: Math.floor(Math.random() * 5) + 4, // Increased from 3-7 to 4-8
          startDay: nextDay,
          startHour: 6, // Standard events start at opening
        };
        finalActiveEvents.unshift(newEvent);
      }

      // Calculate the base cost for the next day already
      let currentCostMult = 1;
      finalActiveEvents.forEach(e => {
        currentCostMult *= e.costImpact;
      });
      const nextDayBaseCost = INITIAL_BASE_COST * currentCostMult;

      return {
        ...prev,
        day: prev.day + 1,
        showSummary: false,
        showNewsPreview: true,
        activeEvents: finalActiveEvents,
        expiredEvents: prev.expiredEvents,
        baseCost: nextDayBaseCost,
        dailyStats: { 
          revenue: 0, 
          sales: 0, 
          profit: 0,
          gasRevenue: 0,
          electricRevenue: 0,
          storeRevenue: 0,
          carWashRevenue: 0,
          adRevenueBoost: 0,
          maintenanceCosts: 0,
          marketingCosts: 0,
          restockCosts: 0,
          upgradeCosts: 0
        }
      };
    });
  };

  // Start Next Day
  const startNextDay = () => {
    setState(prev => ({
      ...prev,
      showNewsPreview: false,
      isClosed: false,
      hour: 6,
      minute: 0
    }));
    addLog(`Day ${state.day} - Station is OPEN.`);
  };

  // Effect to add logs when news arrives
  useEffect(() => {
    const latestEvent = state.activeEvents[state.activeEvents.length - 1];
    if (latestEvent && state.day > 1 && state.showNewsPreview) {
      addLog(`BREAKING: ${latestEvent.title}`);
    }
  }, [state.activeEvents.length, state.showNewsPreview]);

  const buyInventory = (amount: number) => {
    const cost = amount * state.baseCost;
    if (state.money >= cost && state.inventory + amount <= state.maxInventory) {
      setState(prev => ({
        ...prev,
        money: prev.money - cost,
        inventory: prev.inventory + amount,
        dailyStats: {
          ...prev.dailyStats,
          restockCosts: prev.dailyStats.restockCosts + cost
        }
      }));
      addLog(`Purchased ${amount} units of fuel.`);
    }
  };

  const expandReservoir = () => {
    const cost = 2500;
    if (state.money >= cost) {
      setState(prev => ({
        ...prev,
        money: prev.money - cost,
        maxInventory: prev.maxInventory + 5000,
        dailyStats: {
          ...prev.dailyStats,
          upgradeCosts: prev.dailyStats.upgradeCosts + cost
        }
      }));
      addLog("Reservoir expanded! +5000 capacity.");
    }
  };

  const buyAdvertising = () => {
    const cost = 750;
    if (state.money >= cost) {
      // Ad lasts 24 game hours
      const expiryDay = state.day + 1;
      const expiryHour = state.hour;
      
      setState(prev => ({
        ...prev,
        money: prev.money - cost,
        adExpiryDay: expiryDay,
        adExpiryHour: expiryHour,
        dailyStats: {
          ...prev.dailyStats,
          marketingCosts: prev.dailyStats.marketingCosts + cost
        }
      }));
      addLog("Ad campaign started! Demand boosted for 24h.");
    }
  };

  const resetGame = () => {
    setState({
      money: INITIAL_MONEY,
      gasPrice: INITIAL_GAS_PRICE,
      baseCost: INITIAL_BASE_COST,
      satisfaction: INITIAL_SATISFACTION,
      day: 1,
      hour: 6,
      minute: 0,
      inventory: MAX_INVENTORY * 0.5,
      maxInventory: MAX_INVENTORY,
      activeEvents: [],
      history: [],
      dailyStats: { 
        revenue: 0, 
        sales: 0, 
        profit: 0,
        gasRevenue: 0,
        electricRevenue: 0,
        storeRevenue: 0,
        carWashRevenue: 0,
        maintenanceCosts: 0
      },
      isGameOver: false,
      gameOverReason: '',
      showSummary: false,
      showNewsPreview: false,
      showCloseConfirm: false,
      isClosed: false,
      breakingNews: null,
      helpType: null,
      showWelcome: false,
      expiredEvents: [],
      showSupportModal: false,
      showHighPriceWarning: false,
      showOutOfFuelWarning: false,
      hasShownOutOfFuelWarning: false,
      eventEnding: null,
      highPriceWarningCooldown: 0,
      adExpiryDay: null,
      adExpiryHour: null,
      hasConvenienceStore: false,
      hasCarWash: false,
      hasElectricStation: false,
      electricPrice: 0.45,
      electricBaseCost: 0.12,
    });
    setLogs(["Game Reset. Station is OPEN."]);
  };

  const lastDay = state.history[state.history.length - 1];

  const getRemainingTime = (event: WorldEvent) => {
    if (event.startDay === undefined || event.startHour === undefined) {
      return `${event.duration} DAYS LEFT`;
    }
    
    const expireDay = event.startDay + event.duration;
    const expireHour = event.startHour;
    
    const totalHoursLeft = (expireDay - state.day) * 24 + (expireHour - state.hour);
    
    if (totalHoursLeft <= 0) return "EXPIRED";
    
    if (totalHoursLeft < 24) {
      return `${totalHoursLeft}H LEFT`;
    }
    
    const daysLeft = Math.floor(totalHoursLeft / 24);
    const hoursLeft = totalHoursLeft % 24;
    
    if (hoursLeft === 0) {
      return `${daysLeft}D LEFT`;
    }
    
    return `${daysLeft}D ${hoursLeft}H LEFT`;
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#141414] font-sans selection:bg-[#141414] selection:text-white">
      {/* Top Header Bar */}
      <div className="bg-[#141414] text-white py-2 px-4 flex justify-between items-center overflow-hidden relative">
        <div className="flex items-center gap-4 z-10">
          <div className="flex items-center gap-2">
            <Fuel className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Fuel Tycoon</span>
          </div>
          <div className="h-3 w-[1px] bg-white/20" />
          <div className="text-[10px] uppercase tracking-widest opacity-60">
            Sector 7G • Industrial District
          </div>
        </div>
        <div className="flex items-center gap-4 z-10">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${!state.isClosed ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-[10px] font-bold uppercase tracking-widest">
              {!state.isClosed ? 'Station Active' : 'Station Closed'}
            </span>
          </div>
        </div>
        {/* Decorative background element */}
        <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-emerald-500/10 to-transparent skew-x-12 transform translate-x-20" />
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Visual Representation */}
        <GasStationVisual 
          hour={state.hour} 
          minute={state.minute} 
          density={state.satisfaction} 
          activeEvents={state.activeEvents}
          isClosed={state.isClosed}
          isAdActive={state.adExpiryDay !== null && (state.day < state.adExpiryDay || (state.day === state.adExpiryDay && state.hour < (state.adExpiryHour || 0)))}
          hasCarWash={state.hasCarWash}
          hasConvenienceStore={state.hasConvenienceStore}
        />

        {/* Header Stats */}
        <header className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <StatCard 
            label="Time & Day" 
            value={`${state.hour.toString().padStart(2, '0')}:${state.minute.toString().padStart(2, '0')} (Day ${state.day})`} 
            icon={<Clock className="w-4 h-4" />} 
            description="Operating hours: 06:00 - 22:00."
            status={!state.isClosed && !state.isGameOver ? 'Open' : 'Closed'}
            onHelp={() => setState(s => ({ ...s, helpType: 'time' }))}
            className="bg-slate-50"
          />
          <StatCard 
            label="Balance" 
            value={`$${state.money.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
            icon={<DollarSign className="w-4 h-4" />} 
            color={state.money < 300 ? "text-red-600" : "text-emerald-700"}
            description={`Your total cash. Net Worth (Cash + Inventory): $${(state.money + state.inventory * state.baseCost).toFixed(2)}`}
            onHelp={() => setState(s => ({ ...s, helpType: 'balance' }))}
            className={`${state.money < 300 ? 'bg-red-50 border-red-200 animate-pulse' : 'bg-emerald-50'}`}
          />
          <StatCard 
            label="Satisfaction" 
            value={`${Math.round(state.satisfaction)}%`} 
            icon={<Users className="w-4 h-4" />} 
            color={state.satisfaction < 30 ? "text-red-600" : "text-blue-700"}
            description="How happy your customers are. Low satisfaction leads to riots."
            onHelp={() => setState(s => ({ ...s, helpType: 'satisfaction' }))}
            className="bg-blue-50"
          />
          <StatCard 
            label="Density" 
            icon={<Users className="w-4 h-4" />} 
            description="Real-time customer traffic at your pumps."
            onHelp={() => setState(s => ({ ...s, helpType: 'density' }))}
            className="bg-zinc-50"
          >
            <div className="flex gap-0.5 h-full items-end">
              {Array.from({ length: 12 }).map((_, i) => {
                const isActive = i < Math.floor(state.satisfaction / 8.33);
                return (
                  <motion.div 
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: isActive ? '100%' : '10%' }}
                    className={`w-1.5 transition-colors ${isActive ? 'bg-[#141414]' : 'bg-gray-200'}`}
                  />
                );
              })}
            </div>
          </StatCard>
          <StatCard 
            label="Daily Profit" 
            value={`$${state.dailyStats.profit.toFixed(2)}`} 
            icon={state.dailyStats.profit >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />} 
            color={state.dailyStats.profit < 0 ? "text-red-600" : "text-emerald-700"}
            description="Your net earnings today. If this is red, you're selling below cost!"
            onHelp={() => setState(s => ({ ...s, helpType: 'profit' }))}
            className="bg-emerald-50"
          />
          <StatCard 
            label="Wholesale Cost" 
            value={`$${state.baseCost.toFixed(2)}/u`} 
            icon={<Droplets className="w-4 h-4" />} 
            description="The current cost to buy fuel. Changes based on global events."
            onHelp={() => setState(s => ({ ...s, helpType: 'wholesale' }))}
            className="bg-amber-50"
          />
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Station Controls & Visualization */}
          <section className="lg:col-span-1 space-y-8">
            <div className="bg-slate-50 border-2 border-[#141414] p-6 rounded-none shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] relative overflow-hidden">
              <h2 className="font-serif italic text-xl mb-6 flex items-center justify-between relative z-10">
                <span className="flex items-center gap-2"><Fuel className="w-5 h-5" /> Station Controls</span>
                <button 
                  onClick={() => setState(s => ({ ...s, helpType: 'controls' }))}
                  className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <HelpCircle className="w-4 h-4 opacity-30" />
                </button>
              </h2>
            
              <div className="space-y-8 relative z-10">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-4">
                  Fuel Price Adjustment
                </label>
                <div className="flex items-center gap-3">
                  {/* Decrease Group */}
                  <div className="flex flex-col gap-1">
                    <button 
                      onClick={() => setState(s => ({ ...s, gasPrice: Math.max(0.1, s.gasPrice - 0.05) }))}
                      className="p-3 border-2 border-[#141414] bg-white hover:bg-[#141414] hover:text-white transition-all active:scale-95 shadow-[1px_1px_0px_0px_rgba(20,20,20,1)] active:shadow-none active:translate-x-[1px] active:translate-y-[1px]"
                      title="-$0.05"
                    >
                      <ChevronDown className="w-5 h-5" />
                    </button>
                    <button 
                      onMouseDown={() => startPriceChange(-0.01)}
                      onMouseUp={stopPriceChange}
                      onMouseLeave={stopPriceChange}
                      onTouchStart={() => startPriceChange(-0.01)}
                      onTouchEnd={stopPriceChange}
                      className="p-3 border-2 border-[#141414] bg-white hover:bg-[#141414] hover:text-white transition-all active:scale-95 shadow-[1px_1px_0px_0px_rgba(20,20,20,1)] active:shadow-none active:translate-x-[1px] active:translate-y-[1px]"
                      title="Hold to Scroll (-$0.01)"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex-1 text-center bg-white border-2 border-[#141414] py-4 px-3 relative">
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-white px-2 text-[7px] font-black uppercase tracking-widest border border-[#141414]">Display</div>
                    <div className="font-mono text-2xl font-black flex flex-col items-center justify-center gap-0.5">
                      <span className="tracking-tighter">${state.gasPrice.toFixed(2)}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${state.gasPrice > state.baseCost ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                        {state.gasPrice > state.baseCost ? 'PROFIT' : 'LOSS'}: {state.gasPrice > state.baseCost ? '+' : ''}{(state.gasPrice - state.baseCost).toFixed(2)}
                      </span>
                    </div>
                    {/* Demand Indicator */}
                    <div className="mt-3 flex justify-center gap-0.5">
                      {[1, 2, 3, 4, 5, 6].map((i) => {
                        const priceRatio = state.gasPrice / state.baseCost;
                        let strength = 1;
                        if (priceRatio > 1.05) strength = Math.pow(0.4, (priceRatio - 1.05) * 8);
                        if (priceRatio < 1.0) strength = (1 + (1 - priceRatio) * 2);
                        
                        const isActive = (i / 6) <= strength;
                        return (
                          <div 
                            key={i} 
                            className={`h-1 w-3 transition-all duration-300 ${isActive ? (strength > 1.2 ? 'bg-blue-500 shadow-[0_0_4px_rgba(59,130,246,0.5)]' : 'bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.5)]') : 'bg-gray-200'}`}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Increase Group */}
                  <div className="flex flex-col gap-1">
                    <button 
                      onMouseDown={() => startPriceChange(0.01)}
                      onMouseUp={stopPriceChange}
                      onMouseLeave={stopPriceChange}
                      onTouchStart={() => startPriceChange(0.01)}
                      onTouchEnd={stopPriceChange}
                      className="p-3 border-2 border-[#141414] bg-white hover:bg-[#141414] hover:text-white transition-all active:scale-95 shadow-[1px_1px_0px_0px_rgba(20,20,20,1)] active:shadow-none active:translate-x-[1px] active:translate-y-[1px]"
                      title="Hold to Scroll (+$0.01)"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => setState(s => ({ ...s, gasPrice: s.gasPrice + 0.05 }))}
                      className="p-3 border-2 border-[#141414] bg-white hover:bg-[#141414] hover:text-white transition-all active:scale-95 shadow-[1px_1px_0px_0px_rgba(20,20,20,1)] active:shadow-none active:translate-x-[1px] active:translate-y-[1px]"
                      title="+$0.05"
                    >
                      <ChevronUp className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">
                    Fuel Reservoir
                  </label>
                  <span className="font-mono text-[10px] font-bold">{Math.round((state.inventory / state.maxInventory) * 100)}%</span>
                </div>
                <div className="h-4 bg-white border-2 border-[#141414] p-0.5 relative overflow-hidden">
                  <motion.div 
                    className={`h-full ${state.inventory < state.maxInventory * 0.2 ? 'bg-red-500' : 'bg-[#141414]'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${(state.inventory / state.maxInventory) * 100}%` }}
                    transition={{ type: "spring", stiffness: 50 }}
                  />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => buyInventory(1000)}
                    disabled={state.money < 1000 * state.baseCost}
                    className="text-[9px] font-black py-3 border-2 border-[#141414] bg-white hover:bg-[#141414] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#141414] transition-all active:scale-95 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
                  >
                    RESTOCK 1000u<br/>
                    <span className="opacity-60 font-mono font-normal tracking-normal">${(1000 * state.baseCost).toFixed(0)}</span>
                  </button>
                  <button 
                    onClick={() => buyInventory(5000)}
                    disabled={state.money < 5000 * state.baseCost}
                    className="text-[9px] font-black py-3 border-2 border-[#141414] bg-white hover:bg-[#141414] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#141414] transition-all active:scale-95 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
                  >
                    RESTOCK 5000u<br/>
                    <span className="opacity-60 font-mono font-normal tracking-normal">${(5000 * state.baseCost).toFixed(0)}</span>
                  </button>
                </div>
              </div>

              {/* Electric Station Controls */}
              {state.hasElectricStation && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-emerald-50 border-2 border-[#141414] p-4 rounded-none shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]"
                >
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">
                      Electric Charging
                    </label>
                    <Zap className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex gap-1">
                      <button 
                        onClick={() => setState(s => ({ ...s, electricPrice: Math.max(0.01, s.electricPrice - 0.05) }))}
                        className="p-2 border-2 border-[#141414] bg-white hover:bg-[#141414] hover:text-white transition-all active:scale-95"
                        title="-$0.05"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <button 
                        onMouseDown={() => startPriceChange(-0.01, 'electric')}
                        onMouseUp={stopPriceChange}
                        onMouseLeave={stopPriceChange}
                        onTouchStart={() => startPriceChange(-0.01, 'electric')}
                        onTouchEnd={stopPriceChange}
                        className="p-2 border-2 border-[#141414] bg-white hover:bg-[#141414] hover:text-white transition-all active:scale-95"
                        title="Hold to Scroll (-$0.01)"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="text-center">
                      <div className="text-xl font-black font-mono">${state.electricPrice.toFixed(2)}<span className="text-[10px] opacity-40">/kWh</span></div>
                      <div className="text-[9px] uppercase opacity-40 font-bold">Cost: ${state.electricBaseCost.toFixed(2)}</div>
                    </div>

                    <div className="flex gap-1">
                      <button 
                        onMouseDown={() => startPriceChange(0.01, 'electric')}
                        onMouseUp={stopPriceChange}
                        onMouseLeave={stopPriceChange}
                        onTouchStart={() => startPriceChange(0.01, 'electric')}
                        onTouchEnd={stopPriceChange}
                        className="p-2 border-2 border-[#141414] bg-white hover:bg-[#141414] hover:text-white transition-all active:scale-95"
                        title="Hold to Scroll (+$0.01)"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setState(s => ({ ...s, electricPrice: s.electricPrice + 0.05 }))}
                        className="p-2 border-2 border-[#141414] bg-white hover:bg-[#141414] hover:text-white transition-all active:scale-95"
                        title="+$0.05"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className={`mt-2 text-[9px] text-center font-bold ${state.electricPrice < state.electricBaseCost ? 'text-red-600' : 'text-emerald-600'}`}>
                    {state.electricPrice < state.electricBaseCost ? 'WARNING: SELLING AT LOSS' : `MARGIN: +$${(state.electricPrice - state.electricBaseCost).toFixed(2)}`}
                  </div>
                </motion.div>
              )}
            </div>

              <div className="pt-2">
                <button 
                  onClick={() => setIsPaused(!isPaused)}
                  disabled={state.isClosed || state.isGameOver}
                  className={`w-full py-3.5 font-black uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 border-2 border-[#141414] shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] ${isPaused ? 'bg-emerald-500 text-white' : 'bg-white text-[#141414] hover:bg-gray-50'}`}
                >
                  {isPaused ? <Play className="w-4 h-4 fill-current" /> : <div className="flex gap-1"><div className="w-1 h-4 bg-current"/><div className="w-1 h-4 bg-current"/></div>}
                  {isPaused ? "Resume Shift" : "Pause Operations"}
                </button>
              </div>
            </div>
          </section>

          {/* Right Column: News Feed & History */}
          <section className="lg:col-span-2 space-y-8">
            {/* News & Trends */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-amber-50 border-2 border-[#141414] p-6 rounded-none shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] relative overflow-hidden">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-4 flex items-center justify-between relative z-10">
                  <span className="flex items-center gap-2"><Newspaper className="w-4 h-4" /> Day {state.day} Reports</span>
                  <button 
                    onClick={() => setState(s => ({ ...s, helpType: 'news' }))}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <HelpCircle className="w-3.5 h-3.5 opacity-30" />
                  </button>
                </h3>
                <div className="space-y-4 max-h-[240px] overflow-y-auto pr-3 relative z-10 custom-scrollbar">
                  {state.activeEvents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 opacity-20">
                      <Newspaper className="w-10 h-10 mb-2" />
                      <p className="text-[10px] font-black uppercase tracking-widest">No active reports</p>
                    </div>
                  ) : (
                    state.activeEvents.map(event => (
                      <motion.div 
                        key={event.id} 
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="group border-2 border-[#141414] p-4 bg-white/50 hover:bg-white transition-all cursor-help relative"
                        title={event.description}
                      >
                        <h4 className="font-serif italic text-base leading-tight mb-1">{event.title}</h4>
                        <p className="text-[11px] opacity-60 leading-relaxed line-clamp-2 mb-1">{event.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] font-black uppercase tracking-widest bg-[#141414] text-white px-1.5 py-0.5">Active</span>
                          <span className={`text-[8px] font-mono font-bold ${getRemainingTime(event).includes('H LEFT') ? 'text-red-600' : 'opacity-40'}`}>
                            {getRemainingTime(event)}
                          </span>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-emerald-50 border-2 border-[#141414] p-6 rounded-none shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] relative overflow-hidden">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-4 flex items-center justify-between relative z-10">
                  <span className="flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Financial Trends</span>
                  <button 
                    onClick={() => setState(s => ({ ...s, helpType: 'financials' }))}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <HelpCircle className="w-3.5 h-3.5 opacity-30" />
                  </button>
                </h3>
                <div className="h-48 w-full relative z-10">
                  {state.history.length < 2 ? (
                    <div className="h-full flex flex-col items-center justify-center text-[9px] font-black uppercase tracking-widest opacity-20">
                      <BarChart3 className="w-10 h-10 mb-2" />
                      Pending Data...
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={state.history}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ccc" vertical={false} />
                        <XAxis dataKey="day" hide />
                        <YAxis hide domain={['auto', 'auto']} />
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-[#141414] text-white p-2 border border-white shadow-lg">
                                  <p className="text-[8px] font-black uppercase tracking-widest mb-0.5 opacity-60">Shift {payload[0].payload.day}</p>
                                  <p className="font-mono text-sm font-black">${payload[0].value.toLocaleString()}</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="profit" 
                          stroke="#141414" 
                          strokeWidth={3} 
                          dot={{ r: 3, fill: '#141414', strokeWidth: 1, stroke: '#fff' }}
                          activeDot={{ r: 5, fill: '#141414', strokeWidth: 1, stroke: '#fff' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>

            {/* Operations Log - Compact */}
            <div className="bg-zinc-50 border-2 border-[#141414] p-5 rounded-none shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] relative overflow-hidden">
              <h3 className="text-[9px] font-black uppercase tracking-[0.2em] mb-3 flex items-center justify-between opacity-40 relative z-10">
                <span className="flex items-center gap-2"><Info className="w-3 h-3" /> Operational Telemetry</span>
                <button 
                  onClick={() => setState(s => ({ ...s, helpType: 'logs' }))}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <HelpCircle className="w-3 h-3" />
                </button>
              </h3>
              <div className="max-h-32 overflow-y-auto space-y-1.5 pr-3 relative z-10 custom-scrollbar">
                {logs.map((log, i) => (
                  <div key={i} className={`text-[9px] font-mono px-2 py-1.5 border-l-2 transition-all ${i === 0 ? "border-[#141414] bg-white font-black" : "border-gray-200 opacity-30"}`}>
                    <span className="opacity-40 mr-1.5">[{new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                    {log}
                  </div>
                ))}
              </div>
            </div>

            {/* Station Upgrades Shop */}
            <div className="bg-white border-2 border-[#141414] p-6 rounded-none shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] relative overflow-hidden">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-6 flex items-center justify-between relative z-10">
                <span className="flex items-center gap-2"><ShoppingBag className="w-4 h-4" /> Station Upgrades & Shop</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
                <div className="group border-2 border-[#141414] p-4 hover:bg-slate-50 transition-all">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="text-xs font-black uppercase tracking-tight">Expand Reservoir</h4>
                    <span className="text-[10px] font-mono font-bold">$2,500</span>
                  </div>
                  <p className="text-[10px] opacity-60 mb-3">Increase max fuel capacity by 5,000 units.</p>
                  <button 
                    onClick={expandReservoir}
                    disabled={state.money < 2500}
                    className="w-full py-2 text-[9px] font-black uppercase tracking-widest border border-[#141414] hover:bg-[#141414] hover:text-white disabled:opacity-30 transition-all"
                  >
                    Purchase Upgrade
                  </button>
                </div>

                <div className="group border-2 border-[#141414] p-4 hover:bg-slate-50 transition-all">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="text-xs font-black uppercase tracking-tight">Local Advertising</h4>
                    <span className="text-[10px] font-mono font-bold">$750</span>
                  </div>
                  <p className="text-[10px] opacity-60 mb-1">Boost customer demand by 35% for 24 hours.</p>
                  {state.adExpiryDay !== null && (
                    <div className="text-[8px] font-bold text-emerald-600 uppercase mb-2">
                      Active until Day {state.adExpiryDay}, {state.adExpiryHour}:00
                    </div>
                  )}
                  <button 
                    onClick={buyAdvertising}
                    disabled={state.money < 750}
                    className="w-full py-2 text-[9px] font-black uppercase tracking-widest border border-[#141414] hover:bg-[#141414] hover:text-white disabled:opacity-30 transition-all"
                  >
                    Launch Campaign
                  </button>
                </div>

                <div className="group border-2 border-[#141414] p-4 hover:bg-slate-50 transition-all">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="text-xs font-black uppercase tracking-tight">Convenience Store</h4>
                    <span className="text-[10px] font-mono font-bold">$4,000</span>
                  </div>
                  <p className="text-[10px] opacity-60 mb-1">Passive income based on station traffic density.</p>
                  <p className="text-[8px] font-bold text-red-500 uppercase mb-3">Maintenance: ${STORE_MAINTENANCE}/day</p>
                  <button 
                    onClick={() => {
                      if (state.money >= 4000) {
                        setState(s => ({ 
                          ...s, 
                          money: s.money - 4000, 
                          hasConvenienceStore: true,
                          dailyStats: {
                            ...s.dailyStats,
                            upgradeCosts: s.dailyStats.upgradeCosts + 4000
                          }
                        }));
                        addLog("Convenience Store built! Passive income unlocked.");
                      }
                    }}
                    disabled={state.money < 4000 || state.hasConvenienceStore}
                    className="w-full py-2 text-[9px] font-black uppercase tracking-widest border border-[#141414] hover:bg-[#141414] hover:text-white disabled:opacity-30 transition-all"
                  >
                    {state.hasConvenienceStore ? "Owned" : "Build Store"}
                  </button>
                </div>

                <div className="group border-2 border-[#141414] p-4 hover:bg-slate-50 transition-all">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="text-xs font-black uppercase tracking-tight">Automatic Car Wash</h4>
                    <span className="text-[10px] font-mono font-bold">$5,000</span>
                  </div>
                  <p className="text-[10px] opacity-60 mb-1">Extra revenue from 15% of visiting customers.</p>
                  <p className="text-[8px] font-bold text-red-500 uppercase mb-3">Maintenance: ${CARWASH_MAINTENANCE}/day</p>
                  <button 
                    onClick={() => {
                      if (state.money >= 5000) {
                        setState(s => ({ 
                          ...s, 
                          money: s.money - 5000, 
                          hasCarWash: true,
                          dailyStats: {
                            ...s.dailyStats,
                            upgradeCosts: s.dailyStats.upgradeCosts + 5000
                          }
                        }));
                        addLog("Car Wash installed! Extra revenue stream active.");
                      }
                    }}
                    disabled={state.money < 5000 || state.hasCarWash}
                    className="w-full py-2 text-[9px] font-black uppercase tracking-widest border border-[#141414] hover:bg-[#141414] hover:text-white disabled:opacity-30 transition-all"
                  >
                    {state.hasCarWash ? "Owned" : "Install Wash"}
                  </button>
                </div>

                <div className="group border-2 border-[#141414] p-4 hover:bg-slate-50 transition-all">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="text-xs font-black uppercase tracking-tight">Electric Station</h4>
                    <span className="text-[10px] font-mono font-bold">$6,500</span>
                  </div>
                  <p className="text-[10px] opacity-60 mb-1">Unlock EV charging services and pricing controls.</p>
                  <p className="text-[8px] font-bold text-red-500 uppercase mb-3">Maintenance: ${ELECTRIC_MAINTENANCE}/day</p>
                  <button 
                    onClick={() => {
                      if (state.money >= 6500) {
                        setState(s => ({ 
                          ...s, 
                          money: s.money - 6500, 
                          hasElectricStation: true,
                          dailyStats: {
                            ...s.dailyStats,
                            upgradeCosts: s.dailyStats.upgradeCosts + 6500
                          }
                        }));
                        addLog("Electric Station active! EV charging controls unlocked.");
                      }
                    }}
                    disabled={state.money < 6500 || state.hasElectricStation}
                    className="w-full py-2 text-[9px] font-black uppercase tracking-widest border border-[#141414] hover:bg-[#141414] hover:text-white disabled:opacity-30 transition-all"
                  >
                    {state.hasElectricStation ? "Owned" : "Unlock EV"}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* History Summary */}
        <footer className="mt-12 pt-8 border-t border-[#141414] flex flex-col items-center gap-4">
          <div className="w-full flex justify-between items-center opacity-50">
            <div className="text-xs uppercase tracking-widest">Fuel Tycoon v1.2 • Shift-Based Edition</div>
            <div className="text-xs">Base Maintenance: ${DAILY_MAINTENANCE}</div>
          </div>
          <div className="flex gap-6">
            <button 
              onClick={() => setState(p => ({ ...p, showWelcome: true }))}
              className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-30 hover:opacity-100 transition-all"
            >
              Main Menu
            </button>
            <button 
              onClick={() => setState(p => ({ ...p, showSupportModal: true }))}
              className="text-[10px] uppercase tracking-[0.2em] font-bold text-emerald-600 opacity-100 hover:text-emerald-700 transition-all flex items-center gap-1"
            >
              <Heart className="w-3 h-3 fill-emerald-600" /> Support the Dev
            </button>
            <button 
              onClick={resetGame}
              className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-30 hover:opacity-100 hover:text-red-600 transition-all"
            >
              Restart game from zero
            </button>
          </div>
        </footer>
      </div>

      {/* End of Day Summary Modal */}
      <AnimatePresence>
        {state.showSummary && lastDay && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-[#141414] bg-opacity-90 z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white border-4 border-[#141414] p-8 max-w-md w-full shadow-[12px_12px_0px_0px_rgba(20,20,20,1)]"
            >
              <h2 className="text-3xl font-serif italic mb-6 text-center">Shift {lastDay.day} Report</h2>
              
              <div className="space-y-3 mb-8">
                <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 border-b border-gray-100 pb-1">Revenue (Cash In)</div>
                
                <div className="flex justify-between text-xs">
                  <span className="opacity-60">Gasoline Sales</span>
                  <span className="font-mono font-bold text-emerald-600">+${state.dailyStats.gasRevenue.toFixed(2)}</span>
                </div>

                {(state.dailyStats.electricRevenue > 0 || state.hasElectricStation) && (
                  <div className="flex justify-between text-xs">
                    <span className="opacity-60">EV Charging</span>
                    <span className="font-mono font-bold text-emerald-600">+${state.dailyStats.electricRevenue.toFixed(2)}</span>
                  </div>
                )}

                {(state.dailyStats.storeRevenue > 0 || state.hasConvenienceStore) && (
                  <div className="flex justify-between text-xs">
                    <span className="opacity-60">Convenience Store</span>
                    <span className="font-mono font-bold text-emerald-600">+${state.dailyStats.storeRevenue.toFixed(2)}</span>
                  </div>
                )}

                {(state.dailyStats.carWashRevenue > 0 || state.hasCarWash) && (
                  <div className="flex justify-between text-xs">
                    <span className="opacity-60">Automatic Car Wash</span>
                    <span className="font-mono font-bold text-emerald-600">+${state.dailyStats.carWashRevenue.toFixed(2)}</span>
                  </div>
                )}

                {state.dailyStats.adRevenueBoost > 0 && (
                  <div className="flex justify-between text-[10px] bg-emerald-50 px-2 py-1 rounded border border-emerald-100 mt-2">
                    <span className="text-emerald-700 font-bold uppercase">Ad Campaign Boost</span>
                    <span className="font-mono font-bold text-emerald-700">+${state.dailyStats.adRevenueBoost.toFixed(2)}</span>
                  </div>
                )}

                <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mt-4 mb-2 border-b border-gray-100 pb-1">Expenses (Cash Out)</div>

                <div className="flex justify-between text-xs">
                  <span className="opacity-60">Facility Maintenance</span>
                  <span className="font-mono font-bold text-red-600">-${state.dailyStats.maintenanceCosts.toFixed(2)}</span>
                </div>

                {state.dailyStats.restockCosts > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="opacity-60">Inventory Restock (Fuel)</span>
                    <span className="font-mono font-bold text-red-600">-${state.dailyStats.restockCosts.toFixed(2)}</span>
                  </div>
                )}

                {state.dailyStats.marketingCosts > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="opacity-60">Marketing & Ads</span>
                    <span className="font-mono font-bold text-red-600">-${state.dailyStats.marketingCosts.toFixed(2)}</span>
                  </div>
                )}

                {state.dailyStats.upgradeCosts > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="opacity-60">Facility Upgrades</span>
                    <span className="font-mono font-bold text-red-600">-${state.dailyStats.upgradeCosts.toFixed(2)}</span>
                  </div>
                )}

                <div className="mt-6 pt-4 border-t-2 border-[#141414] space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Net Cash Flow</span>
                    <span className={`font-mono font-bold ${
                      (state.dailyStats.gasRevenue + state.dailyStats.electricRevenue + state.dailyStats.storeRevenue + state.dailyStats.carWashRevenue + state.dailyStats.adRevenueBoost - 
                       (state.dailyStats.maintenanceCosts + state.dailyStats.restockCosts + state.dailyStats.marketingCosts + state.dailyStats.upgradeCosts)) >= 0 
                      ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {(state.dailyStats.gasRevenue + state.dailyStats.electricRevenue + state.dailyStats.storeRevenue + state.dailyStats.carWashRevenue + state.dailyStats.adRevenueBoost - 
                        (state.dailyStats.maintenanceCosts + state.dailyStats.restockCosts + state.dailyStats.marketingCosts + state.dailyStats.upgradeCosts)) >= 0 ? '+' : ''}
                      ${(state.dailyStats.gasRevenue + state.dailyStats.electricRevenue + state.dailyStats.storeRevenue + state.dailyStats.carWashRevenue + state.dailyStats.adRevenueBoost - 
                        (state.dailyStats.maintenanceCosts + state.dailyStats.restockCosts + state.dailyStats.marketingCosts + state.dailyStats.upgradeCosts)).toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center bg-slate-50 p-2 border border-slate-200">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-widest">Operating Profit</span>
                      <span className="text-[8px] opacity-50 italic">Revenue - Wholesale Cost - Maintenance</span>
                    </div>
                    <span className={`text-lg font-black font-mono ${lastDay.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {lastDay.profit >= 0 ? '+' : ''}${lastDay.profit.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between pt-2">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Customer Satisfaction</span>
                  <span className="text-xs font-bold">{Math.round(lastDay.satisfaction)}%</span>
                </div>
              </div>

              <button 
                onClick={showNews}
                className="w-full py-4 bg-[#141414] text-white font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all active:scale-95"
              >
                End Shift
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* News Preview Modal */}
      <AnimatePresence>
        {state.showNewsPreview && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-[#141414] bg-opacity-90 z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white border-4 border-[#141414] p-8 max-w-md w-full"
            >
              <h2 className="text-3xl font-serif italic mb-6 text-center">Day {state.day}</h2>
              
              <div className="bg-gray-50 p-4 border-2 border-[#141414] mb-4">
                <h3 className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Newspaper className="w-3 h-3" /> Global News
                </h3>
                <div className="space-y-4 max-h-48 overflow-y-auto pr-2">
                  {state.activeEvents.length === 0 ? (
                    <div className="text-center py-4 opacity-50 italic text-xs">
                      The world seems quiet for today.
                    </div>
                  ) : (
                    state.activeEvents.map(event => (
                      <div key={event.id} className="border-b border-gray-200 pb-3 last:border-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-bold text-xs uppercase tracking-tight">{event.title}</h4>
                          <div className="flex gap-1">
                            {event.costImpact !== 1 && (
                              <span className={`text-[8px] font-bold px-1 rounded ${event.costImpact > 1 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                COST {event.costImpact > 1 ? '+' : ''}{Math.round((event.costImpact - 1) * 100)}%
                              </span>
                            )}
                            {event.demandImpact !== 1 && (
                              <span className={`text-[8px] font-bold px-1 rounded ${event.demandImpact > 1 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                DEMAND {event.demandImpact > 1 ? '+' : ''}{Math.round((event.demandImpact - 1) * 100)}%
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-[10px] opacity-70 leading-tight">{event.description}</p>
                        <div className="mt-1 text-[8px] font-bold uppercase opacity-40">
                          {getRemainingTime(event)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Starting Price Adjustment */}
              <div className="bg-gray-50 p-4 border-2 border-[#141414] mb-4">
                <h3 className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                  <DollarSign className="w-3 h-3" /> Set Starting Price
                </h3>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex gap-1">
                    <button 
                      onClick={() => setState(p => ({ ...p, gasPrice: Math.max(0.1, p.gasPrice - 0.05) }))}
                      className="p-3 border border-[#141414] hover:bg-[#141414] hover:text-white transition-colors"
                      title="-$0.05"
                    >
                      <ChevronDown className="w-5 h-5" />
                    </button>
                    <button 
                      onMouseDown={() => startPriceChange(-0.01)}
                      onMouseUp={stopPriceChange}
                      onMouseLeave={stopPriceChange}
                      onTouchStart={() => startPriceChange(-0.01)}
                      onTouchEnd={stopPriceChange}
                      className="p-3 border border-[#141414] hover:bg-[#141414] hover:text-white transition-colors active:bg-[#141414] active:text-white"
                      title="Hold to Scroll (-$0.01)"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="text-center">
                    <div className="text-2xl font-bold font-mono">${state.gasPrice.toFixed(2)}</div>
                    <div className="text-[10px] uppercase opacity-50">Wholesale: ${state.baseCost.toFixed(2)}</div>
                  </div>

                  <div className="flex gap-1">
                    <button 
                      onMouseDown={() => startPriceChange(0.01)}
                      onMouseUp={stopPriceChange}
                      onMouseLeave={stopPriceChange}
                      onTouchStart={() => startPriceChange(0.01)}
                      onTouchEnd={stopPriceChange}
                      className="p-3 border border-[#141414] hover:bg-[#141414] hover:text-white transition-colors active:bg-[#141414] active:text-white"
                      title="Hold to Scroll (+$0.01)"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => setState(p => ({ ...p, gasPrice: p.gasPrice + 0.05 }))}
                      className="p-3 border border-[#141414] hover:bg-[#141414] hover:text-white transition-colors"
                      title="+$0.05"
                    >
                      <ChevronUp className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className={`mt-2 text-[10px] text-center font-bold ${state.gasPrice < state.baseCost ? 'text-red-600' : 'text-emerald-600'}`}>
                  {state.gasPrice < state.baseCost ? 'WARNING: SELLING AT LOSS' : `MARGIN: +$${(state.gasPrice - state.baseCost).toFixed(2)}`}
                </div>
              </div>

              {/* Electric Price Adjustment in Modal */}
              {state.hasElectricStation && (
                <div className="bg-emerald-50 p-4 border-2 border-[#141414] mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Zap className="w-3 h-3" /> Set EV Charging Price
                  </h3>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex gap-1">
                      <button 
                        onClick={() => setState(p => ({ ...p, electricPrice: Math.max(0.01, p.electricPrice - 0.05) }))}
                        className="p-3 border border-[#141414] hover:bg-[#141414] hover:text-white transition-colors"
                        title="-$0.05"
                      >
                        <ChevronDown className="w-5 h-5" />
                      </button>
                      <button 
                        onMouseDown={() => startPriceChange(-0.01, 'electric')}
                        onMouseUp={stopPriceChange}
                        onMouseLeave={stopPriceChange}
                        onTouchStart={() => startPriceChange(-0.01, 'electric')}
                        onTouchEnd={stopPriceChange}
                        className="p-3 border border-[#141414] hover:bg-[#141414] hover:text-white transition-colors active:bg-[#141414] active:text-white"
                        title="Hold to Scroll (-$0.01)"
                      >
                        <Minus className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="text-center">
                      <div className="text-2xl font-bold font-mono">${state.electricPrice.toFixed(2)}</div>
                      <div className="text-[10px] uppercase opacity-50">Cost: ${state.electricBaseCost.toFixed(2)}</div>
                    </div>

                    <div className="flex gap-1">
                      <button 
                        onMouseDown={() => startPriceChange(0.01, 'electric')}
                        onMouseUp={stopPriceChange}
                        onMouseLeave={stopPriceChange}
                        onTouchStart={() => startPriceChange(0.01, 'electric')}
                        onTouchEnd={stopPriceChange}
                        className="p-3 border border-[#141414] hover:bg-[#141414] hover:text-white transition-colors active:bg-[#141414] active:text-white"
                        title="Hold to Scroll (+$0.01)"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => setState(p => ({ ...p, electricPrice: p.electricPrice + 0.05 }))}
                        className="p-3 border border-[#141414] hover:bg-[#141414] hover:text-white transition-colors"
                        title="+$0.05"
                      >
                        <ChevronUp className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div className={`mt-2 text-[10px] text-center font-bold ${state.electricPrice < state.electricBaseCost ? 'text-red-600' : 'text-emerald-600'}`}>
                    {state.electricPrice < state.electricBaseCost ? 'WARNING: SELLING AT LOSS' : `MARGIN: +$${(state.electricPrice - state.electricBaseCost).toFixed(2)}`}
                  </div>
                </div>
              )}

              {/* Inventory Management in Modal */}
              <div className="bg-gray-50 p-4 border-2 border-[#141414] mb-8">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <Droplets className="w-3 h-3" /> Restock Fuel
                  </h3>
                  <div className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    Balance: ${state.money.toFixed(2)}
                  </div>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs uppercase opacity-50">Current Stock</div>
                  <div className="text-right">
                    <div className="font-mono font-bold">{state.inventory.toLocaleString()} units</div>
                    <div className="text-[10px] font-bold opacity-40">{Math.round((state.inventory / state.maxInventory) * 100)}% FULL</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => buyInventory(1000)}
                    disabled={state.money < 1000 * state.baseCost}
                    className="py-2 border border-[#141414] text-[10px] font-bold uppercase hover:bg-[#141414] hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Buy 1,000 (${(1000 * state.baseCost).toFixed(0)})
                  </button>
                  <button 
                    onClick={() => buyInventory(5000)}
                    disabled={state.money < 5000 * state.baseCost}
                    className="py-2 border border-[#141414] text-[10px] font-bold uppercase hover:bg-[#141414] hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Buy 5,000 (${(5000 * state.baseCost).toFixed(0)})
                  </button>
                </div>
              </div>

              <button 
                onClick={startNextDay}
                className="w-full py-4 bg-[#141414] text-white font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors"
              >
                Start Shift
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Support Modal */}
      <AnimatePresence>
        {state.showSupportModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#141414]/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white border-4 border-[#141414] p-8 max-w-md w-full shadow-[12px_12px_0px_0px_rgba(20,20,20,1)] relative"
            >
              <button 
                onClick={() => setState(p => ({ ...p, showSupportModal: false }))}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <Heart className="w-8 h-8 text-emerald-600 fill-emerald-600" />
                <h2 className="text-2xl font-serif italic">Support the Developer</h2>
              </div>

              <p className="text-sm text-gray-600 mb-8 leading-relaxed">
                If you're enjoying <strong>Fuel Tycoon</strong>, consider supporting the development of more weird and wonderful games!
              </p>

              <div className="grid grid-cols-1 gap-4">
                <a 
                  href="https://www.paypal.com/ncp/payment/F5EL4BAQH7582" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between p-4 border-2 border-[#141414] hover:bg-[#141414] hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                >
                  <div className="flex items-center gap-3">
                    <Coffee className="w-5 h-5" />
                    <span className="font-bold uppercase tracking-wider text-xs">Buy me a coffee</span>
                  </div>
                  <ExternalLink className="w-4 h-4 opacity-30 group-hover:opacity-100" />
                </a>

                <a 
                  href="https://www.paypal.com/ncp/payment/Q3YPP6RWV7YL6" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between p-4 border-2 border-[#141414] hover:bg-[#141414] hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                >
                  <div className="flex items-center gap-3">
                    <Fuel className="w-5 h-5" />
                    <span className="font-bold uppercase tracking-wider text-xs">A bottle of fuel</span>
                  </div>
                  <ExternalLink className="w-4 h-4 opacity-30 group-hover:opacity-100" />
                </a>

                <a 
                  href="https://www.paypal.com/ncp/payment/P2V8XPBY26LVC" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between p-4 border-2 border-[#141414] hover:bg-[#141414] hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                >
                  <div className="flex items-center gap-3">
                    <Gamepad2 className="w-5 h-5" />
                    <span className="font-bold uppercase tracking-wider text-xs">Support other weird games</span>
                  </div>
                  <ExternalLink className="w-4 h-4 opacity-30 group-hover:opacity-100" />
                </a>

                <a 
                  href="https://diesel-launch-731978390331.us-west1.run.app/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between p-4 border-2 border-[#141414] bg-emerald-50 hover:bg-emerald-600 hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                >
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5" />
                    <span className="font-bold uppercase tracking-wider text-xs">Diesel tire jump master</span>
                  </div>
                  <ExternalLink className="w-4 h-4 opacity-30 group-hover:opacity-100" />
                </a>
              </div>

              <button 
                onClick={() => setState(p => ({ ...p, showSupportModal: false }))}
                className="w-full mt-8 py-3 text-[10px] font-black uppercase tracking-[0.3em] opacity-40 hover:opacity-100 transition-opacity"
              >
                Back to Station
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Welcome & Tutorial Modal */}
      <AnimatePresence>
        {state.showWelcome && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#141414] bg-opacity-95 z-[100] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white border-4 border-[#141414] p-8 max-w-lg w-full shadow-[12px_12px_0px_0px_rgba(20,20,20,1)] max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              {state.tutorialStep === 0 && (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <Fuel className="w-8 h-8 text-emerald-600" />
                    <h2 className="text-4xl font-serif italic font-black uppercase tracking-tighter">Welcome, {state.playerName}</h2>
                  </div>

                  <div className="mb-6">
                    <label className="block text-xs font-bold uppercase tracking-widest text-[#141414] mb-2">Your Name</label>
                    <input 
                      type="text" 
                      value={state.playerName}
                      onChange={(e) => setState(p => ({ ...p, playerName: e.target.value }))}
                      placeholder="Enter your name..."
                      className="w-full p-3 border-2 border-[#141414] font-bold focus:outline-none focus:border-emerald-600 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] transition-all focus:translate-x-[1px] focus:translate-y-[1px] focus:shadow-[3px_3px_0px_0px_rgba(20,20,20,1)]"
                      maxLength={15}
                    />
                  </div>
                  
                  <div className="space-y-4 mb-8">
                    <p className="text-lg font-serif italic border-l-4 border-emerald-500 pl-4 py-2 bg-emerald-50">
                      "My dear {state.playerName === 'Tycoon' ? 'nephew' : state.playerName}, the road has been long and my tank is finally empty. I'm retiring to the coast. This station is now yours."
                    </p>
                    <p className="text-sm leading-relaxed">
                      You've inherited <strong>Sector 7G's</strong> most iconic fuel station. Your goal is simple: <strong>Buy low, sell high, and don't go bankrupt.</strong>
                    </p>
                  </div>

                  <button 
                    onClick={nextTutorialStep}
                    className="w-full py-4 bg-emerald-600 text-white font-bold uppercase tracking-widest shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] transition-all active:scale-95"
                  >
                    Quick Tutorial
                  </button>
                </>
              )}

              {state.tutorialStep === 1 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-8 h-8 text-blue-600" />
                    <h2 className="text-2xl font-serif italic font-black uppercase">1. Setting Prices</h2>
                  </div>
                  <p className="text-sm leading-relaxed">
                    Use the <strong>Target Price</strong> slider to adjust how much you charge. 
                  </p>
                  <div className="bg-blue-50 p-4 border-2 border-blue-200 text-sm italic">
                    "If you charge too much above the <strong>Wholesale Cost</strong>, customers will get angry and your <strong>Satisfaction</strong> will drop. Low satisfaction means fewer customers!"
                  </div>
                  <button 
                    onClick={nextTutorialStep}
                    className="w-full py-4 bg-[#141414] text-white font-bold uppercase tracking-widest shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] hover:bg-emerald-600 transition-colors"
                  >
                    Next: Market Events
                  </button>
                </div>
              )}

              {state.tutorialStep === 2 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <Newspaper className="w-8 h-8 text-amber-600" />
                    <h2 className="text-2xl font-serif italic font-black uppercase">2. Market Events</h2>
                  </div>
                  <p className="text-sm leading-relaxed">
                    The world is unpredictable! Every morning, check the <strong>Global News</strong>. 
                  </p>
                  <ul className="list-disc pl-5 text-sm space-y-2">
                    <li><strong>Cost Impact:</strong> Events can make fuel much more expensive to buy.</li>
                    <li><strong>Demand Impact:</strong> Some events bring more customers, others drive them away.</li>
                  </ul>
                  <div className="bg-amber-50 p-4 border-2 border-amber-200 text-sm italic">
                    "Adjust your prices daily to match the current market conditions!"
                  </div>
                  <button 
                    onClick={nextTutorialStep}
                    className="w-full py-4 bg-[#141414] text-white font-bold uppercase tracking-widest shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] hover:bg-emerald-600 transition-colors"
                  >
                    Next: Customer Growth
                  </button>
                </div>
              )}

              {state.tutorialStep === 3 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <Users className="w-8 h-8 text-emerald-600" />
                    <h2 className="text-2xl font-serif italic font-black uppercase">3. Customer Density</h2>
                  </div>
                  <p className="text-sm leading-relaxed">
                    A busy station is a profitable station. Keep an eye on:
                  </p>
                  <ul className="list-disc pl-5 text-sm space-y-2">
                    <li><strong>Density:</strong> This shows how many people are actually stopping by.</li>
                    <li><strong>Marketing:</strong> Invest in Ad Campaigns during the night to boost your reach.</li>
                    <li><strong>Upgrades:</strong> Better pumps and an EV station will attract higher-paying customers.</li>
                  </ul>
                  <div className="bg-emerald-50 p-4 border-2 border-emerald-200 text-sm italic text-red-600 font-bold">
                    Warning: Running out of fuel will kill your satisfaction instantly!
                  </div>
                  <button 
                    onClick={startDayOne}
                    className="w-full py-4 bg-emerald-600 text-white font-bold uppercase tracking-widest shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] hover:bg-emerald-500 transition-colors"
                  >
                    Start Day 1 News
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expired Events Modal */}
      <AnimatePresence>
        {state.expiredEvents.length > 0 && !state.breakingNews && !state.showWelcome && !state.isGameOver && !state.showSummary && !state.showNewsPreview && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-[#141414] bg-opacity-90 z-[60] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white border-4 border-emerald-600 p-8 max-w-md w-full shadow-[12px_12px_0px_0px_rgba(16,185,129,1)]"
            >
              <div className="flex items-center gap-3 mb-6">
                <Clock className="w-8 h-8 text-emerald-600" />
                <h2 className="text-4xl font-serif italic font-black uppercase tracking-tighter">Event Ended</h2>
              </div>
              
              <p className="text-lg mb-4 font-bold uppercase tracking-tight">
                {state.expiredEvents[0].title}
              </p>
              
              <p className="text-sm leading-relaxed mb-8 opacity-70">
                The market disruption has resolved. Wholesale costs and demand are returning to normal levels.
              </p>

              <button 
                onClick={() => setState(p => ({ ...p, expiredEvents: p.expiredEvents.slice(1) }))}
                className="w-full py-4 bg-emerald-600 text-white font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#141414] transition-colors"
              >
                Acknowledge
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Breaking News Modal */}
      <AnimatePresence>
        {state.breakingNews && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-red-600 bg-opacity-90 z-[60] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white border-4 border-[#141414] p-8 max-w-md w-full shadow-[8px_8px_0px_0px_rgba(20,20,20,1)]"
            >
              <div className="flex items-center justify-center gap-2 mb-6 text-red-600 animate-pulse">
                <AlertTriangle className="w-6 h-6" />
                <h2 className="text-3xl font-serif italic font-black uppercase tracking-tighter">Breaking News</h2>
                <AlertTriangle className="w-6 h-6" />
              </div>
              
              <div className="text-center mb-8">
                <h3 className="text-xl font-bold uppercase mb-2">{state.breakingNews.title}</h3>
                <p className="text-sm opacity-80 leading-relaxed">{state.breakingNews.description}</p>
              </div>

              <div className="bg-red-50 p-4 border border-red-200 mb-8">
                <div className="text-[10px] uppercase font-bold text-red-600 mb-2 text-center">Market Impact & Duration</div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <div className="text-[9px] uppercase opacity-50">Wholesale</div>
                    <div className={`font-mono font-bold ${state.breakingNews.costImpact > 1 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {state.breakingNews.costImpact > 1 ? '+' : ''}{Math.round((state.breakingNews.costImpact - 1) * 100)}%
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-[9px] uppercase opacity-50">Demand</div>
                    <div className={`font-mono font-bold ${state.breakingNews.demandImpact > 1 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {state.breakingNews.demandImpact > 1 ? '+' : ''}{Math.round((state.breakingNews.demandImpact - 1) * 100)}%
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-[9px] uppercase opacity-50">Duration</div>
                    <div className="font-mono font-bold text-red-600">
                      {getRemainingTime(state.breakingNews)}
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setState(p => ({ ...p, breakingNews: null }))}
                className="w-full py-4 bg-red-600 text-white font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#141414] transition-colors"
              >
                Acknowledge & Continue
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Over Modal */}
      <AnimatePresence>
        {state.isGameOver && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-[#141414] bg-opacity-90 z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white border-4 border-red-600 p-8 max-w-md w-full text-center"
            >
              <h2 className="text-4xl font-serif italic mb-4 text-red-600">Game Over</h2>
              <p className="text-lg mb-8 leading-relaxed">
                {state.gameOverReason}
              </p>
              <div className="grid grid-cols-2 gap-4 mb-8 text-left border-y border-gray-200 py-4">
                <div>
                  <div className="text-[10px] uppercase opacity-50">Days Survived</div>
                  <div className="text-xl font-bold">{state.day}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase opacity-50">Final Balance</div>
                  <div className="text-xl font-bold">${state.money.toFixed(2)}</div>
                </div>
              </div>
              <button 
                onClick={resetGame}
                className="w-full py-4 bg-[#141414] text-white font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-600 transition-colors"
              >
                <RotateCcw className="w-4 h-4" /> Try Again
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* High Price Warning Modal */}
      <AnimatePresence>
        {state.showHighPriceWarning && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#141414] bg-opacity-90 z-[100] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white border-4 border-[#141414] p-8 max-w-md w-full shadow-[12px_12px_0px_0px_rgba(20,20,20,1)]"
            >
              <div className="flex items-center gap-3 mb-6 text-red-600">
                <AlertTriangle className="w-8 h-8" />
                <h2 className="text-2xl font-serif italic font-black uppercase tracking-tighter">Fuel Price Alert</h2>
              </div>
              <p className="text-lg leading-relaxed mb-8">
                <strong>Fuel price is too high:</strong> no one is stopping at your station. Lower your prices to attract customers!
              </p>
              <button 
                onClick={() => setState(s => ({ ...s, showHighPriceWarning: false }))}
                className="w-full py-4 bg-[#141414] text-white font-bold uppercase tracking-widest hover:bg-emerald-700 transition-colors"
              >
                I'll lower the price
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Out of Fuel Warning Modal */}
      <AnimatePresence>
        {state.showOutOfFuelWarning && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#141414] bg-opacity-90 z-[100] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white border-4 border-[#141414] p-8 max-w-md w-full shadow-[12px_12px_0px_0px_rgba(20,20,20,1)]"
            >
              <div className="flex items-center gap-3 mb-6 text-red-600">
                <Droplets className="w-8 h-8" />
                <h2 className="text-2xl font-serif italic font-black uppercase tracking-tighter">Out of Fuel</h2>
              </div>
              <p className="text-lg leading-relaxed mb-8">
                Your tanks are empty! You have <strong>run out of fuel reservoir</strong>. You can't sell anything until you restock.
              </p>
              <div className="space-y-3">
                <button 
                  onClick={() => setState(s => ({ ...s, showOutOfFuelWarning: false }))}
                  className="w-full py-4 bg-[#141414] text-white font-bold uppercase tracking-widest hover:bg-emerald-700 transition-colors"
                >
                  Got it
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Event Ending Modal */}
      <AnimatePresence>
        {state.eventEnding && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#141414] bg-opacity-90 z-[100] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white border-4 border-[#141414] p-8 max-w-md w-full shadow-[12px_12px_0px_0px_rgba(20,20,20,1)]"
            >
              <div className="flex items-center gap-3 mb-6 text-emerald-600">
                <Info className="w-8 h-8" />
                <h2 className="text-2xl font-serif italic font-black uppercase tracking-tighter">Event Ended</h2>
              </div>
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-2">{state.eventEnding.title}</h3>
                <p className="text-gray-600 leading-relaxed">
                  The situation has stabilized. The effects of this event have worn off.
                </p>
              </div>
              <button 
                onClick={() => setState(s => ({ ...s, eventEnding: null }))}
                className="w-full py-4 bg-[#141414] text-white font-bold uppercase tracking-widest hover:bg-emerald-700 transition-colors"
              >
                Back to Business
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help Modal */}
      <AnimatePresence>
        {state.helpType && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-[#141414] bg-opacity-90 z-[100] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white border-4 border-[#141414] p-8 max-w-md w-full"
            >
              <div className="flex items-center gap-3 mb-6">
                <HelpCircle className="w-6 h-6" />
                <h2 className="text-2xl font-serif italic uppercase tracking-tight">
                  {state.helpType === 'controls' && "Station Controls"}
                  {state.helpType === 'news' && "Global News"}
                  {state.helpType === 'financials' && "Financial Trends"}
                  {state.helpType === 'logs' && "Operations Log"}
                  {state.helpType === 'time' && "Time & Day"}
                  {state.helpType === 'balance' && "Your Balance"}
                  {state.helpType === 'satisfaction' && "Customer Satisfaction"}
                  {state.helpType === 'profit' && "Daily Profit"}
                  {state.helpType === 'wholesale' && "Wholesale Cost"}
                  {state.helpType === 'density' && "Customer Density"}
                </h2>
              </div>

              <div className="space-y-4 text-sm leading-relaxed mb-8">
                {state.helpType === 'time' && (
                  <>
                    <p><strong>Operating Hours:</strong> Your station is open from 06:00 to 22:00. At night, you'll have a chance to review your performance and restock.</p>
                    <p><strong>Game Speed:</strong> Time moves fast! Keep an eye on the clock to ensure you don't run out of fuel mid-shift.</p>
                  </>
                )}
                {state.helpType === 'balance' && (
                  <>
                    <p><strong>Cash on Hand:</strong> This is your liquid money available for immediate use. You need this to buy fuel, launch ads, and pay daily maintenance fees.</p>
                    <p><strong>How it's calculated:</strong> 
                      <br/>• <strong>Income:</strong> Every gallon sold adds <code>(Fuel Price)</code> to your balance in real-time.
                      <br/>• <strong>Expenses:</strong> Buying fuel, ads, or upgrades subtracts cash <strong>immediately</strong>.
                      <br/>• <strong>Maintenance:</strong> A base fee (starting at $150.00) is deducted <strong>only at the end of the day</strong>.
                    </p>
                    <p><strong>Net Worth:</strong> Your total value is <code>Cash + (Current Inventory × Wholesale Cost)</code>. While cash is king for buying fuel, your inventory is a valuable asset!</p>
                    <p className="text-red-600 font-bold underline italic">WARNING: If your balance is too low at 22:00, you won't be able to pay maintenance and will go bankrupt!</p>
                  </>
                )}
                {state.helpType === 'satisfaction' && (
                  <>
                    <p><strong>Public Opinion:</strong> Happy customers return more often. High prices or running out of fuel will lower satisfaction.</p>
                    <p><strong>Impact:</strong> Low satisfaction reduces the base number of customers who even consider stopping at your station.</p>
                  </>
                )}
                {state.helpType === 'profit' && (
                  <>
                    <p><strong>Daily Earnings:</strong> Shows your revenue minus the cost of the fuel sold today. The end-of-day report provides a full breakdown including maintenance, marketing, and inventory restock costs.</p>
                  </>
                )}
                {state.helpType === 'wholesale' && (
                  <>
                    <p><strong>Market Price:</strong> This is what it costs YOU to buy one unit of fuel. This price fluctuates based on global news events.</p>
                  </>
                )}
                {state.helpType === 'density' && (
                  <>
                    <p><strong>Traffic:</strong> Shows how many customers are currently at your pumps. This is affected by your price, satisfaction, and global events.</p>
                  </>
                )}
                {state.helpType === 'controls' && (
                  <>
                    <p><strong>Fuel Price:</strong> Adjust your selling price. Customers are highly sensitive to price. If you are too expensive, they won't stop. If you are too cheap, you'll lose money!</p>
                    <p><strong>Inventory:</strong> You must keep fuel in your tanks. If you run out, you can't sell anything. Buy in bulk to save time, but watch your cash flow.</p>
                    <p><strong>Upgrades:</strong> Expand your station with a Convenience Store, Car Wash, or EV Charging. These increase your revenue but also add to your daily maintenance costs.</p>
                    <p><strong>Demand Bar:</strong> The blue/green bars show how attractive your price is. More bars mean more customers.</p>
                  </>
                )}
                {state.helpType === 'news' && (
                  <>
                    <p><strong>Events:</strong> Global events directly impact your business. Wars might increase wholesale costs, while economic booms increase customer demand.</p>
                    <p><strong>Duration:</strong> Events last for a set number of days. Plan your inventory purchases accordingly!</p>
                  </>
                )}
                {state.helpType === 'financials' && (
                  <>
                    <p><strong>Profit History:</strong> Tracks your net earnings day by day. Use this to see if your pricing strategy is working over the long term.</p>
                    <p><strong>Wholesale Cost:</strong> This is what you pay for fuel. Your goal is to sell high enough above this to cover maintenance (starting at $150/day) and make a profit.</p>
                  </>
                )}
                {state.helpType === 'logs' && (
                  <>
                    <p><strong>Operations:</strong> A real-time feed of what's happening at your station. Watch for customer complaints about high prices or low satisfaction.</p>
                  </>
                )}
              </div>

              <button 
                onClick={() => setState(s => ({ ...s, helpType: null }))}
                className="w-full py-4 bg-[#141414] text-white font-bold uppercase tracking-widest hover:bg-opacity-90 transition-all"
              >
                Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ label, value, icon, color = "text-[#141414]", description, status, children, onHelp, className = "bg-white" }: { label: string, value?: string | number, icon: React.ReactNode, color?: string, description?: string, status?: 'Open' | 'Closed', children?: React.ReactNode, onHelp?: () => void, className?: string }) {
  return (
    <motion.div 
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onHelp?.()}
      className={`${className} border-2 border-[#141414] p-5 rounded-none shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] hover:shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] transition-all group relative ${onHelp ? 'cursor-pointer hover:bg-gray-50' : 'cursor-help'}`}
      title={onHelp ? undefined : description}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] opacity-40 group-hover:opacity-100 transition-opacity">
          {icon} {label}
        </div>
        <div className="flex items-center gap-2">
          {onHelp && (
            <div className="p-1 rounded-full bg-gray-50 border border-transparent group-hover:border-[#141414]/10 transition-all">
              <HelpCircle className="w-3 h-3 opacity-20 group-hover:opacity-100" />
            </div>
          )}
          {status && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-50 border border-[#141414]/5 rounded-full">
              <div className={`w-1.5 h-1.5 rounded-full ${status === 'Open' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-[8px] font-black uppercase tracking-tighter opacity-60">{status}</span>
            </div>
          )}
        </div>
      </div>
      {children ? (
        <div className="h-10 flex items-end">
          {children}
        </div>
      ) : (
        <div className={`text-xl font-black font-mono tracking-tighter ${color}`}>
          {value}
        </div>
      )}
      {description && !onHelp && (
        <div className="absolute top-full left-0 mt-2 w-56 bg-[#141414] text-white text-[10px] p-3 rounded-none opacity-0 group-hover:opacity-100 pointer-events-none z-20 transition-all transform translate-y-2 group-hover:translate-y-0 shadow-xl">
          <div className="font-bold mb-1 uppercase tracking-widest text-[8px] opacity-50">Information</div>
          {description}
        </div>
      )}
    </motion.div>
  );
}
