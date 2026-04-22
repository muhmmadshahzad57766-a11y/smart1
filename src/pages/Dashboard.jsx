import { useState, useEffect, useMemo } from 'react';
import { calculateRewards, getSettings, fetchInvestmentRequests, fetchUserRewards, fetchPlans } from '../lib/storage';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  Wallet,
  Award,
  History,
  Share2,
  Copy,
  CheckCircle,
  Shield,
  Users,
  Clock,
  Bell,
  AlertCircle
} from 'lucide-react';

const Dashboard = ({ user, setUser, theme }) => {
  const isDark = theme === 'dark';
  const [settings, setSettings] = useState(null);
  const [pendingInvestment, setPendingInvestment] = useState(null);
  const [userPlan, setUserPlan] = useState(null);
  const [userRewards, setUserRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (user && user.id) {
        let activeUser = user;
        const updatedUser = await calculateRewards(user.id);
        if (updatedUser) {
          setUser(updatedUser);
          activeUser = updatedUser;
        }

        const [appSettings, invReqs, rewards, plans] = await Promise.all([
          getSettings(),
          fetchInvestmentRequests(),
          fetchUserRewards(activeUser.id),
          fetchPlans()
        ]);

        setSettings(appSettings);
        setPendingInvestment(invReqs.find(r => r.userId === activeUser.id && r.status === 'pending') || null);
        setUserRewards(rewards);

        const currentPlan = plans.find(p => p.id === activeUser.planId);
        setUserPlan(currentPlan || null);
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

    // Prepare chart data (last 7 days)
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today - i * 86400000);
      const dayLabel = d.toLocaleDateString(undefined, { weekday: 'short' });
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
    const padding = 40;
    const width = 400;
    const height = 200;
    const maxVal = Math.max(...data.map(d => d.value), 100);
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
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {[0, 0.5, 1].map((v, i) => (
          <line
            key={i}
            x1={padding}
            y1={height - padding - v * (height - padding * 2)}
            x2={width - padding}
            y2={height - padding - v * (height - padding * 2)}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1"
          />
        ))}
        {/* Labels */}
        {data.map((d, i) => (
          <text
            key={i}
            x={padding + i * stepX}
            y={height - 10}
            fill="var(--text-dim)"
            fontSize="10"
            textAnchor="middle"
          >
            {d.label}
          </text>
        ))}
        {/* Area */}
        <polygon points={areaPoints} fill="url(#chartGradient)" />
        {/* Line */}
        <polyline
          fill="none"
          stroke="var(--primary)"
          strokeWidth="3"
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
            r="4"
            fill="var(--bg-dark)"
            stroke="var(--primary)"
            strokeWidth="2"
          />
        ))}
      </svg>
    );
  };

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto', paddingBottom: '100px' }} className="fade-in">

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem', fontWeight: 500 }}>Welcome,</p>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>{user.username}</h1>
        </div>
        <button className="glass" style={{ padding: '10px', borderRadius: '12px' }}>
          <Bell size={24} color="var(--text-main)" />
        </button>
      </div>

      {/* Main Balance Card */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{
          background: 'linear-gradient(135deg, #16a34a 0%, #059669 100%)',
          borderRadius: '24px',
          padding: '25px',
          color: 'white',
          marginBottom: '20px',
          boxShadow: '0 10px 30px rgba(22, 163, 74, 0.3)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '150px', height: '150px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
        <p style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '5px' }}>Total Balance</p>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '15px' }}>
          <span style={{ fontSize: '1.2rem', fontWeight: 400 }}>PKR</span> {(Number(user.balance) || 0).toLocaleString()}
        </h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>Live Assets</div>
          {pendingInvestment && <div className="badge" style={{ background: 'var(--accent-yellow)', color: 'black' }}>Pending Verification</div>}
        </div>
      </motion.div>

      {/* Three Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
        <div className="glass" style={{ padding: '20px', borderRadius: '20px' }}>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginBottom: '5px' }}>Today Profit</p>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-green)' }}>
            +PKR {stats.todayProfit.toLocaleString()}
          </h3>
        </div>
        <div className="glass" style={{ padding: '20px', borderRadius: '20px' }}>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginBottom: '5px' }}>Yesterday Profit</p>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)' }}>
            +PKR {stats.yesterdayProfit.toLocaleString()}
          </h3>
        </div>
      </div>

      <div className="glass" style={{ padding: '20px', borderRadius: '20px', marginBottom: '30px' }}>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginBottom: '5px' }}>Total Profit</p>
        <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>
          ++PKR {stats.totalProfit.toLocaleString()}
        </h3>
      </div>

      {/* Analytics Chart */}
      <div className="glass" style={{ padding: '25px', borderRadius: '24px', marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontWeight: 700, fontSize: '1.1rem' }}>Earnings Over Time</h3>
          <div style={{ display: 'flex', gap: '5px', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '10px' }}>
            <span style={{ padding: '4px 8px', fontSize: '0.7rem', background: 'var(--primary)', color: 'black', borderRadius: '8px', fontWeight: 600 }}>Daily</span>
            <span style={{ padding: '4px 8px', fontSize: '0.7rem', color: 'var(--text-dim)' }}>Weekly</span>
          </div>
        </div>
        <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {userRewards.length > 0 ? (
            <ChartSVG data={stats.chartData} />
          ) : (
            <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Start investing to see performance chart</p>
          )}
        </div>
      </div>

      {/* Investment Summary */}
      <div className="glass" style={{ padding: '25px', borderRadius: '24px', marginBottom: '30px' }}>
        <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '20px' }}>Investment Summary</h3>
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '10px' }}>
            <span style={{ color: 'var(--text-dim)' }}>Active Investment</span>
            <span style={{ color: 'var(--primary)', fontWeight: 700 }}>PKR {Number(user.investedAmount).toLocaleString()}</span>
          </div>
          <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: user.investedAmount > 0 ? '70%' : '0%' }}
              style={{ height: '100%', background: 'linear-gradient(90deg, var(--primary) 0%, var(--accent-green) 100%)' }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '4px' }}>Total Deposited</p>
            <p style={{ fontWeight: 800 }}>PKR {Number(user.investedAmount).toLocaleString()}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '4px' }}>Total Withdrawn</p>
            <p style={{ fontWeight: 800 }}>PKR {(stats.totalProfit - user.balance > 0 ? stats.totalProfit - user.balance : 0).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Bottom Sticky Bar */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 40px)',
        maxWidth: '460px',
        background: 'rgba(20, 20, 20, 0.8)',
        backdropFilter: 'blur(20px)',
        padding: '12px',
        borderRadius: '24px',
        boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        zIndex: 1000,
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <button
          onClick={() => window.location.href = '/dashboard'}
          className="glass"
          style={{ padding: '12px', borderRadius: '15px', background: 'none' }}
        >
          <History size={24} color="var(--text-main)" />
        </button>
        <button
          onClick={() => window.location.href = '/plans'}
          className="glass"
          style={{ flex: 1, padding: '14px', borderRadius: '18px', fontWeight: 700, fontSize: '1rem', background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)' }}
        >
          Deposit
        </button>
        <button
          onClick={() => window.location.href = '/withdraw'}
          style={{
            flex: 1,
            padding: '14px',
            borderRadius: '18px',
            fontWeight: 700,
            fontSize: '1rem',
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            color: 'black',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Withdraw
        </button>
      </div>

    </div>
  );
};

export default Dashboard;
