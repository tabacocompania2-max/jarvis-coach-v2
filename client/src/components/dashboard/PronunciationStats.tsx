import { Mic2, TrendingUp, AlertTriangle } from 'lucide-react';

interface PronunciationStatsProps {
  stats: any;
}

export const PronunciationStats = ({ stats }: PronunciationStatsProps) => {
  if (!stats) return null;

  return (
    <div className="bg-[#1a1a2e] p-6 rounded-2xl border border-gray-800">
      <h3 className="text-white font-bold mb-6">Pronunciation Insights</h3>
      
      <div className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400 text-sm flex items-center gap-2">
              <Mic2 size={16} className="text-cyan-400" /> Accuracy Average
            </span>
            <span className="text-white font-bold">{stats.accuracy_average || 0}%</span>
          </div>
          <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-cyan-400 h-full rounded-full transition-all duration-1000"
              style={{ width: `${stats.accuracy_average || 0}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-[#00ff8808] rounded-xl border border-green-500/20">
            <p className="text-green-400 text-xs font-bold uppercase mb-2 flex items-center gap-1">
              <TrendingUp size={12} /> Strengths
            </p>
            <p className="text-gray-300 text-sm">{stats.improvements}</p>
          </div>
          <div className="p-4 bg-[#ff6b6b08] rounded-xl border border-red-500/20">
            <p className="text-red-400 text-xs font-bold uppercase mb-2 flex items-center gap-1">
              <AlertTriangle size={12} /> Focus Areas
            </p>
            <p className="text-gray-300 text-sm">{stats.weak_areas}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
