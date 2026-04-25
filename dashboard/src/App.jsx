import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Activity, 
  AlertTriangle, 
  Globe, 
  Search, 
  Settings, 
  BarChart3, 
  TrendingUp,
  Cpu
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { motion } from 'framer-motion';
import GeminiAssistant from './components/GeminiAssistant';
import Scoreboard from './components/Scoreboard';
import TakedownsLog from './components/TakedownsLog';

const data = [
  { name: '00:00', matches: 40, violations: 24 },
  { name: '04:00', matches: 30, violations: 13 },
  { name: '08:00', matches: 20, violations: 98 },
  { name: '12:00', matches: 27, violations: 39 },
  { name: '16:00', matches: 18, violations: 48 },
  { name: '20:00', matches: 23, violations: 38 },
  { name: '23:59', matches: 34, violations: 43 },
];

// In production (Vercel), VITE_API_URL = https://assetguardian-backend.onrender.com
// In development, it's empty so relative paths go through the Vite proxy
const API_BASE = import.meta.env.VITE_API_URL || '';

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentTopic, setCurrentTopic] = useState('All Assets');
  const [stats, setStats] = useState({
    total_monitored: "1.2M",
    high_risk_flags: 0,
    auto_takedowns: 0,
    ai_precision: "0%"
  });
  const [detections, setDetections] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(false);

  const topics = ["All Assets", "IPL", "India Cricket", "F1", "Tennis", "Badminton", "NBA", "UFC"];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const statsRes = await fetch(`${API_BASE}/api/protection/stats?topic=${currentTopic}`);
        const statsData = await statsRes.json();
        setStats(statsData);

        const detectionsRes = await fetch(`${API_BASE}/api/protection/detections?topic=${currentTopic}`);
        const detectionsData = await detectionsRes.json();
        setDetections(detectionsData);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // Auto-refresh main data every 10 seconds for a "Live" feel
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [currentTopic]);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/protection/trending`);
        const data = await res.json();
        setTrending(data);
      } catch (err) {
        console.error("Trending fetch error:", err);
      }
    };
    fetchTrending();
    // Auto-refresh trending data every 60 seconds
    const interval = setInterval(fetchTrending, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-container">
      <aside className="sidebar glass">
        <div className="logo">
          <h2 className="gradient-text">AssetGuardian</h2>
          <p style={{fontSize: '0.75rem', color: 'var(--text-secondary)'}}>Sentinel Intelligence</p>
        </div>
        
        <nav style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
          <NavItem icon={<Activity size={20}/>} label="Live Monitoring" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavItem icon={<TrendingUp size={20}/>} label="Analytics" active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} />
          <NavItem icon={<ShieldCheck size={20}/>} label="Authenticated Assets" active={activeTab === 'assets'} onClick={() => setActiveTab('assets')} />
          <NavItem icon={<AlertTriangle size={20}/>} label="Enforcement" active={activeTab === 'enforcement'} onClick={() => setActiveTab('enforcement')} />
        </nav>

        <div style={{marginTop: 'auto', padding: '1rem', borderTop: '1px solid var(--glass-border)'}}>
          <p style={{fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.5rem'}}>ACTIVE TOPIC</p>
          <select 
            value={currentTopic} 
            onChange={(e) => setCurrentTopic(e.target.value)}
            className="glass"
            style={{
              width: '100%',
              padding: '0.5rem',
              color: 'white',
              background: 'var(--bg-dark)',
              border: '1px solid var(--glass-border)',
              borderRadius: '8px',
              fontSize: '0.8rem'
            }}
          >
            {topics.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div style={{marginTop: '1rem'}}>
          <NavItem icon={<Settings size={20}/>} label="Settings" />
        </div>
      </aside>

      <main className="main-content">
        <header style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}}>
          <div>
            <h1>{currentTopic} Overview</h1>
            <p style={{color: 'var(--text-secondary)'}}>Real-time protection for {currentTopic} media assets</p>
          </div>
          <div className="glass" style={{padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem'}}>
            <span className={`live-indicator ${loading ? 'loading' : ''}`}></span>
            <span style={{fontWeight: 500, fontSize: '0.875rem'}}>{loading ? 'REFRESHING...' : 'CRAWLERS ACTIVE'}</span>
          </div>
        </header>

        <Scoreboard />

        <div className="stats-grid">
          <StatCard title="Total Monitored" value={stats.total_monitored} subValue="+12% today" icon={<Globe color="var(--accent-primary)"/>} />
          <StatCard title="High Risk Flags" value={stats.high_risk_flags} subValue="Action required" icon={<AlertTriangle color="var(--danger)"/>} />
          <StatCard title="Auto-Takedowns" value={stats.auto_takedowns} subValue="Last 24h" icon={<ShieldCheck color="var(--success)"/>} />
          <StatCard title="AI Precision" value={stats.ai_precision} subValue="Sentinel v2.1" icon={<Cpu color="var(--accent-secondary)"/>} />
        </div>

        <section className="glass" style={{padding: '1.5rem', marginBottom: '2rem'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem'}}>
            <h3>Detection Velocity</h3>
            <BarChart3 size={20} color="var(--text-secondary)" />
          </div>
          <div style={{height: '300px', width: '100%'}}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorMatches" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="var(--text-secondary)" />
                <Tooltip 
                  contentStyle={{background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', borderRadius: '8px'}}
                  itemStyle={{color: 'var(--text-primary)'}}
                />
                <Area type="monotone" dataKey="violations" stroke="var(--accent-primary)" fillOpacity={1} fill="url(#colorMatches)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="glass" style={{padding: '1.5rem', marginBottom: '2rem'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
            <h3>Global Intelligence Feed</h3>
            <span style={{fontSize: '0.7rem', color: 'var(--accent-primary)', fontWeight: 'bold'}}>AUTO-DISCOVERING TRENDS...</span>
          </div>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem'}}>
            {trending.map((t, i) => (
              <motion.div 
                key={i}
                whileHover={{ scale: 1.02 }}
                onClick={() => setCurrentTopic(t.subject)}
                className="glass" 
                style={{ 
                  padding: '1rem', 
                  cursor: 'pointer', 
                  borderLeft: `4px solid ${t.status.includes('High') || t.status.includes('Critical') ? 'var(--danger)' : 'var(--accent-primary)'}` 
                }}
              >
                <div style={{fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem'}}>{t.interest}</div>
                <div style={{fontWeight: 600, fontSize: '1rem'}}>{t.subject}</div>
                <div style={{fontSize: '0.75rem', marginTop: '0.5rem', color: 'var(--text-secondary)'}}>{t.status}</div>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="glass" style={{padding: '1.5rem'}}>
          <h3>Recent {currentTopic} Violations</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ASSET</th>
                  <th>PLATFORM</th>
                  <th>RISK LEVEL</th>
                  <th>AI CONFIDENCE</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {detections.map((d, i) => (
                  <TableRow 
                    key={i}
                    name={d.name} 
                    platform={d.platform} 
                    risk={d.risk} 
                    confidence={d.confidence} 
                    action="Pending" 
                    danger={d.danger} 
                  />
                ))}
                {detections.length === 0 && !loading && (
                  <tr><td colSpan="5" style={{textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)'}}>No violations detected for this topic.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <TakedownsLog topic={currentTopic} />

        <GeminiAssistant analysisData={{
          ...stats,
          active_topic: currentTopic,
          top_platforms: ["YouTube", "Twitter", "Instagram", "Twitch"]
        }} />
      </main>
    </div>
  );
};

const NavItem = ({ icon, label, active, onClick }) => (
  <div 
    onClick={onClick}
    style={{
      padding: '0.75rem 1rem',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      cursor: 'pointer',
      backgroundColor: active ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
      color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
      transition: 'all 0.2s',
      fontWeight: active ? '600' : '400'
    }}
    className="nav-item-hover"
  >
    {icon}
    <span>{label}</span>
  </div>
);

const StatCard = ({ title, value, subValue, icon }) => (
  <motion.div 
    className="glass stat-card"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '1rem'}}>
      <span style={{color: 'var(--text-secondary)', fontSize: '0.875rem'}}>{title}</span>
      {icon}
    </div>
    <div style={{fontSize: '1.5rem', fontWeight: 'bold'}}>{value}</div>
    <div style={{color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.25rem'}}>{subValue}</div>
  </motion.div>
);

const TableRow = ({ name, platform, risk, confidence, action, danger }) => (
  <tr>
    <td style={{fontWeight: 500}}>{name}</td>
    <td>{platform}</td>
    <td>
      <span className={`badge ${danger ? 'badge-danger' : 'badge-success'}`}>
        {risk}
      </span>
    </td>
    <td style={{fontFamily: 'monospace'}}>{confidence}</td>
    <td style={{color: danger ? 'var(--danger)' : 'var(--text-secondary)', fontSize: '0.875rem'}}>{action}</td>
  </tr>
);

export default App;
