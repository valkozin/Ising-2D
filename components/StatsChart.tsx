
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { SimulationStats } from '../types';

interface StatsChartProps {
  data: SimulationStats[];
}

const StatsChart: React.FC<StatsChartProps> = ({ data }) => {
  // We only show the last 100 points to keep performance high
  const chartData = data.slice(-100);

  return (
    <div className="h-48 w-full bg-slate-800 rounded-lg p-2 border border-slate-700 shadow-inner">
      <h3 className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider text-center">Намагниченность M</h3>
      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="step" hide />
          {/* Changed domain to [-1, 1] to reflect signed magnetization with field */}
          <YAxis domain={[-1, 1]} stroke="#94a3b8" fontSize={10} width={30} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f1f5f9' }}
            itemStyle={{ color: '#38bdf8' }}
            formatter={(value: number) => [value.toFixed(3), 'M']}
            labelFormatter={() => ''}
          />
          <ReferenceLine y={0} stroke="#475569" />
          <Line 
            type="monotone" 
            dataKey="magnetization" 
            stroke="#38bdf8" 
            strokeWidth={2} 
            dot={false} 
            isAnimationActive={false} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StatsChart;
