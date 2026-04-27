import { Trophy, CheckCircle2 } from 'lucide-react';

interface AchievementsProps {
  achievements: any[];
}

export const Achievements = ({ achievements }: AchievementsProps) => {
  return (
    <div className="bg-[#1a1a2e] p-6 rounded-2xl border border-gray-800">
      <h3 className="text-white font-bold mb-6 flex items-center gap-2">
        <Trophy className="text-yellow-500 w-5 h-5" /> 
        Unlocked Achievements
      </h3>
      <div className="flex flex-wrap gap-4">
        {achievements.map((achievement, idx) => (
          <div 
            key={idx} 
            className={`flex items-center gap-3 p-3 rounded-xl border ${
              achievement.unlocked 
              ? 'bg-green-500/10 border-green-500/30' 
              : 'bg-gray-800/50 border-gray-700 opacity-50'
            }`}
          >
            <CheckCircle2 className={achievement.unlocked ? 'text-green-400' : 'text-gray-500'} size={20} />
            <div>
              <p className="text-sm font-bold text-white leading-tight">{achievement.name}</p>
              <div className="w-full bg-gray-700 h-1 rounded-full mt-2">
                <div 
                  className="bg-cyan-400 h-1 rounded-full" 
                  style={{ width: `${achievement.progress}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
