import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WorldEvent } from '../types';

interface GasStationVisualProps {
  hour: number;
  minute: number;
  density: number; // 0 to 100
  activeEvents: WorldEvent[];
  isClosed: boolean;
  isAdActive: boolean;
  hasCarWash: boolean;
  hasConvenienceStore: boolean;
}

interface Car {
  id: string;
  type: 'sedan' | 'truck' | 'suv';
  color: string;
  startTime: number;
  speed: number;
  lane: number;
  isStopping: boolean;
  pumpIndex: number;
}

const CAR_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#6366f1', '#ec4899', '#141414', '#ffffff'];
const CAR_TYPES: ('sedan' | 'truck' | 'suv')[] = ['sedan', 'truck', 'suv'];

export default function GasStationVisual({ 
  hour, 
  minute, 
  density, 
  activeEvents, 
  isClosed, 
  isAdActive,
  hasCarWash,
  hasConvenienceStore
}: GasStationVisualProps) {
  const [cars, setCars] = useState<Car[]>([]);
  
  // Calculate sky color based on time
  const skyColor = useMemo(() => {
    const time = hour + minute / 60;
    
    // Check for weather events that might override sky color
    const isWinterStorm = activeEvents.some(e => e.title.toLowerCase().includes('winter') || e.title.toLowerCase().includes('storm'));
    if (isWinterStorm) return '#e2e8f0'; // Overcast/White sky for storm

    if (time < 5 || time > 21) return '#0f172a'; // Night
    if (time < 7) return '#f97316'; // Sunrise
    if (time < 9) return '#38bdf8'; // Morning
    if (time < 17) return '#0ea5e9'; // Day
    if (time < 19) return '#fb923c'; // Sunset
    return '#1e293b'; // Evening
  }, [hour, minute, activeEvents]);

  // Handle car spawning
  useEffect(() => {
    if (isClosed) {
      setCars([]);
      return;
    }

    const interval = setInterval(() => {
      // Probability of spawning a car based on density
      const spawnChance = (density / 100) * 0.6; // Increased base chance
      
      setCars(prev => {
        const now = Date.now();
        // Remove old cars - increased timeout to account for stopping time
        const activeCars = prev.filter(car => now - car.startTime < 15000);
        
        // Spawn new car if chance hits and limit not reached
        if (Math.random() < spawnChance && activeCars.length < 15) {
          const isStopping = Math.random() < 0.4; // 40% of cars stop
          const newCar: Car = {
            id: Math.random().toString(36).substr(2, 9),
            type: CAR_TYPES[Math.floor(Math.random() * CAR_TYPES.length)],
            color: CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)],
            startTime: now,
            speed: 4 + Math.random() * 2,
            lane: Math.floor(Math.random() * 2),
            isStopping,
            pumpIndex: Math.floor(Math.random() * 2),
          };
          return [...activeCars, newCar];
        }
        return activeCars;
      });
    }, 600);

    return () => clearInterval(interval);
  }, [density, isClosed]); // Removed cars.length dependency to prevent constant restarts

  // Weather effects
  const isSnowing = activeEvents.some(e => e.title.toLowerCase().includes('winter') || e.title.toLowerCase().includes('snow'));
  const isRaining = activeEvents.some(e => e.title.toLowerCase().includes('rain') || e.title.toLowerCase().includes('storm') && !isSnowing);

  return (
    <div className="w-full h-48 md:h-64 bg-[#141414] border-2 border-[#141414] mb-8 relative overflow-hidden shadow-[8px_8px_0px_0px_rgba(20,20,20,1)]">
      {/* Sky Background */}
      <motion.div 
        className="absolute inset-0 transition-colors duration-1000"
        style={{ backgroundColor: skyColor }}
      />

      {/* Sun/Moon */}
      <motion.div 
        className="absolute w-12 h-12 rounded-full"
        animate={{ 
          x: `${((hour - 6) / 16) * 100}%`,
          y: hour < 6 || hour > 20 ? '80%' : '20%',
          backgroundColor: hour > 6 && hour < 18 ? '#fbbf24' : '#f1f5f9',
          boxShadow: hour > 6 && hour < 18 ? '0 0 40px #fbbf24' : '0 0 20px #f1f5f9'
        }}
        transition={{ duration: 2 }}
      />

      {/* Ground / Road (Isometric) */}
      <svg viewBox="0 0 800 400" className="absolute inset-0 w-full h-full">
        {/* Road */}
        <path d="M 0 300 L 800 300 L 800 400 L 0 400 Z" fill="#334155" />
        <path d="M 0 350 L 800 350" stroke="white" strokeDasharray="20,20" strokeWidth="2" opacity="0.3" />

        {/* Gas Station Building (Isometric Style) */}
        <g transform="translate(400, 200)">
          {/* Canopy */}
          <path d="M -150 -20 L 150 -20 L 100 40 L -200 40 Z" fill="#f8fafc" stroke="#141414" strokeWidth="2" />
          <path d="M -200 40 L -200 50 L 100 50 L 100 40 Z" fill="#e2e8f0" stroke="#141414" strokeWidth="2" />
          
          {/* Pillars */}
          <rect x="-140" y="40" width="10" height="100" fill="#94a3b8" stroke="#141414" strokeWidth="2" />
          <rect x="60" y="40" width="10" height="100" fill="#94a3b8" stroke="#141414" strokeWidth="2" />

          {/* Pumps */}
          <g transform="translate(-80, 110)">
            <rect x="0" y="0" width="20" height="30" fill="#ef4444" stroke="#141414" strokeWidth="2" />
            <rect x="4" y="4" width="12" height="8" fill="white" />
          </g>
          <g transform="translate(20, 110)">
            <rect x="0" y="0" width="20" height="30" fill="#ef4444" stroke="#141414" strokeWidth="2" />
            <rect x="4" y="4" width="12" height="8" fill="white" />
          </g>

          {/* Main Building */}
          <path d="M 150 40 L 250 40 L 250 140 L 150 140 Z" fill="#f1f5f9" stroke="#141414" strokeWidth="2" />
          <path d="M 250 40 L 280 20 L 280 120 L 250 140 Z" fill="#cbd5e1" stroke="#141414" strokeWidth="2" />
          <path d="M 150 40 L 180 20 L 280 20 L 250 40 Z" fill="#e2e8f0" stroke="#141414" strokeWidth="2" />
          
          {/* Window */}
          <rect x="170" y="60" width="60" height="40" fill="#93c5fd" stroke="#141414" strokeWidth="2" opacity="0.6" />
          
          {/* Convenience Store Additions */}
          {hasConvenienceStore && (
            <g>
              {/* Vending Machine */}
              <g transform="translate(155, 100)">
                <rect width="15" height="30" fill="#3b82f6" stroke="#141414" strokeWidth="1" />
                <rect x="3" y="3" width="9" height="12" fill="#93c5fd" opacity="0.8" />
                <rect x="3" y="18" width="9" height="2" fill="#ef4444" />
                <rect x="3" y="22" width="9" height="2" fill="#10b981" />
              </g>
              {/* Shopping Cart */}
              <g transform="translate(130, 125)">
                <path d="M 0 0 L 10 0 L 12 -8 L 2 -8 Z" fill="none" stroke="#64748b" strokeWidth="1" />
                <line x1="2" y1="0" x2="2" y2="3" stroke="#64748b" strokeWidth="1" />
                <line x1="8" y1="0" x2="8" y2="3" stroke="#64748b" strokeWidth="1" />
                <circle cx="2" cy="4" r="1.5" fill="#141414" />
                <circle cx="8" cy="4" r="1.5" fill="#141414" />
              </g>
              {/* "OPEN" Neon Sign */}
              <text x="200" y="55" textAnchor="middle" fill="#f43f5e" fontSize="8" fontWeight="black" className="animate-pulse">SHOP</text>
            </g>
          )}

          {/* Car Wash Building */}
          {hasCarWash && (
            <g transform="translate(-380, 40)">
              {/* Main Structure */}
              <path d="M 0 0 L 100 0 L 100 100 L 0 100 Z" fill="#e2e8f0" stroke="#141414" strokeWidth="2" />
              <path d="M 100 0 L 130 -20 L 130 80 L 100 100 Z" fill="#94a3b8" stroke="#141414" strokeWidth="2" />
              <path d="M 0 0 L 30 -20 L 130 -20 L 100 0 Z" fill="#f1f5f9" stroke="#141414" strokeWidth="2" />
              
              {/* Entrance Arch */}
              <path d="M 20 100 L 20 40 Q 50 20 80 40 L 80 100" fill="none" stroke="#141414" strokeWidth="3" />
              <rect x="25" y="45" width="50" height="55" fill="#334155" opacity="0.8" />
              
              {/* Sign */}
              <rect x="10" y="-30" width="80" height="20" fill="#141414" />
              <text x="50" y="-16" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="black" fontFamily="monospace">CAR WASH</text>
              
              {/* Bubbles / Water particles (Static for now) */}
              <circle cx="30" cy="50" r="3" fill="white" opacity="0.6" />
              <circle cx="70" cy="60" r="4" fill="white" opacity="0.4" />
              <circle cx="50" cy="40" r="2" fill="white" opacity="0.8" />
            </g>
          )}
          
          {/* Sign */}
          <g transform="translate(-250, 20)">
            <rect x="0" y="0" width="10" height="150" fill="#475569" stroke="#141414" strokeWidth="2" />
            <rect x="-20" y="0" width="50" height="40" fill="#141414" />
            <text x="5" y="25" textAnchor="middle" fill="#10b981" fontSize="10" fontWeight="bold" fontFamily="monospace">FUEL</text>
          </g>

          {/* Advertising Billboard */}
          <AnimatePresence>
            {isAdActive && (
              <motion.g 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transform="translate(0, -120)"
              >
                {/* Support Poles */}
                <rect x="-2" y="50" width="4" height="50" fill="#475569" stroke="#141414" strokeWidth="1" />
                <rect x="98" y="50" width="4" height="50" fill="#475569" stroke="#141414" strokeWidth="1" />
                
                {/* Billboard Frame */}
                <rect x="-20" y="0" width="140" height="60" fill="#141414" stroke="#141414" strokeWidth="2" />
                <rect x="-15" y="5" width="130" height="50" fill="#facc15" />
                
                {/* Gas Logo / Text */}
                <g transform="translate(50, 30)">
                  <circle r="18" fill="#141414" />
                  <path d="M -8 -8 L 8 8 M -8 8 L 8 -8" stroke="#facc15" strokeWidth="3" />
                  <text y="3" textAnchor="middle" fill="#facc15" fontSize="12" fontWeight="black" fontFamily="monospace" className="select-none">GAS</text>
                </g>
                
                {/* "SALE" or "NOW" text */}
                <text x="10" y="20" fill="#141414" fontSize="8" fontWeight="black" fontFamily="monospace">PROMO</text>
                <text x="90" y="50" fill="#141414" fontSize="8" fontWeight="black" fontFamily="monospace">ACTIVE</text>
              </motion.g>
            )}
          </AnimatePresence>
        </g>

        {/* Animated Cars */}
        <AnimatePresence>
          {cars.map(car => {
            const pumpX = car.pumpIndex === 0 ? 320 : 420;
            const targetX = car.isStopping ? [ -100, pumpX, pumpX, 900 ] : [ -100, 900 ];
            const targetY = car.isStopping ? [ 320 + car.lane * 30, 280, 280, 320 + car.lane * 30 ] : [ 320 + car.lane * 30, 320 + car.lane * 30 ];
            const times = car.isStopping ? [0, 0.3, 0.7, 1] : [0, 1];
            const duration = car.isStopping ? car.speed + 4 : car.speed;

            return (
              <motion.g
                key={car.id}
                initial={{ x: -100, y: 320 + car.lane * 30 }}
                animate={{ 
                  x: targetX,
                  y: targetY
                }}
                exit={{ opacity: 0 }}
                transition={{ 
                  times,
                  duration, 
                  ease: "easeInOut" 
                }}
              >
                {/* Simple Isometric Car Shape */}
                <rect width="50" height="25" fill={car.color} stroke="#141414" strokeWidth="2" rx="4" />
                <rect x="12" y="3" width="20" height="15" fill="#93c5fd" opacity="0.6" rx="2" />
                <circle cx="12" cy="25" r="5" fill="#141414" />
                <circle cx="38" cy="25" r="5" fill="#141414" />
              </motion.g>
            );
          })}
        </AnimatePresence>
      </svg>

      {/* Weather Effects Overlay */}
      {isSnowing && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 50 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full"
              initial={{ top: -10, left: `${Math.random() * 100}%` }}
              animate={{ 
                top: '100%',
                left: `${(Math.random() - 0.5) * 20 + (i * 2)}%`
              }}
              transition={{ 
                duration: 2 + Math.random() * 3, 
                repeat: Infinity, 
                ease: "linear",
                delay: Math.random() * 5
              }}
            />
          ))}
        </div>
      )}

      {isRaining && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 100 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-0.5 h-3 bg-blue-400/30"
              initial={{ top: -20, left: `${Math.random() * 100}%` }}
              animate={{ top: '100%' }}
              transition={{ 
                duration: 0.5 + Math.random() * 0.5, 
                repeat: Infinity, 
                ease: "linear",
                delay: Math.random() * 2
              }}
            />
          ))}
        </div>
      )}

      {/* Night Overlay */}
      {(hour < 6 || hour > 20) && (
        <div className="absolute inset-0 bg-blue-900/20 pointer-events-none" />
      )}
    </div>
  );
}
