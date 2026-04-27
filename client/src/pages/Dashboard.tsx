import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Book, Flame, Clock, Target, Download } from 'lucide-react';
import { StatsCard } from '../components/dashboard/StatsCard';
import { ProgressChart } from '../components/dashboard/ProgressChart';
import { CategoriesChart } from '../components/dashboard/CategoriesChart';
import { RecentLessons } from '../components/dashboard/RecentLessons';
import { Achievements } from '../components/dashboard/Achievements';
import { PronunciationStats } from '../components/dashboard/PronunciationStats';
import { useAuth } from '../hooks/useAuth';

export const Dashboard = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [weeklyData, setWeeklyData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [pronStats, setPronStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      if (!token) return;

      try {
        const headers = { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

        const [sRes, wRes, cRes, lRes, aRes, pRes] = await Promise.all([
          fetch(`${apiUrl}/api/user/stats`, { headers }),
          fetch(`${apiUrl}/api/analytics/weekly`, { headers }),
          fetch(`${apiUrl}/api/analytics/categories`, { headers }),
          fetch(`${apiUrl}/api/lessons/history?limit=5`, { headers }),
          fetch(`${apiUrl}/api/user/achievements`, { headers }),
          fetch(`${apiUrl}/api/analytics/pronunciation`, { headers })
        ]);

        const [sData, wData, cData, lData, aData, pData] = await Promise.all([
          sRes.json(), wRes.json(), cRes.json(), lRes.json(), aRes.json(), pRes.json()
        ]);

        setStats(sData);
        setWeeklyData(wData);
        setCategories(cData);
        setLessons(lData.lessons);
        setAchievements(aData);
        setPronStats(pData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f1e] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full"
          />
          <p className="text-cyan-400 animate-pulse text-sm font-medium">Loading your progress...</p>
        </div>
      </div>
    );
  }

  // Safety check to prevent crash if data failed to load
  if (!stats) {
    return (
      <div className="min-h-screen bg-[#0f0f1e] flex items-center justify-center text-white">
        <p>Error loading dashboard. Please check your server connection.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f1e] text-white p-4 md:p-8 pb-32">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Progress Overview</h1>
            <p className="text-gray-400">Welcome back, Carlos! Keep pushing your limits.</p>
          </div>
          <button className="flex items-center gap-2 bg-[#1a1a2e] px-4 py-2 rounded-xl border border-gray-800 hover:bg-gray-800 transition-colors">
            <Download size={18} />
            <span className="text-sm font-medium">Download Report</span>
          </button>
        </header>

        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard 
            label="Words Learned" 
            value={stats.palabras_totales} 
            icon={<Book size={24} />} 
            trend="+12% this week"
          />
          <StatsCard 
            label="Day Streak" 
            value={`${stats.dias_racha} Days`} 
            icon={<Flame size={24} />} 
            trend="Keep it up!"
            trendColor="text-orange-400"
          />
          <StatsCard 
            label="Study Time" 
            value={`${stats.tiempo_total_horas}h`} 
            icon={<Clock size={24} />} 
            trend="45m avg/day"
          />
          <StatsCard 
            label="Retention Rate" 
            value={`${stats.tasa_retencion}%`} 
            icon={<Target size={24} />} 
            trend="+5% improvement"
            trendColor="text-green-400"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <ProgressChart data={weeklyData} />
          <CategoriesChart data={categories} />
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <RecentLessons lessons={lessons} />
            <Achievements achievements={achievements} />
          </div>
          <div className="space-y-8">
            <PronunciationStats stats={pronStats} />
            {/* Quick Actions or Level Display */}
            <div className="bg-gradient-to-br from-cyan-600 to-blue-700 p-6 rounded-2xl">
              <h4 className="text-white font-bold mb-2">Current Level</h4>
              <p className="text-3xl font-black text-white uppercase tracking-wider mb-4">
                {stats.nivel_actual}
              </p>
              <div className="w-full bg-black/20 h-2 rounded-full mb-2">
                <div className="bg-white h-full rounded-full" style={{ width: '65%' }} />
              </div>
              <p className="text-xs text-blue-100">65% to next level: Intermediate</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
