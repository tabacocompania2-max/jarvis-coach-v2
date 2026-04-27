import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface ProgressChartProps {
  data: any[];
}

export const ProgressChart = ({ data }: ProgressChartProps) => {
  return (
    <div className="bg-[#1a1a2e] p-6 rounded-2xl border border-gray-800 h-[400px]">
      <h3 className="text-white font-bold mb-6">Weekly Progress</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2d2d44" vertical={false} />
          <XAxis 
            dataKey="day" 
            stroke="#94a3b8" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
          />
          <YAxis 
            stroke="#94a3b8" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1a1a2e', borderColor: '#2d2d44', borderRadius: '12px' }}
            itemStyle={{ color: '#00d4ff' }}
          />
          <Line 
            type="monotone" 
            dataKey="score" 
            stroke="#00d4ff" 
            strokeWidth={3} 
            dot={{ r: 4, fill: '#00d4ff', strokeWidth: 2, stroke: '#1a1a2e' }}
            activeDot={{ r: 6, fill: '#00d4ff', strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
