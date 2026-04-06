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

const Dashboard = ({ user, setUser }) => {
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

  const copyReferral = () => {
    if (user && user.referralCode) {
      const link = `${window.location.origin}/login?ref=${user.referralCode}`;
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const stats = useMemo(() => {
    if (!userPlan) return { rewardPercent: 0, totalEarned: 0 };
    const rewardPercent = ((userPlan.dailyReward / userPlan.price) * 100).toFixed(1);
    const totalEarned = userRewards.reduce((acc, r) => acc + (Number(r.amount) || 0), 0);
    return { rewardPercent, totalEarned };
  }, [userPlan, userRewards]);

  if (!user || loading) return <div style={{ padding: '50px', textAlign: 'center' }}>Loading user data...</div>;

  return (
    <div style={{ padding: 'clamp(15px, 4vw, 30px)', maxWidth: '1200px', margin: '0 auto' }} className="fade-in">

      {/* Notifications / Alerts */}
      <AnimatePresence>
        {pendingInvestment && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              borderRadius: '20px',
              padding: '20px',
              marginBottom: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '15px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ padding: '10px', background: 'var(--accent-yellow)', borderRadius: '12px', color: 'black' }}>
                <Clock size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--accent-yellow)' }}>Investment Pending Verification</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                  Your request for the <b>{pendingInvestment.planName || 'Plan'}</b> is being reviewed by Admin.
                </div>
              </div>
            </div>
            <div className="badge badge-warning">Verification Active</div>
          </motion.div>
        )}

        {userPlan && userRewards.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: '20px',
              padding: '20px',
              marginBottom: '30px',
              display: 'flex',
              alignItems: 'center',
              gap: '15px'
            }}
          >
            <div style={{ padding: '10px', background: 'var(--accent-green)', borderRadius: '12px', color: 'black' }}>
              <CheckCircle size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--accent-green)' }}>Plan Successfully Activated!</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                Welcome to the <b>{userPlan.name} Strategy</b>. Your daily earnings will start accruing automatically.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Welcome Section */}
      <section style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary)', marginBottom: '10px', fontSize: '0.9rem', fontWeight: 600 }}>
              <Shield size={18} /> SECURE INVESTMENT PORTFOLIO
            </div>
            <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', fontWeight: 800 }}>Welcome back, <span className="gradient-text">{user.username}</span></h1>
            <p style={{ color: 'var(--text-dim)', marginTop: '5px', fontSize: '1.1rem' }}>
              Your wealth is being managed with precision. {userPlan ? `Your ${userPlan.name} strategy is active.` : 'Start your journey today.'}
            </p>
          </div>

          {userPlan && (
            <div style={{
              padding: '15px 25px',
              background: 'rgba(79, 172, 254, 0.1)',
              borderRadius: '20px',
              border: '1px solid rgba(79, 172, 254, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '15px'
            }}>
              <div style={{ width: '45px', height: '45px', borderRadius: '12px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme === 'dark' ? 'black' : 'white' }}>
                <TrendingUp size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>Current Strategy</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>{userPlan.name}</div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Main Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
        gap: '20px',
        marginBottom: '40px'
      }}>
        {/* Balance Card - Premium */}
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div className="stat-card-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-green)', marginBottom: 0 }}>
              <Wallet size={24} />
            </div>
            <div className="badge badge-success">Live Balance</div>
          </div>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Available Funds</p>
          <h2 style={{ fontSize: '2.8rem', fontWeight: 800, margin: '5px 0' }}>PKR {(Number(user.balance) || 0).toLocaleString()}</h2>
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button onClick={() => window.location.href = '/withdraw'} className="gradient-btn" style={{ flex: 1, padding: '14px', width: '100%' }}>Withdraw Assets</button>
          </div>
        </div>

        {/* Investment Performance */}
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div className="stat-card-icon" style={{ background: 'rgba(79, 172, 254, 0.1)', color: 'var(--primary)', marginBottom: 0 }}>
              <TrendingUp size={24} />
            </div>
            <div className="badge badge-info">Performance</div>
          </div>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Active Investment</p>
          <h3 style={{ fontSize: '2rem', fontWeight: 800 }}>PKR {(Number(user.investedAmount) || 0).toLocaleString()}</h3>
          <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '5px' }}>
              <span style={{ color: 'var(--text-dim)' }}>Yield Rate</span>
              <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>+{stats.rewardPercent}% Daily</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(parseFloat(stats.rewardPercent) * 10, 100)}%` }}
                style={{ height: '100%', background: 'var(--primary)' }}
              />
            </div>
          </div>
        </div>

        {/* Total Earnings */}
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div className="stat-card-icon" style={{ background: 'rgba(240, 147, 251, 0.1)', color: 'var(--secondary)', marginBottom: 0 }}>
              <Award size={24} />
            </div>
            <div className="badge badge-warning">Growth</div>
          </div>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Total Profit Generated</p>
          <h3 style={{ fontSize: '2rem', fontWeight: 800 }}>PKR {(stats.totalEarned || 0).toLocaleString()}</h3>
          <div style={{ marginTop: '20px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ padding: '8px 15px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-dim)' }}>Daily:</span> <b style={{ color: 'var(--primary)' }}>PKR {userPlan ? userPlan.dailyReward : 0}</b>
            </div>
            <div style={{ padding: '8px 15px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-dim)' }}>Ref:</span> <b style={{ color: 'var(--secondary)' }}>PKR {(Number(user.referralEarnings) || 0).toLocaleString()}</b>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '25px' }}>
        {/* Activity Feed */}
        <div className="glass" style={{ padding: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '30px' }}>
            <div style={{ padding: '10px', background: 'rgba(79, 172, 254, 0.1)', borderRadius: '12px', color: 'var(--primary)' }}>
              <History size={20} />
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Activity Ledger</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {!userRewards || userRewards.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>No transaction history found.</p>
                <button onClick={() => window.location.href = '/plans'} style={{ marginTop: '15px', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Activate a plan to start earning</button>
              </div>
            ) : (
              [...userRewards].sort((a, b) => b.timestamp - a.timestamp).slice(0, 6).map((reward, i) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '16px',
                    border: '1px solid var(--glass-border)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-green)', boxShadow: '0 0 10px var(--accent-green)' }} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Daily Reward Accrued</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '2px' }}>{new Date(reward.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                    </div>
                  </div>
                  <div style={{ color: 'var(--accent-green)', fontWeight: 800, fontSize: '1.05rem' }}>+ PKR {reward.amount}</div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Affiliate & Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
          {/* Affiliate Card */}
          <div className="glass" style={{ padding: '30px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
              <div style={{ padding: '12px', background: 'rgba(240, 147, 251, 0.1)', borderRadius: '15px', color: 'var(--secondary)' }}>
                <Users size={22} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Affiliate Program</h3>
            </div>

            <p style={{ color: 'var(--text-dim)', fontSize: '0.95rem', marginBottom: '20px', lineHeight: '1.6' }}>
              Expand your network and earn <b style={{ color: 'var(--text-main)' }}>{settings?.referralRewardPercent || 10}%</b> for every successful referral investment.
            </p>

            <div style={{ display: 'flex', flexDirection: window.innerWidth < 480 ? 'column' : 'row', gap: '10px', background: 'rgba(0,0,0,0.1)', padding: '6px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
              <div style={{ flex: 1, padding: '12px 15px', fontFamily: 'monospace', fontSize: '1.1rem', letterSpacing: '3px', color: 'var(--primary)', fontWeight: 700 }}>
                {user.referralCode || 'REF-XXXXX'}
              </div>
              <button
                onClick={copyReferral}
                style={{
                  padding: '10px 20px',
                  background: copied ? 'var(--accent-green)' : 'var(--primary)',
                  border: 'none',
                  borderRadius: '12px',
                  color: isDark ? 'black' : 'white',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.3s ease'
                }}
              >
                {copied ? <CheckCircle size={18} /> : <Copy size={18} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            <div style={{ marginTop: '30px', display: 'flex', gap: '15px' }}>
              <div style={{ flex: 1, padding: '15px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '5px' }}>Earnings</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--secondary)' }}>PKR {(Number(user.referralEarnings) || 0).toLocaleString()}</div>
              </div>
              <div style={{ flex: 1, padding: '15px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '5px' }}>Network</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>{user.referralCount || 0} Members</div>
              </div>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="glass" style={{ padding: '30px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '20px' }}>Quick Portfolio Actions</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <button onClick={() => window.location.href = '/plans'} className="glass" style={{ padding: '15px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', cursor: 'pointer', color: 'var(--text-main)', background: 'var(--surface)' }}>
                <TrendingUp size={24} style={{ color: 'var(--primary)' }} />
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Upgrade Plan</span>
              </button>
              <button onClick={() => window.location.href = '/withdraw'} className="glass" style={{ padding: '15px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', cursor: 'pointer', color: 'var(--text-main)', background: 'var(--surface)' }}>
                <Wallet size={24} style={{ color: 'var(--secondary)' }} />
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Liquidate Assets</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
