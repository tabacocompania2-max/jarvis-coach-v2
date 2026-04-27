import React from 'react';
import { motion } from 'framer-motion';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendColor?: string;
}

export const StatsCard = ({ label, value, icon, trend, trendColor = 'text-cyan-400' }: StatsCardProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#1a1a2e] p-6 rounded-2xl border border-gray-800 flex flex-col justify-between"
    >
      <div className="flex justify-between items-start mb-4">
        <span className="text-gray-400 font-medium">{label}</span>
        <div className="text-cyan-400 p-2 bg-[#00d4ff10] rounded-lg">
          {icon}
        </div>
      </div>
      <div className="flex items-end justify-between">
        <h3 className="text-3xl font-bold text-white">{value}</h3>
        {trend && (
          <span className={`text-sm font-medium ${trendColor}`}>
            {trend}
          </span>
        )}
      </div>
    </motion.div>
  );
};
