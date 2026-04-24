import React, { useState, useEffect } from 'react';
import { MessageSquare, Lock, Key, Send, Bot, User, X, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const GeminiAssistant = ({ analysisData }) => {
  // Prefer env var (set VITE_GROQ_API_KEY in .env.local or deployment settings),
  // then fall back to what the user previously saved in localStorage.
  const envKey = import.meta.env.VITE_GROQ_API_KEY || '';
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || envKey);
  const [modelType, setModelType] = useState(localStorage.getItem('gemini_model_choice') || 'llama-3.3-70b-versatile');
  const [isLocked, setIsLocked] = useState(!apiKey);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hello! I am your AI Analysis Assistant. Please provide your API key to start.' }
  ]);
  const [loading, setLoading] = useState(false);
  const [showKeyDialog, setShowKeyDialog] = useState(!apiKey);
  const [errorInfo, setErrorInfo] = useState('');

  const validateAndSaveKey = async (e) => {
    e.preventDefault();
    const cleanKey = apiKey.trim();
    if (!cleanKey) return;

    setLoading(true);
    setErrorInfo('');

    try {

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cleanKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: modelType,
          messages: [{ role: 'user', content: 'hi' }],
          max_tokens: 10
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Invalid API Key');
      }

      localStorage.setItem('gemini_api_key', cleanKey);
      localStorage.setItem('gemini_model_choice', modelType);
      setIsLocked(false);
      setShowKeyDialog(false);
      setMessages([...messages, {
        role: 'bot',
        text: `✅ Connection successful! Sentinel Intelligence is now active.`
      }]);
    } catch (err) {
      console.error("Connection Error:", err);
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

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: modelType,
          messages: [
            {
              role: 'system',
              content: `You are 'AssetGuardian Sentinel AI'. 
              Context: ${JSON.stringify(analysisData)}
              Use Markdown formatting. Be professional and authoritative.`
            },
            { role: 'user', content: currentInput }
          ],
          temperature: 0.7,
          max_tokens: 1024
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Request failed');
      }

      const data = await response.json();
      const botResponse = data.choices[0].message.content;
      setMessages(prev => [...prev, { role: 'bot', text: botResponse }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'bot', text: `❌ Error: ${error.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const resetAssistant = () => {
    setLoading(false);
    setMessages(prev => [...prev, { role: 'bot', text: "🔄 Session reset." }]);
  };

  return (
    <div className="glass" style={{ padding: '1.5rem', marginTop: '2rem', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <MessageSquare size={24} className="gradient-text" />
          <h3 style={{ margin: 0 }}>Gemini Sentinel Assistant</h3>
        </div>
        <button
          onClick={() => setShowKeyDialog(true)}
          className="glass"
          style={{
            padding: '0.5rem 1rem',
            fontSize: '0.75rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'var(--text-secondary)'
          }}
        >
          <Key size={14} />
          {isLocked ? 'Setup API Key' : 'Change Settings'}
        </button>
      </div>

      <AnimatePresence>
        {showKeyDialog && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="glass"
            style={{
              padding: '1.5rem',
              marginBottom: '1rem',
              background: 'rgba(56, 189, 248, 0.05)',
              position: 'relative',
              zIndex: 100
            }}
          >
            <button onClick={() => setShowKeyDialog(false)} style={{ position: 'absolute', right: '1rem', top: '1rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <X size={16} />
            </button>
            <h4 style={{ marginBottom: '1rem' }}>AI Configuration</h4>
            <form onSubmit={validateAndSaveKey} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>API Key</label>
                <input
                  type="password"
                  placeholder="Paste your API key here..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    background: 'var(--bg-dark)',
                    border: '1px solid var(--glass-border)',
                    color: 'white'
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Model Selection</label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                  {["Performance", "Balanced", "Speed"].map((label, idx) => {
                    const models = ["llama-3.3-70b-versatile", "mixtral-8x7b-32768", "llama3-8b-8192"];
                    const m = models[idx];
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setModelType(m)}
                        className="glass"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.65rem', color: modelType === m ? 'var(--accent-primary)' : 'white', cursor: 'pointer' }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                <input
                  type="text"
                  value={modelType}
                  onChange={(e) => setModelType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    background: 'var(--bg-dark)',
                    border: '1px solid var(--glass-border)',
                    color: 'white',
                    display: 'none' // Hide raw model names from user
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '0.75rem',
                  borderRadius: '8px',
                  background: 'var(--accent-primary)',
                  color: 'var(--bg-dark)',
                  fontWeight: 'bold',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Connecting...' : 'Save & Active Gemini'}
              </button>
            </form>
            {errorInfo && (
              <div style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.75rem', padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '4px' }}>
                {errorInfo}
              </div>
            )}
            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Ensure your key provides access to advanced semantic models.</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        marginBottom: '1.5rem',
        maxHeight: '600px',
        paddingRight: '0.75rem',
        scrollbarWidth: 'thin'
      }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            display: 'flex',
            gap: '0.75rem',
            justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
            alignItems: 'flex-start'
          }}>
            {m.role === 'bot' && <Bot size={20} style={{ color: 'var(--accent-primary)', marginTop: '4px' }} />}
            <div style={{
              maxWidth: '80%',
              padding: '0.75rem 1rem',
              borderRadius: '12px',
              backgroundColor: m.role === 'user' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              border: m.role === 'user' ? '1px solid var(--accent-primary)' : '1px solid var(--glass-border)',
              fontSize: '0.9rem',
              lineHeight: '1.4'
            }}>
              <div style={{ whiteSpace: 'pre-wrap' }}>
                {m.text}
              </div>
            </div>
            {m.role === 'user' && <User size={20} style={{ color: 'var(--accent-secondary)', marginTop: '4px' }} />}
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ color: 'var(--accent-primary)', fontSize: '0.8rem', fontStyle: 'italic' }}>
              <RefreshCw size={14} className="loading-spinner" style={{ marginRight: '8px', display: 'inline-block' }} />
              Sentinel is analyzing...
            </div>
            <button
              onClick={resetAssistant}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.7rem', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Reset
            </button>
          </div>
        )}
      </div>

      <div style={{ position: 'relative' }}>
        {isLocked && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(4px)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            zIndex: 10
          }}>
            <Lock size={16} />
            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Unlock with API Key above</span>
          </div>
        )}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            placeholder="Ask anything (Powered by High-Speed Neural AI)..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && askGemini()}
            disabled={isLocked}
            style={{
              flex: 1,
              padding: '1rem',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--glass-border)',
              color: 'white',
              fontSize: '0.9rem'
            }}
          />
          <button
            onClick={askGemini}
            disabled={isLocked || loading}
            style={{
              width: '48px',
              borderRadius: '12px',
              background: 'var(--accent-primary)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--bg-dark)'
            }}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default GeminiAssistant;
