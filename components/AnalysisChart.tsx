
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface AnalysisChartProps {
  data: { name: string; value: number }[];
  title: string;
}

const AnalysisChart: React.FC<AnalysisChartProps> = ({ data, title }) => {
  // Green and Silver metallic theme
  const COLORS = ['#10b981', '#a1a1aa', '#059669', '#d4d4d8', '#34d399'];

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl shadow-inner mt-6">
      <h3 className="text-zinc-400 text-sm font-semibold mb-4 uppercase tracking-wider">{title}</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} />
            <YAxis stroke="#71717a" fontSize={12} tickLine={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
              itemStyle={{ color: '#f4f4f5' }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AnalysisChart;
