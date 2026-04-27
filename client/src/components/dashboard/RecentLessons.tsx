interface RecentLessonsProps {
  lessons: any[];
}

export const RecentLessons = ({ lessons }: RecentLessonsProps) => {
  return (
    <div className="bg-[#1a1a2e] p-6 rounded-2xl border border-gray-800 overflow-x-auto">
      <h3 className="text-white font-bold mb-6">Recent Sessions</h3>
      <table className="w-full text-left">
        <thead>
          <tr className="text-gray-400 border-b border-gray-800">
            <th className="pb-4 font-medium">Date</th>
            <th className="pb-4 font-medium">Words</th>
            <th className="pb-4 font-medium">Score</th>
            <th className="pb-4 font-medium">Duration</th>
          </tr>
        </thead>
        <tbody className="text-gray-300">
          {lessons.map((lesson, idx) => (
            <tr key={idx} className="border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors">
              <td className="py-4">{new Date(lesson.date).toLocaleDateString()}</td>
              <td className="py-4">{lesson.wordsTotal || 20}</td>
              <td className="py-4">
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                  lesson.score >= 90 ? 'bg-green-500/20 text-green-400' : 
                  lesson.score >= 70 ? 'bg-yellow-500/20 text-yellow-400' : 
                  'bg-red-500/20 text-red-400'
                }`}>
                  {lesson.score}%
                </span>
              </td>
              <td className="py-4">{lesson.completionTime} min</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
