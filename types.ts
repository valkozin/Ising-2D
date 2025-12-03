export interface SimulationStats {
  step: number;
  magnetization: number;
  energy: number;
  temperature: number;
  magneticField: number;
}

export enum SpinState {
  UP = 1,
  DOWN = -1
}

export interface GridConfig {
  size: number; // NxN grid
  canvasSize: number; // Pixels
}