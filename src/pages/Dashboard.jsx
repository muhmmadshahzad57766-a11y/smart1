import { useState, useEffect, useMemo } from 'react';
import {
  fetchInvestmentRequests,
  fetchUserRewards,
  getSettings,
  calculateRewards
} from '../lib/storage';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Menu,
  X,
  Copy,
  Share2,
  Users,
  Wallet as WalletIcon,
  DollarSign,
  TrendingUp
} from 'lucide-react';

const Dashboard = ({ user, setUser, theme }) => {
  const isDark = theme === 'dark';
  const [settings, setSettings] = useState(null);
  const [userRewards, setUserRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('daily');
  const [showMessage, setShowMessage] = useState(true);
  const [copyFeedback, setCopyFeedback] = useState({ code: false, link: false });
  const navigate = useNavigate();

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback({ ...copyFeedback, [type]: true });
    setTimeout(() => setCopyFeedback({ ...copyFeedback, [type]: false }), 2000);
  };

  const referralLink = `${window.location.origin}/login?ref=${user.referralCode}`;

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

    const chartData = [];
    if (timeframe === 'daily') {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today - i * 86400000);
        const dayLabel = days[d.getDay()];
        const dayProfit = userRewards
          .filter(r => new Date(r.timestamp).setHours(0, 0, 0, 0) === d.setHours(0, 0, 0, 0))
          .reduce((acc, r) => acc + (Number(r.amount) || 0), 0);
        chartData.push({ label: dayLabel, value: dayProfit });
      }
    } else {
      // Weekly: Last 4 weeks
      for (let i = 3; i >= 0; i--) {
        const start = new Date(today - (i * 7 + 6) * 86400000).setHours(0, 0, 0, 0);
        const end = new Date(today - i * 7 * 86400000).setHours(23, 59, 59, 999);
        const weekProfit = userRewards
          .filter(r => {
            const ts = new Date(r.timestamp).getTime();
            return ts >= start && ts <= end;
          })
          .reduce((acc, r) => acc + (Number(r.amount) || 0), 0);
        chartData.push({ label: `W${4 - i}`, value: weekProfit });
      }
    }

    return { todayProfit, yesterdayProfit, totalProfit, chartData };
  }, [userRewards, timeframe]);

  if (!user || loading) return <div style={{ padding: '50px', textAlign: 'center', color: 'var(--primary)' }}>Initializing Dashboard...</div>;

  const ChartSVG = ({ data }) => {
    if (!data || data.length === 0) return null;
    const padding = 30;
    const width = 400;
    const height = 180;
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
        </div>

        {/* Main Section: Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '15px', marginBottom: '30px' }}>

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
            <h2 style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>PKR</span> {((Number(user.balance) || 0) + (Number(user.investedAmount) || 0)).toLocaleString()}
            </h2>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '25px', flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate('/plans')}
                className="glass"
                style={{
                  padding: '12px 24px',
                  background: 'rgba(255,255,255,0.2)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: 'white',
                  borderRadius: '16px',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s'
                }}
              >
                <TrendingUp size={18} /> Deposit
              </button>
              <button
                onClick={() => navigate('/withdraw')}
                className="glass"
                style={{
                  padding: '12px 24px',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'white',
                  borderRadius: '16px',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s'
                }}
              >
                <WalletIcon size={18} /> Withdraw
              </button>
            </div>

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
                <button
                  onClick={() => setTimeframe('daily')}
                  style={{
                    padding: '6px 14px',
                    fontSize: '0.8rem',
                    background: timeframe === 'daily' ? 'var(--primary)' : 'none',
                    color: timeframe === 'daily' ? 'white' : 'var(--text-dim)',
                    borderRadius: '12px',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Daily
                </button>
                <button
                  onClick={() => setTimeframe('weekly')}
                  style={{
                    padding: '6px 14px',
                    fontSize: '0.8rem',
                    background: timeframe === 'weekly' ? 'var(--primary)' : 'none',
                    color: timeframe === 'weekly' ? 'white' : 'var(--text-dim)',
                    borderRadius: '12px',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Weekly
                </button>
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

        {/* Referral Program Section */}
        <div className="glass" style={{
          marginTop: '40px',
          padding: 'clamp(20px, 5vw, 40px)',
          borderRadius: '32px',
          background: 'linear-gradient(135deg, rgba(79, 172, 254, 0.05) 0%, rgba(240, 147, 251, 0.05) 100%)',
          border: '1px solid var(--glass-border)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.05 }}>
            <Users size={120} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '30px' }}>
            <div style={{ flex: '1', minWidth: '300px' }}>
              <div style={{ display: 'inline-flex', padding: '10px', background: 'rgba(79, 172, 254, 0.1)', borderRadius: '12px', color: 'var(--primary)', marginBottom: '15px' }}>
                <Share2 size={24} />
              </div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '10px' }}>Referral <span className="gradient-text">Program</span></h2>
              <p style={{ color: 'var(--text-dim)', marginBottom: '25px', lineHeight: 1.6, maxWidth: '500px' }}>
                Invite your friends and earn rewards! You get a <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{settings?.referralRewardPercent || 10}% bonus</span> on every investment they make.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '15px' }}>
                <div className="glass" style={{ padding: '20px', borderRadius: '20px', background: 'rgba(255,255,255,0.02)' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '5px' }}>Total Referrals</p>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={18} color="var(--primary)" /> {user.referralCount || 0}
                  </h3>
                </div>
                <div className="glass" style={{ padding: '20px', borderRadius: '20px', background: 'rgba(255,255,255,0.02)' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '5px' }}>Referral Earnings</p>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <WalletIcon size={18} /> PKR {(Number(user.referralEarnings) || 0).toLocaleString()}
                  </h3>
                </div>
              </div>
            </div>

            <div style={{ flex: '1', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ fontSize: '0.9rem', color: 'var(--text-dim)', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Your Referral Code</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div className="glass" style={{ flex: 1, padding: '12px 20px', fontWeight: 700, letterSpacing: '2px', color: 'var(--primary)', textAlign: 'center', fontSize: '1.1rem', background: 'rgba(255,255,255,0.03)' }}>
                    {user.referralCode}
                  </div>
                  <button
                    onClick={() => copyToClipboard(user.referralCode, 'code')}
                    className="glass"
                    style={{ padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: copyFeedback.code ? 'var(--accent-green)' : 'var(--text-main)', cursor: 'pointer', transition: 'all 0.2s' }}
                  >
                    {copyFeedback.code ? <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Copied!</span> : <Copy size={20} />}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.9rem', color: 'var(--text-dim)', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Referral Link</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div className="glass" style={{
                    flex: 1,
                    padding: '12px 20px',
                    fontSize: '0.85rem',
                    color: 'var(--text-dim)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    background: 'rgba(255,255,255,0.03)'
                  }}>
                    {referralLink}
                  </div>
                  <button
                    onClick={() => copyToClipboard(referralLink, 'link')}
                    className="glass"
                    style={{ padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: copyFeedback.link ? 'var(--accent-green)' : 'var(--text-main)', cursor: 'pointer', transition: 'all 0.2s' }}
                  >
                    {copyFeedback.link ? <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Copied!</span> : <Copy size={20} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Quick Actions */}
        <div style={{
          marginTop: '40px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '15px'
        }}>
          <button
            onClick={() => navigate('/plans')}
            className="gradient-btn"
            style={{
              padding: '24px',
              borderRadius: '28px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              fontSize: '1.2rem',
              cursor: 'pointer'
            }}
          >
            <TrendingUp size={32} />
            Deposit
          </button>
          <button
            onClick={() => navigate('/withdraw')}
            className="glass"
            style={{
              padding: '24px',
              borderRadius: '28px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              fontSize: '1.2rem',
              background: 'var(--surface)',
              border: '2px solid var(--glass-border)',
              cursor: 'pointer',
              color: 'var(--text-main)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: 'var(--shadow-md)'
            }}
          >
            <WalletIcon size={32} />
            Withdraw
          </button>
        </div>


      </div>
    </div>
  );
};

export default Dashboard;
