import React, { useState } from 'react';
import { MessageSquare, Lock, Key, Send, Bot, User, X, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Get Gemini API key: https://aistudio.google.com/app/apikey (free)
const ENV_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const GeminiAssistant = ({ analysisData }) => {
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || ENV_KEY);
  const [isLocked, setIsLocked] = useState(!(localStorage.getItem('gemini_api_key') || ENV_KEY));
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'bot', text: '👋 Hello! I am **Gemini Sentinel**, powered by Google Gemini AI.\nProvide your Gemini API key to start — or get one free at [aistudio.google.com](https://aistudio.google.com/app/apikey).' }
  ]);
  const [loading, setLoading] = useState(false);
  const [showKeyDialog, setShowKeyDialog] = useState(!(localStorage.getItem('gemini_api_key') || ENV_KEY));
  const [errorInfo, setErrorInfo] = useState('');

  const validateAndSaveKey = async (e) => {
    e.preventDefault();
    const cleanKey = apiKey.trim();
    if (!cleanKey) return;

    setLoading(true);
    setErrorInfo('');

    try {
      // Validate by making a real minimal Gemini request
      const res = await fetch(`${GEMINI_URL}?key=${cleanKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'hi' }] }]
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Invalid API Key');
      }

      localStorage.setItem('gemini_api_key', cleanKey);
      setIsLocked(false);
      setShowKeyDialog(false);
      setMessages(prev => [...prev, {
        role: 'bot',
        text: '✅ **Gemini connected!** AssetGuardian Sentinel Intelligence is now active.\n\nAsk me anything about your current protection status.'
      }]);
    } catch (err) {
      setErrorInfo(`Validation failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const askGemini = async () => {
    if (!input.trim() || isLocked) return;

    const userMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setLoading(true);

    const systemPrompt = `You are 'AssetGuardian Sentinel AI', an expert in digital sports media rights enforcement and piracy detection.
Current monitoring context:
${JSON.stringify(analysisData, null, 2)}

Guidelines:
- Be professional, precise, and authoritative
- Reference the live data above when relevant
- Use markdown formatting (bold, bullets, headers)
- Focus on actionable insights for content protection teams`;

    // Build conversation history for multi-turn chat
    const history = messages
      .filter(m => m.role !== 'bot' || messages.indexOf(m) > 0) // skip initial greeting
      .map(m => ({
        role: m.role === 'bot' ? 'model' : 'user',
        parts: [{ text: m.text }]
      }));

    history.push({ role: 'user', parts: [{ text: currentInput }] });

    try {
      const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: history,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024
          }
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Request failed');
      }

      const data = await res.json();
      const botText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response received.';
      setMessages(prev => [...prev, { role: 'bot', text: botText }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'bot', text: `❌ Error: ${error.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const resetAssistant = () => {
    setLoading(false);
    setMessages(prev => [...prev, { role: 'bot', text: '🔄 Session reset. Ready for new queries.' }]);
  };

  return (
    <div className="glass" style={{ padding: '1.5rem', marginTop: '2rem', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <MessageSquare size={24} className="gradient-text" />
          <div>
            <h3 style={{ margin: 0 }}>Gemini Sentinel Assistant</h3>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Powered by Google Gemini {GEMINI_MODEL}</span>
          </div>
        </div>
        <button
          onClick={() => setShowKeyDialog(true)}
          className="glass"
          style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}
        >
          <Key size={14} />
          {isLocked ? 'Setup Gemini Key' : 'Change Key'}
        </button>
      </div>

      <AnimatePresence>
        {showKeyDialog && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="glass"
            style={{ padding: '1.5rem', marginBottom: '1rem', background: 'rgba(56, 189, 248, 0.05)', position: 'relative', zIndex: 100 }}
          >
            <button onClick={() => setShowKeyDialog(false)} style={{ position: 'absolute', right: '1rem', top: '1rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <X size={16} />
            </button>
            <h4 style={{ marginBottom: '0.25rem' }}>Google Gemini API Key</h4>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Get a free key at{' '}
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-primary)' }}>
                aistudio.google.com
              </a>
            </p>
            <form onSubmit={validateAndSaveKey} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input
                type="password"
                placeholder="Paste your Gemini API key (AIza...)"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'white' }}
              />
              <button
                type="submit"
                disabled={loading}
                style={{ padding: '0.75rem', borderRadius: '8px', background: 'var(--accent-primary)', color: 'var(--bg-dark)', fontWeight: 'bold', border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                {loading ? 'Connecting to Gemini...' : '🔗 Connect Gemini'}
              </button>
            </form>
            {errorInfo && (
              <div style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.75rem', padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '4px' }}>
                {errorInfo}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.5rem', maxHeight: '600px', paddingRight: '0.75rem', scrollbarWidth: 'thin' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', gap: '0.75rem', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-start' }}>
            {m.role === 'bot' && <Bot size={20} style={{ color: 'var(--accent-primary)', marginTop: '4px', flexShrink: 0 }} />}
            <div style={{
              maxWidth: '80%', padding: '0.75rem 1rem', borderRadius: '12px',
              backgroundColor: m.role === 'user' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              border: m.role === 'user' ? '1px solid var(--accent-primary)' : '1px solid var(--glass-border)',
              fontSize: '0.9rem', lineHeight: '1.6', whiteSpace: 'pre-wrap'
            }}>
              {m.text}
            </div>
            {m.role === 'user' && <User size={20} style={{ color: 'var(--accent-secondary)', marginTop: '4px', flexShrink: 0 }} />}
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ color: 'var(--accent-primary)', fontSize: '0.8rem', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <RefreshCw size={14} className="loading-spinner" />
              Gemini is analyzing...
            </div>
            <button onClick={resetAssistant} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.7rem', cursor: 'pointer', textDecoration: 'underline' }}>
              Reset
            </button>
          </div>
        )}
      </div>

      <div style={{ position: 'relative' }}>
        {isLocked && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(4px)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', zIndex: 10 }}>
            <Lock size={16} />
            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Connect your Gemini API key above</span>
          </div>
        )}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            placeholder="Ask Gemini about your asset protection status..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && askGemini()}
            disabled={isLocked}
            style={{ flex: 1, padding: '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', color: 'white', fontSize: '0.9rem' }}
          />
          <button
            onClick={askGemini}
            disabled={isLocked || loading}
            style={{ width: '48px', borderRadius: '12px', background: 'var(--accent-primary)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--bg-dark)' }}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default GeminiAssistant;
