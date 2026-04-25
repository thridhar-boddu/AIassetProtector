import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ChevronDown, ChevronUp, ExternalLink, Trash2 } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';

const TakedownsLog = ({ topic }) => {
  const [takedowns, setTakedowns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  const fetchTakedowns = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/protection/takedowns?topic=${encodeURIComponent(topic)}`);
      const data = await res.json();
      setTakedowns(data);
    } catch (e) {
      console.error('Takedowns fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTakedowns();
    const interval = setInterval(fetchTakedowns, 15000);
    return () => clearInterval(interval);
  }, [topic]);

  const statusColor = (status) => {
    if (status === 'Confirmed') return 'var(--success)';
    if (status === 'Pending') return '#f59e0b';
    return 'var(--text-secondary)';
  };

  return (
    <section className="glass" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Trash2 size={20} style={{ color: 'var(--success)' }} />
          <h3 style={{ margin: 0 }}>Takedowns Log</h3>
        </div>
        <span style={{ fontSize: '0.7rem', color: 'var(--success)', fontWeight: 'bold' }}>
          {loading ? 'UPDATING...' : `${takedowns.length} RECORDS`}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <AnimatePresence>
          {takedowns.map((td, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass"
              style={{
                padding: '0.75rem 1rem',
                borderLeft: `3px solid ${statusColor(td.status)}`,
                cursor: 'pointer',
                background: 'rgba(255,255,255,0.02)'
              }}
              onClick={() => setExpanded(expanded === i ? null : i)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <ShieldCheck size={14} style={{ color: statusColor(td.status), flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{td.title}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{td.platform} · {td.takenAt}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{
                    fontSize: '0.65rem',
                    fontWeight: 'bold',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                    background: `${statusColor(td.status)}22`,
                    color: statusColor(td.status)
                  }}>
                    {td.status}
                  </span>
                  {expanded === i ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
              </div>

              <AnimatePresence>
                {expanded === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    style={{ overflow: 'hidden', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--glass-border)' }}
                  >
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.75rem' }}>
                      <div><span style={{ color: 'var(--text-secondary)' }}>File Type:</span> {td.fileType}</div>
                      <div><span style={{ color: 'var(--text-secondary)' }}>Views Before Removal:</span> {td.views}</div>
                      <div><span style={{ color: 'var(--text-secondary)' }}>AI Confidence:</span> {td.confidence}</div>
                      <div><span style={{ color: 'var(--text-secondary)' }}>Enforcement Method:</span> {td.method}</div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Original URL: </span>
                        <span style={{ fontFamily: 'monospace', color: 'var(--accent-primary)', fontSize: '0.7rem' }}>
                          {td.url}
                        </span>
                      </div>
                      {td.eventSource && (
                        <div style={{ gridColumn: '1 / -1' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Linked Live Event: </span>
                          <span style={{ color: 'var(--accent-secondary)', fontWeight: 600 }}>{td.eventSource}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>

        {!loading && takedowns.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            No takedowns recorded for this topic yet.
          </div>
        )}
        {loading && takedowns.length === 0 && (
          <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
            Loading takedowns log...
          </div>
        )}
      </div>
    </section>
  );
};

export default TakedownsLog;
