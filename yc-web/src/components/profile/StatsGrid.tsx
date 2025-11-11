interface Stat {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
}

interface StatsGridProps {
  stats: Stat[];
}

const StatsGrid: React.FC<StatsGridProps> = ({ stats }) => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8">
    {stats.map((stat, i) => (
      <div
        key={i}
        className="bg-white shadow-sm rounded-lg p-6 text-center border border-gray-100 hover:shadow-md transition"
      >
        <div className="text-3xl font-semibold text-indigo-600">{stat.value}</div>
        <p className="text-gray-500 mt-1 text-sm font-medium">{stat.label}</p>
      </div>
    ))}
  </div>
);

export default StatsGrid;
