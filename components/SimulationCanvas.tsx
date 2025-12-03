
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GRID_SIZE, CANVAS_SIZE, COLOR_SPIN_UP, COLOR_SPIN_DOWN, STEPS_PER_FRAME, UPDATE_STATS_EVERY_FRAME } from '../constants';
import { SimulationStats } from '../types';

interface SimulationCanvasProps {
  temperature: number;
  magneticField: number;
  isRunning: boolean;
  onStatsUpdate: (stats: SimulationStats) => void;
  resetSignal: number; // Increment to trigger reset
}

const SimulationCanvas: React.FC<SimulationCanvasProps> = ({ 
  temperature, 
  magneticField,
  isRunning, 
  onStatsUpdate,
  resetSignal
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridRef = useRef<Int8Array>(new Int8Array(GRID_SIZE * GRID_SIZE)); // 1D array for performance
  const reqIdRef = useRef<number>();
  const stepCountRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);

  // Initialize grid (Random start)
  const initializeGrid = useCallback(() => {
    const grid = gridRef.current;
    // Re-allocate if size changed (though constants usually static, good practice for HMR)
    if (grid.length !== GRID_SIZE * GRID_SIZE) {
        gridRef.current = new Int8Array(GRID_SIZE * GRID_SIZE);
    }
    const currentGrid = gridRef.current;
    for (let i = 0; i < currentGrid.length; i++) {
      currentGrid[i] = Math.random() > 0.5 ? 1 : -1;
    }
    stepCountRef.current = 0;
    draw();
    calculateStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle Reset
  useEffect(() => {
    initializeGrid();
  }, [resetSignal, initializeGrid]);

  // Metropolis Algorithm Step
  const performStep = () => {
    const grid = gridRef.current;
    const N = GRID_SIZE;
    
    // Optimized loop for JS performance
    for (let k = 0; k < STEPS_PER_FRAME; k++) {
      // Pick random site
      // Using bitwise OR 0 for slightly faster integer casting if needed, but Math.floor is optimized in V8
      const x = (Math.random() * N) | 0;
      const y = (Math.random() * N) | 0;
      const idx = y * N + x;
      
      const spin = grid[idx];
      
      // Periodic boundary conditions optimization
      // Faster: x === N - 1 ? 0 : x + 1
      
      const rightIdx = y * N + (x === N - 1 ? 0 : x + 1);
      const leftIdx = y * N + (x === 0 ? N - 1 : x - 1);
      const downIdx = (y === N - 1 ? 0 : y + 1) * N + x;
      const upIdx = (y === 0 ? N - 1 : y - 1) * N + x;

      const sumNeighbors = grid[rightIdx] + grid[leftIdx] + grid[downIdx] + grid[upIdx];
      
      // deltaE = 2 * spin * (sumNeighbors + H)
      // Including External Magnetic Field contribution
      const deltaE = 2 * spin * (sumNeighbors + magneticField);
      
      if (deltaE <= 0) {
        grid[idx] = -spin as -1 | 1;
      } else {
        if (Math.random() < Math.exp(-deltaE / temperature)) {
          grid[idx] = -spin as -1 | 1;
        }
      }
    }
    stepCountRef.current += STEPS_PER_FRAME;
  };

  // Draw Grid to Canvas
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false }); // Optimize by disabling alpha channel
    if (!ctx) return;

    const cellSize = CANVAS_SIZE / GRID_SIZE;
    
    // Performance: clear whole canvas with background color first
    ctx.fillStyle = COLOR_SPIN_DOWN;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    const grid = gridRef.current;
    ctx.fillStyle = COLOR_SPIN_UP;
    
    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
        if (grid[i] === 1) {
            const x = i % GRID_SIZE;
            const y = (i / GRID_SIZE) | 0;
            ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
    }
  };

  const calculateStats = () => {
    const grid = gridRef.current;
    let totalM = 0;
    let interactionE = 0;
    const N = GRID_SIZE;
    const size = N * N;

    for (let i = 0; i < size; i++) {
        totalM += grid[i];
    }
    
    // Energy calculation
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const idx = y * N + x;
        const spin = grid[idx];
        // Only count right and down to avoid double counting bonds
        const right = grid[y * N + (x === N - 1 ? 0 : x + 1)];
        const down = grid[(y === N - 1 ? 0 : y + 1) * N + x];
        interactionE += -spin * (right + down);
      }
    }

    // Total Energy = Interaction Energy - H * M
    const totalE = interactionE - (magneticField * totalM);

    onStatsUpdate({
      step: stepCountRef.current,
      magnetization: totalM / size, // Raw M (can be negative now with field)
      energy: totalE / size, // E per spin
      temperature,
      magneticField
    });
  };

  // Main Loop
  const loop = () => {
    if (!isRunning) return;

    performStep();
    draw();

    frameCountRef.current++;
    if (frameCountRef.current % UPDATE_STATS_EVERY_FRAME === 0) {
      calculateStats();
    }

    reqIdRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => {
    if (isRunning) {
      reqIdRef.current = requestAnimationFrame(loop);
    } else {
      if (reqIdRef.current) cancelAnimationFrame(reqIdRef.current);
    }
    return () => {
      if (reqIdRef.current) cancelAnimationFrame(reqIdRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, temperature, magneticField]);

  return (
    <div className="relative rounded-xl overflow-hidden shadow-2xl border-4 border-slate-700">
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        className="block bg-slate-900 cursor-crosshair"
      />
      {/* Overlay info */}
      <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm px-3 py-1 rounded text-xs text-white font-mono pointer-events-none">
        {GRID_SIZE}x{GRID_SIZE}
      </div>
    </div>
  );
};

export default SimulationCanvas;
