import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RefreshCcw } from 'lucide-react';

const Scoreboard = () => {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentLeague, setCurrentLeague] = useState('cricket/8048'); // Default to IPL

  const leagues = [
    { id: 'cricket/8048', name: 'IPL' },
    { id: 'cricket/1', name: 'India Cricket' },
    { id: 'soccer/ind.1', name: 'ISL' },
    { id: 'racing/f1', name: 'F1' },
    { id: 'tennis/atp', name: 'Tennis' },
    { id: 'basketball/nba', name: 'NBA' }
  ];

  const fetchScores = async () => {
    setLoading(true);
    try {
      const response = await fetch(`https://site.api.espn.com/apis/site/v2/sports/${currentLeague}/scoreboard`);
      const data = await response.json();
      
      const events = data.events.map(event => ({
        id: event.id,
        name: event.name,
        shortName: event.shortName,
        status: event.status.type.shortDetail,
        score: event.competitions[0].competitors 
          ? `${event.competitions[0].competitors[0].score} - ${event.competitions[0].competitors[1].score}`
          : "TBD",
        teams: [
          { 
            name: event.competitions[0].competitors[0].team.abbreviation, 
            logo: event.competitions[0].competitors[0].team.logo || 'https://a.espncdn.com/i/teamlogos/default-team-logo-500.png'
          },
          { 
            name: event.competitions[0].competitors[1].team.abbreviation, 
            logo: event.competitions[0].competitors[1].team.logo || 'https://a.espncdn.com/i/teamlogos/default-team-logo-500.png'
          }
        ]
      })).slice(0, 5);

      setScores(events);
    } catch (error) {
      console.error("Score fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScores();
    const interval = setInterval(fetchScores, 30000); // 30s refresh
    return () => clearInterval(interval);
  }, [currentLeague]);

  return (
    <div className="glass" style={{ padding: '1rem', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Trophy size={18} className="gradient-text" />
          <h4 style={{ margin: 0, fontSize: '0.9rem' }}>Live Global Scoreboard</h4>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {leagues.map(l => (
            <button 
              key={l.id}
              onClick={() => setCurrentLeague(l.id)}
              style={{
                background: currentLeague === l.id ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                border: '1px solid var(--glass-border)',
                borderRadius: '6px',
                color: currentLeague === l.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                fontSize: '0.7rem',
                padding: '0.25rem 0.5rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {l.name}
            </button>
          ))}
          <button onClick={fetchScores} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <RefreshCcw size={14} className={loading ? 'loading-spinner' : ''} />
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem', scrollbarWidth: 'none' }}>
        {scores.length > 0 ? (
          scores.map((s) => (
            <motion.div 
              key={s.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass"
              style={{ 
                minWidth: '200px', 
                padding: '0.75rem', 
                background: 'rgba(255,255,255,0.03)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                <span>{s.status}</span>
                <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>LIVE</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <img src={s.teams[0].logo} alt="" style={{ width: '20px' }} />
                  <span style={{ fontWeight: 600 }}>{s.teams[0].name}</span>
                </div>
                <span style={{ fontWeight: 'bold' }}>{s.score.split('-')[0]}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <img src={s.teams[1].logo} alt="" style={{ width: '20px' }} />
                  <span style={{ fontWeight: 600 }}>{s.teams[1].name}</span>
                </div>
                <span style={{ fontWeight: 'bold' }}>{s.score.split('-')[1]}</span>
              </div>
            </motion.div>
          ))
        ) : (
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '1rem' }}>
            {loading ? 'Fetching live signals...' : 'No active games found for this league.'}
          </div>
        )}
      </div>
    </div>
  );
};

export default Scoreboard;
