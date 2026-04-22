import React from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  Users, 
  FileText, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Zap
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { cn } from '../lib/utils';

const DATA = [
  { name: 'Mon', usage: 400 },
  { name: 'Tue', usage: 300 },
  { name: 'Wed', usage: 600 },
  { name: 'Thu', usage: 800 },
  { name: 'Fri', usage: 500 },
  { name: 'Sat', usage: 200 },
  { name: 'Sun', usage: 100 },
];

const CATEGORIES = [
  { name: 'Engineering', count: 124, color: '#635bff' },
  { name: 'Legal', count: 86, color: '#f59e0b' },
  { name: 'HR', count: 42, color: '#10b981' },
  { name: 'Marketing', count: 98, color: '#ef4444' },
];

export default function Dashboard() {
  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl font-serif font-bold tracking-tight text-white italic">Intelligence <span className="text-enterprise-accent not-italic">Propulsion</span></h1>
        <p className="text-enterprise-muted text-sm uppercase tracking-widest font-bold">Consolidated Telemetry & Asset Propagation</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Total Managed Assets" 
          value="14.2 TB" 
          trend="+1.2%" 
          trendUp={true} 
          icon={<FileText size={18} />} 
        />
        <StatCard 
          label="Federated Access Nodes" 
          value="1,204" 
          trend="Secure" 
          trendUp={true} 
          icon={<Users size={18} />} 
        />
        <StatCard 
          label="Ingestion Velocity" 
          value="842 MB/s" 
          trend="Nominal" 
          trendUp={true} 
          icon={<Zap size={18} />} 
        />
        <StatCard 
          label="System Entropy" 
          value="0.04%" 
          trend="-0.01%" 
          trendUp={true} 
          icon={<Activity size={18} />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 glass-morphism rounded-2xl p-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
             <TrendingUp size={120} strokeWidth={1} />
          </div>
          <div className="flex items-center justify-between mb-8 relative z-10">
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Propagation Dynamics</h3>
              <p className="text-[10px] text-enterprise-muted font-bold uppercase tracking-[0.2em] mt-1 text-enterprise-accent">Real-time throughput metrics</p>
            </div>
            <select className="bg-enterprise-input border border-enterprise-border text-white text-[10px] font-bold uppercase tracking-widest rounded px-3 py-1.5 outline-none focus:ring-1 ring-enterprise-accent">
              <option>Interval: 24H</option>
              <option>Interval: 7D</option>
            </select>
          </div>
          
          <div className="h-[320px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={DATA}>
                <defs>
                  <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a',
                    borderRadius: '8px', 
                    border: '1px solid #1e293b', 
                    fontSize: '10px',
                    color: '#fff'
                  }} 
                />
                <Area type="monotone" dataKey="usage" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorUsage)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="glass-morphism rounded-2xl p-8 shadow-2xl flex flex-col border-enterprise-accent/5">
          <h3 className="text-lg font-bold text-white mb-8 tracking-tight">Domain Clustering</h3>
          <div className="flex-1 space-y-6">
            {CATEGORIES.map((cat, idx) => (
              <div key={idx} className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-white uppercase tracking-widest">{cat.name}</span>
                  <span className="font-mono text-[10px] text-enterprise-muted">{cat.count} Units</span>
                </div>
                <div className="h-1.5 w-full bg-enterprise-input rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(cat.count / 150) * 100}%` }}
                    transition={{ duration: 1.5, delay: idx * 0.1, ease: "circOut" }}
                    className="h-full rounded-full shadow-[0_0_10px]"
                    style={{ backgroundColor: cat.color, boxShadow: `0 0 10px ${cat.color}66` }}
                  />
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-12 pt-6 border-t border-enterprise-border">
            <button className="w-full flex items-center justify-center gap-2 py-3 bg-enterprise-input hover:bg-enterprise-accent/10 border border-enterprise-border text-white font-bold text-[10px] uppercase tracking-[0.2em] rounded-lg transition-all active:scale-95">
              Secure Audit Access
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, trend, trendUp, icon }: { label: string, value: string, trend: string, trendUp: boolean, icon: React.ReactNode }) {
  return (
    <div className="glass-morphism p-6 rounded-2xl border border-enterprise-border shadow-2xl hover:border-enterprise-accent/20 transition-all flex flex-col gap-4 group">
      <div className="flex items-start justify-between">
        <div className="w-9 h-9 bg-enterprise-bg rounded-lg border border-enterprise-border flex items-center justify-center text-enterprise-accent group-hover:bg-enterprise-accent group-hover:text-white transition-all shadow-inner">
          {icon}
        </div>
        <div className={cn(
          "status-badge",
          trendUp ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
        )}>
          {trend}
        </div>
      </div>
      <div>
        <h4 className="text-[9px] font-bold text-enterprise-muted uppercase tracking-[0.2em] mb-1">{label}</h4>
        <p className="text-2xl font-serif italic text-white tracking-tight">{value}</p>
      </div>
    </div>
  );
}

