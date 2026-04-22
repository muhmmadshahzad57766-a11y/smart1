import { useState, useEffect, useMemo } from 'react';
import {
  fetchInvestmentRequests,
  fetchUserRewards,
  getSettings,
  calculateRewards,
  fetchPlans
} from '../lib/storage';
import { motion } from 'framer-motion';
import {
  History,
  Menu,
  TrendingUp,
  Wallet,
  CheckCircle,
  Clock,
  Shield,
  Award,
  Users,
  Copy,
  Bell
} from 'lucide-react';

const Dashboard = ({ user, setUser, theme }) => {
  const [settings, setSettings] = useState(null);
  const [pendingInvestment, setPendingInvestment] = useState(null);
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
        setPendingInvestment(invReqs.find(r => r.userId === activeUser.id && r.status === 'pending') || null);
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

    // Prepare chart data (last 7 days as in image: Sun, Mon, Tue...)
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today - i * 86400000);
      const dayLabel = days[d.getDay()];
      const dayProfit = userRewards
        .filter(r => new Date(r.timestamp).setHours(0, 0, 0, 0) === d.setHours(0, 0, 0, 0))
        .reduce((acc, r) => acc + (Number(r.amount) || 0), 0);
      chartData.push({ label: dayLabel, value: i === 0 ? todayProfit : (i === 1 ? yesterdayProfit : dayProfit) });
    }

    return { todayProfit, yesterdayProfit, totalProfit, chartData };
  }, [userRewards]);

  if (!user || loading) return <div style={{ padding: '50px', textAlign: 'center', color: '#14b8a6' }}>Initializing Dashboard...</div>;

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
            <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Horizontal Grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((v, i) => (
          <line
            key={i}
            x1={padding}
            y1={height - padding - v * (height - padding * 2)}
            x2={width - padding}
            y2={height - padding - v * (height - padding * 2)}
            stroke="#f1f5f9"
            strokeWidth="1"
          />
        ))}
        {/* X Labels */}
        {data.map((d, i) => (
          <text
            key={i}
            x={padding + i * stepX}
            y={height - 5}
            fill="#94a3b8"
            fontSize="10"
            textAnchor="middle"
          >
            {d.label}
          </text>
        ))}
        {/* Area */}
        <polygon points={areaPoints} fill="url(#chartFill)" />
        {/* Smooth Line */}
        <polyline
          fill="none"
          stroke="#14b8a6"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
        {/* Dots */}
        {data.map((d, i) => (
          <circle
            key={i}
            cx={padding + i * stepX}
            cy={height - padding - (d.value / maxVal) * (height - padding * 2)}
            r="3"
            fill="white"
            stroke="#14b8a6"
            strokeWidth="1.5"
          />
        ))}
      </svg>
    );
  };

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', padding: '20px', maxWidth: '480px', margin: '0 auto', color: '#1e293b', paddingBottom: '100px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', marginTop: '20px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1e293b' }}>
          Welcome,<br />
          <span style={{ fontSize: '1.5rem', opacity: 0.8 }}>{user.username}</span>
        </h1>
        <button style={{ background: 'none', border: 'none', color: '#1e293b' }}>
          <Menu size={28} />
        </button>
      </div>

      {/* Hero Balance Card */}
      <div
        style={{
          background: 'linear-gradient(135deg, #14b8a6 0%, #3b82f6 100%)',
          borderRadius: '32px',
          padding: '30px',
          color: 'white',
          marginBottom: '20px',
          boxShadow: '0 15px 30px rgba(20, 184, 166, 0.25)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '120px', height: '120px', background: 'rgba(255,255,255,0.1)', borderRadius: '100px' }} />
        <p style={{ fontSize: '0.95rem', opacity: 0.9, marginBottom: '8px', fontWeight: 500 }}>Total Balance</p>
        <h2 style={{ fontSize: '2.8rem', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.4rem', fontWeight: 600 }}>PKR</span> {(Number(user.balance) || 0).toLocaleString()}
        </h2>
        <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.2)', padding: '6px 16px', borderRadius: '100px', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
          Live Assets
        </div>
      </div>

      {/* Profit Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
        <div style={{ background: 'white', padding: '20px', borderRadius: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
          <p style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>Today Profit</p>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981' }}>
            +PKR {stats.todayProfit.toLocaleString()}
          </h3>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
          <p style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>Yesterday Profit</p>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#3b82f6' }}>
            +PKR {stats.yesterdayProfit.toLocaleString()}
          </h3>
        </div>
      </div>

      <div style={{ background: 'white', padding: '25px', borderRadius: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', marginBottom: '30px' }}>
        <p style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>Total Profit</p>
        <h3 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>
          ++{stats.totalProfit.toLocaleString()}
        </h3>
      </div>

      {/* Analytics Chart */}
      <div style={{ background: 'white', padding: '25px', borderRadius: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontWeight: 700, fontSize: '1.1rem' }}>Earnings Over Time</h3>
          <div style={{ display: 'flex', gap: '8px', background: '#f1f5f9', padding: '4px', borderRadius: '12px' }}>
            <span style={{ padding: '4px 10px', fontSize: '0.75rem', background: 'white', color: '#1e293b', borderRadius: '10px', fontWeight: 700, boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>Daily</span>
            <span style={{ padding: '4px 10px', fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Weekly</span>
            <span style={{ padding: '4px 10px', fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Monthly</span>
          </div>
        </div>
        <div style={{ height: '180px' }}>
          <ChartSVG data={stats.chartData} />
        </div>
      </div>

      {/* Investment Summary */}
      <div style={{ background: 'white', padding: '25px', borderRadius: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', marginBottom: '30px' }}>
        <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '20px' }}>Investment Summary</h3>
        <p style={{ fontSize: '0.9rem', color: '#1e293b', fontWeight: 700, marginBottom: '12px' }}>Active Investment</p>
        <div style={{ width: '100%', height: '10px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden', marginBottom: '20px' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: user.investedAmount > 0 ? '65%' : '0%' }}
            style={{ height: '100%', background: 'linear-gradient(90deg, #14b8a6, #3b82f6)' }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px' }}>
          <div>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '4px', fontWeight: 600 }}>Total Deposited</p>
            <p style={{ fontWeight: 800, fontSize: '1.1rem' }}>PKR {Number(user.investedAmount).toLocaleString()}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '4px', fontWeight: 600 }}>Total Withdrawn</p>
            <p style={{ fontWeight: 800, fontSize: '1.1rem' }}>PKR {(stats.totalProfit - user.balance > 0 ? stats.totalProfit - user.balance : 0).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Nav Bar */}
      <div style={{
        position: 'fixed',
        bottom: '25px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 40px)',
        maxWidth: '440px',
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(15px)',
        padding: '14px',
        borderRadius: '24px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        zIndex: 1000,
        border: '1px solid rgba(255,255,255,0.4)'
      }}>
        <button onClick={() => window.location.href = '/dashboard'} style={{ background: 'none', border: 'none', color: '#1e293b', padding: '10px' }}>
          <Menu size={24} />
        </button>
        <button
          onClick={() => window.location.href = '/plans'}
          style={{ flex: 1, padding: '16px', borderRadius: '18px', fontWeight: 700, fontSize: '1rem', background: '#f1f5f9', color: '#1e293b', border: 'none', cursor: 'pointer' }}
        >
          Deposit
        </button>
        <button
          onClick={() => window.location.href = '/withdraw'}
          style={{
            flex: 1,
            padding: '16px',
            borderRadius: '18px',
            fontWeight: 700,
            fontSize: '1rem',
            background: 'linear-gradient(135deg, #14b8a6, #3b82f6)',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 5px 15px rgba(20, 184, 166, 0.3)'
          }}
        >
          Withdraw
        </button>
      </div>

    </div>
  );
};

export default Dashboard;
