
import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Legend, ReferenceLine 
} from 'recharts';
import { Indicator, ReportCriteria } from '../types';

interface IndicatorChartProps {
  indicator: Indicator;
  type: 'line' | 'bar';
}

const IndicatorChart: React.FC<IndicatorChartProps> = ({ indicator, type }) => {
  const data = indicator.monthlyValues;
  const color = indicator.criteria === ReportCriteria.Cumulative ? '#4f46e5' : '#10b981';

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        {type === 'line' ? (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="month" fontSize={10} tick={{ fill: '#64748b' }} />
            <YAxis fontSize={10} tick={{ fill: '#64748b' }} />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              labelStyle={{ fontWeight: 'bold' }}
            />
            <Legend verticalAlign="top" height={36} />
            <ReferenceLine y={indicator.goal} label={{ value: 'Meta', position: 'right', fill: '#ef4444', fontSize: 10 }} stroke="#ef4444" strokeDasharray="3 3" />
            <Line 
              type="monotone" 
              dataKey="value" 
              name={indicator.name}
              stroke={color} 
              strokeWidth={2} 
              dot={{ r: 4, fill: color }}
              activeDot={{ r: 6 }} 
            />
          </LineChart>
        ) : (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="month" fontSize={10} tick={{ fill: '#64748b' }} />
            <YAxis fontSize={10} tick={{ fill: '#64748b' }} />
            <Tooltip 
              cursor={{ fill: '#f1f5f9' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend verticalAlign="top" height={36} />
            <ReferenceLine y={indicator.goal} label={{ value: 'Meta', position: 'right', fill: '#ef4444', fontSize: 10 }} stroke="#ef4444" strokeDasharray="3 3" />
            <Bar dataKey="value" name={indicator.name} fill={color} radius={[4, 4, 0, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

export default IndicatorChart;
