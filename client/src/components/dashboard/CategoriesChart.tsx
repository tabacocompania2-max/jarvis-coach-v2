import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

interface CategoriesChartProps {
  data: any[];
}

const COLORS = ['#00d4ff', '#00ff88', '#ff6b6b', '#a855f7', '#eab308'];

export const CategoriesChart = ({ data }: CategoriesChartProps) => {
  return (
    <div className="bg-[#1a1a2e] p-6 rounded-2xl border border-gray-800 h-[400px]">
      <h3 className="text-white font-bold mb-6">Learning Categories</h3>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: '#1a1a2e', borderColor: '#2d2d44', borderRadius: '12px' }}
            itemStyle={{ color: '#fff' }}
          />
          <Legend 
            verticalAlign="bottom" 
            align="center"
            wrapperStyle={{ paddingTop: '20px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
