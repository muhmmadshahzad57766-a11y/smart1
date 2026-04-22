import { useState, useEffect, useMemo } from 'react';
import {
  fetchInvestmentRequests,
  fetchUserRewards,
  getSettings,
  calculateRewards
} from '../lib/storage';
import { motion } from 'framer-motion';
import {
  Menu
} from 'lucide-react';

const Dashboard = ({ user, setUser, theme }) => {
  const isDark = theme === 'dark';
  const [settings, setSettings] = useState(null);
  const [userRewards, setUserRewards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      if (user && user.id) {
        let activeUser = user;
        const updatedUser = await calculateRewards(user.id);
        if (updatedUser) {
          setUser(updatedUser);
          activeUser = updatedUser;
        }

        const [appSettings, invReqs, rewards] = await Promise.all([
          getSettings(),
          fetchInvestmentRequests(),
          fetchUserRewards(activeUser.id)
        ]);

        setSettings(appSettings);
        setUserRewards(rewards);
        setLoading(false);
      }
    };
    init();
  }, [user?.id]);

  const stats = useMemo(() => {
    const today = new Date().setHours(0, 0, 0, 0);
    const yesterday = new Date(today - 86400000).setHours(0, 0, 0, 0);

    const todayProfit = userRewards
      .filter(r => new Date(r.timestamp).setHours(0, 0, 0, 0) === today)
      .reduce((acc, r) => acc + (Number(r.amount) || 0), 0);

    const yesterdayProfit = userRewards
      .filter(r => new Date(r.timestamp).setHours(0, 0, 0, 0) === yesterday)
      .reduce((acc, r) => acc + (Number(r.amount) || 0), 0);

    const totalProfit = userRewards.reduce((acc, r) => acc + (Number(r.amount) || 0), 0);

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today - i * 86400000);
      const dayLabel = days[d.getDay()];
      const dayProfit = userRewards
        .filter(r => new Date(r.timestamp).setHours(0, 0, 0, 0) === d.setHours(0, 0, 0, 0))
        .reduce((acc, r) => acc + (Number(r.amount) || 0), 0);
      chartData.push({ label: dayLabel, value: dayProfit });
    }

    return { todayProfit, yesterdayProfit, totalProfit, chartData };
  }, [userRewards]);

  if (!user || loading) return <div style={{ padding: '50px', textAlign: 'center', color: 'var(--primary)' }}>Initializing Dashboard...</div>;

  const ChartSVG = ({ data }) => {
    if (!data || data.length === 0) return null;
    const padding = 30;
    const width = 400;
    const height = 180;
    const maxVal = Math.max(...data.map(d => d.value), 200);
    const stepX = (width - padding * 2) / (data.length - 1);

    const points = data.map((d, i) => {
      const x = padding + i * stepX;
      const y = height - padding - (d.value / maxVal) * (height - padding * 2);
      return `${x},${y}`;
    }).join(' ');

    const areaPoints = `${padding},${height - padding} ${points} ${width - padding},${height - padding}`;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto' }}>
        <defs>
          <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.15" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={areaPoints} fill="url(#chartFill)" />
        <polyline
          fill="none"
          stroke="var(--primary)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
        {data.map((d, i) => (
          <circle
            key={i}
            cx={padding + i * stepX}
            cy={height - padding - (d.value / maxVal) * (height - padding * 2)}
            r="4"
            fill={isDark ? '#020617' : '#fff'}
            stroke="var(--primary)"
            strokeWidth="2"
          />
        ))}
      </svg>
    );
  };

  return (
    <div style={{ background: 'var(--bg-darker)', minHeight: '100vh', width: '100vw', transition: 'all 0.3s ease' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: 'clamp(20px, 5vw, 40px)', paddingBottom: '120px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: '1.2' }}>
              Welcome,<br />
              <span style={{ fontWeight: 800 }}>{user.username}</span>
            </h1>
          </div>
          <button className="mobile-only" style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}>
            <Menu size={32} />
          </button>
        </div>

        {/* Main Section: Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '20px', marginBottom: '30px' }}>

          {/* Hero Balance Card */}
          <div
            style={{
              background: 'linear-gradient(135deg, #2dd4bf 0%, #3b82f6 100%)',
              borderRadius: '32px',
              padding: '30px',
              color: 'white',
              boxShadow: '0 20px 40px rgba(59, 130, 246, 0.2)',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              minHeight: '220px'
            }}
          >
            <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '180px', height: '180px', background: 'rgba(255,255,255,0.15)', borderRadius: '50%' }} />
            <p style={{ fontSize: '1rem', opacity: 0.9, marginBottom: '8px', fontWeight: 600 }}>Total Balance</p>
            <h2 style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>PKR</span> {(Number(user.balance) || 0).toLocaleString()}
            </h2>
            <div style={{
              display: 'inline-flex',
              background: 'rgba(255,255,255,0.25)',
              padding: '8px 20px',
              borderRadius: '100px',
              fontSize: '0.9rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              width: 'fit-content'
            }}>
              Live Assets
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Today Profit */}
            <div className="glass" style={{ padding: '25px', borderRadius: '28px', border: '1px solid var(--glass-border)' }}>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.95rem', fontWeight: 600, marginBottom: '10px' }}>Today Profit</p>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-green)' }}>
                PKR {stats.todayProfit.toLocaleString()}
              </h3>
            </div>
            {/* Yesterday Profit */}
            <div className="glass" style={{ padding: '25px', borderRadius: '28px', border: '1px solid var(--glass-border)' }}>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.95rem', fontWeight: 600, marginBottom: '10px' }}>Yesterday Profit</p>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-green)' }}>
                PKR {stats.yesterdayProfit.toLocaleString()}
              </h3>
            </div>
            {/* Total Profit */}
            <div className="glass" style={{ padding: '25px', borderRadius: '28px', border: '1px solid var(--glass-border)', gridColumn: 'span 2' }}>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.95rem', fontWeight: 600, marginBottom: '10px' }}>Total Profit</p>
              <h3 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-main)' }}>
                PKR {stats.totalProfit.toLocaleString()}
              </h3>
            </div>
          </div>
        </div>

        {/* Analytics Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', gap: '30px' }}>
          {/* Chart Card */}
          <div className="glass" style={{ padding: '30px', borderRadius: '32px', border: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <h3 style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-main)' }}>Earnings Over Time</h3>
              <div style={{ display: 'flex', gap: '8px', background: 'var(--surface-light)', padding: '6px', borderRadius: '15px' }}>
                <span style={{ padding: '6px 14px', fontSize: '0.8rem', background: 'var(--primary)', color: 'white', borderRadius: '12px', fontWeight: 700 }}>Daily</span>
                <span style={{ padding: '6px 14px', fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>Weekly</span>
              </div>
            </div>
            <div style={{ height: '200px' }}>
              <ChartSVG data={stats.chartData} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
              {stats.chartData.map((d, i) => (
                <span key={i} style={{ color: 'var(--text-dim)', fontSize: '0.75rem', fontWeight: 600 }}>{d.label}</span>
              ))}
            </div>
          </div>

          {/* Investment Summary */}
          <div className="glass" style={{ padding: '30px', borderRadius: '32px', border: '1px solid var(--glass-border)' }}>
            <h3 style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '30px', color: 'var(--text-main)' }}>Investment Summary</h3>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-main)', fontWeight: 800, marginBottom: '15px' }}>Active Investment</p>
            <div style={{ width: '100%', height: '14px', background: 'var(--surface-light)', borderRadius: '10px', overflow: 'hidden', marginBottom: '25px' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: user.investedAmount > 0 ? '68%' : '0%' }}
                style={{ height: '100%', background: 'linear-gradient(90deg, #2dd4bf, #3b82f6)' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)', marginBottom: '6px', fontWeight: 600 }}>Total Deposited</p>
                <p style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--text-main)' }}>PKR {Number(user.investedAmount).toLocaleString()}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)', marginBottom: '6px', fontWeight: 600 }}>Total Withdrawn</p>
                <p style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--text-main)' }}>PKR {(stats.totalProfit - user.balance > 0 ? stats.totalProfit - user.balance : 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile-Only Bottom Nav */}
        <div
          className="mobile-only"
          style={{
            position: 'fixed',
            bottom: '30px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'calc(100% - 60px)',
            maxWidth: '480px',
            background: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(20px)',
            padding: '16px',
            borderRadius: '32px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
            zIndex: 1000,
            border: '1px solid var(--glass-border)'
          }}
        >
          <button style={{ background: 'none', border: 'none', color: 'var(--text-main)', padding: '10px' }}>
            <Menu size={26} />
          </button>
          <button
            onClick={() => window.location.href = '/plans'}
            style={{ flex: 1, padding: '18px', borderRadius: '20px', fontWeight: 800, fontSize: '1rem', background: 'var(--surface-light)', color: 'var(--text-main)', border: 'none', cursor: 'pointer' }}
          >
            Deposit
          </button>
          <button
            onClick={() => window.location.href = '/withdraw'}
            style={{
              flex: 1,
              padding: '18px',
              borderRadius: '20px',
              fontWeight: 800,
              fontSize: '1rem',
              background: 'linear-gradient(135deg, #2dd4bf, #3b82f6)',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 8px 20px rgba(45, 212, 191, 0.4)'
            }}
          >
            Withdraw
          </button>
        </div>

        <style>{`
          @media (min-width: 769px) {
            .mobile-only {
              display: none !important;
            }
          }
        `}</style>

      </div>
    </div>
  );
};

export default Dashboard;
