import { useState, useMemo, useEffect } from 'react';
import { 
  getDB, 
  saveDB, 
  updateSettings, 
  addPlan, 
  updatePlan, 
  deletePlan, 
  handleInvestmentRequest 
} from '../lib/storage';
import { 
  Users, 
  Settings, 
  Download, 
  Palette, 
  Check, 
  X, 
  TrendingUp, 
  Wallet, 
  History,
  Plus,
  Trash2,
  DollarSign,
  Briefcase,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminDashboard = () => {
  const [db, setDb] = useState(getDB() || { users: [], plans: [], withdrawalRequests: [], investmentRequests: [], settings: {} });
  const [activeTab, setActiveTab] = useState('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewScreenshot, setViewScreenshot] = useState(null);

  // Refresh DB whenever tab changes
  useEffect(() => {
    setDb(getDB());
    
    // Auto-refresh data if changes are made in another tab
    const handleStorageChange = (e) => {
      if (!e.key || e.key === 'investment_app_db') {
        setDb(getDB());
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [activeTab]);

  // New Plan State
  const [showAddPlan, setShowAddPlan] = useState(false);
  const [newPlan, setNewPlan] = useState({ name: '', price: '', dailyReward: '' });

  // Stats Calculations
  const stats = useMemo(() => {
    const users = Array.isArray(db.users) ? db.users : [];
    const withdrawals = Array.isArray(db.withdrawalRequests) ? db.withdrawalRequests : [];
    const investments = Array.isArray(db.investmentRequests) ? db.investmentRequests : [];
    
    const totalUsers = users.filter(u => u.role !== 'admin').length;
    const totalInvested = users.reduce((acc, u) => acc + (u.investedAmount || 0), 0);
    const totalBalance = users.reduce((acc, u) => acc + (u.balance || 0), 0);
    const pendingWithdrawals = withdrawals.filter(r => r.status === 'pending').length;
    const pendingInvestments = investments.filter(r => r.status === 'pending').length;
    
    return { totalUsers, totalInvested, totalBalance, pendingWithdrawals, pendingInvestments };
  }, [db]);

  const filteredUsers = useMemo(() => {
    const users = Array.isArray(db.users) ? db.users : [];
    return users.filter(u => 
      (u.username || '').toLowerCase().includes(searchTerm.toLowerCase()) && u.role !== 'admin'
    );
  }, [db.users, searchTerm]);

  const handleAddPlan = () => {
    if (!newPlan.name || !newPlan.price || !newPlan.dailyReward) return;
    const plans = addPlan({ 
      name: newPlan.name, 
      price: parseInt(newPlan.price), 
      dailyReward: parseInt(newPlan.dailyReward) 
    });
    setDb({ ...getDB() });
    setShowAddPlan(false);
    setNewPlan({ name: '', price: '', dailyReward: '' });
  };

  const handleDeletePlan = (id) => {
    if (window.confirm('Are you sure you want to delete this plan?')) {
      deletePlan(id);
      setDb({ ...getDB() });
    }
  };

  const handleUpdatePlanField = (id, field, value) => {
    updatePlan(id, { [field]: field === 'name' ? value : parseInt(value) });
    setDb({ ...getDB() });
  };

  const processInvestment = (id, status) => {
    handleInvestmentRequest(id, status);
    setDb({ ...getDB() });
    alert(`Investment ${status} successfully.`);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      return new Date(timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return 'Invalid Date';
    }
  };

  return (
    <div style={{ padding: '30px', maxWidth: '1400px', margin: '0 auto' }} className="fade-in">
      {/* Header */}
      <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary)', marginBottom: '10px', fontSize: '0.9rem', fontWeight: 600 }}>
            <Settings size={16} /> ADMINISTRATOR VIEW
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>System <span className="gradient-text">Overview</span></h1>
          <p style={{ color: 'var(--text-dim)', marginTop: '5px' }}>Monitor platform performance and manage user assets.</p>
        </div>
      </header>

      {/* Stats Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
        gap: '20px', 
        marginBottom: '40px' 
      }}>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(79, 172, 254, 0.1)', color: 'var(--primary)' }}>
            <Users size={24} />
          </div>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Total Members</p>
          <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>{stats.totalUsers}</h2>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-green)' }}>
            <TrendingUp size={24} />
          </div>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Total Locked Value</p>
          <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>PKR {stats.totalInvested.toLocaleString()}</h2>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(240, 147, 251, 0.1)', color: 'var(--secondary)' }}>
            <Wallet size={24} />
          </div>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Circulating Balance</p>
          <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>PKR {stats.totalBalance.toLocaleString()}</h2>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent-yellow)' }}>
            <DollarSign size={24} />
          </div>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Pending Payments</p>
          <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>{stats.pendingInvestments}</h2>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        marginBottom: '30px', 
        padding: '6px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '16px',
        width: 'fit-content',
        overflowX: 'auto',
        maxWidth: '100%'
      }}>
        {[
          { id: 'users', label: 'Users', icon: Users },
          { id: 'investments', label: 'Payments', icon: DollarSign },
          { id: 'withdrawals', label: 'Withdraws', icon: Download },
          { id: 'plans', label: 'Plans', icon: Briefcase },
          { id: 'settings', label: 'Config', icon: Palette }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 20px',
              borderRadius: '12px',
              border: 'none',
              background: activeTab === tab.id ? 'var(--primary)' : 'transparent',
              color: activeTab === tab.id ? 'black' : 'var(--text-dim)',
              whiteSpace: 'nowrap',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.3s ease'
            }}
          >
            <tab.icon size={18} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="glass" style={{ padding: '30px', minHeight: '400px' }}>
        <AnimatePresence mode="wait">
          {activeTab === 'users' && (
            <motion.div key="users" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>User Management</h3>
                <input 
                  type="text" 
                  placeholder="Search username..." 
                  className="glass"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ padding: '12px 15px', width: '300px', fontSize: '0.9rem', color: 'white' }}
                />
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Plan</th>
                      <th>Balance</th>
                      <th>Invested</th>
                      <th>Join Date</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(u => (
                      <tr key={u.id}>
                        <td>{u.username}</td>
                        <td>{u.plan ? <span className="badge badge-info">{u.plan.name}</span> : 'None'}</td>
                        <td>PKR {u.balance.toLocaleString()}</td>
                        <td>PKR {u.investedAmount.toLocaleString()}</td>
                        <td>{formatDate(u.createdAt)}</td>
                        <td style={{ textAlign: 'right' }}>
                           <button className="glass" style={{ padding: '8px', color: 'var(--text-dim)' }}><Eye size={16} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'investments' && (
             <motion.div key="investments" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '30px' }}>Investment Verifications</h3>
                {(!db.investmentRequests || db.investmentRequests.length === 0) ? (
                  <p style={{ color: 'var(--text-dim)', textAlign: 'center', padding: '50px' }}>No payment requests found.</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>User / Plan</th>
                          <th>Method / Account</th>
                          <th>TXR ID / Amount</th>
                          <th>Status</th>
                          <th>Proof</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...db.investmentRequests].reverse().map(r => (
                          <tr key={r.id}>
                            <td>
                              <div style={{ fontWeight: 600 }}>{r.username}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>{r.planName}</div>
                            </td>
                            <td>
                              <div style={{ fontWeight: 500 }}>{r.method}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{r.senderAccountNo} ({r.senderAccountName})</div>
                            </td>
                            <td>
                              <div style={{ fontWeight: 600 }}>{r.transactionId}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--accent-green)' }}>PKR {r.amountSent.toLocaleString()}</div>
                            </td>
                            <td>
                              <span className={`badge ${r.status === 'pending' ? 'badge-warning' : r.status === 'approved' ? 'badge-success' : 'badge-error'}`}>
                                {r.status}
                              </span>
                            </td>
                            <td>
                              {r.screenshot && (
                                <button 
                                  onClick={() => setViewScreenshot(r.screenshot)}
                                  style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                                >
                                  <Eye size={16} /> View
                                </button>
                              )}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              {r.status === 'pending' && (
                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                  <button onClick={() => processInvestment(r.id, 'approved')} className="glass" style={{ color: 'var(--accent-green)', padding: '8px' }}><Check size={18} /></button>
                                  <button onClick={() => processInvestment(r.id, 'rejected')} className="glass" style={{ color: 'var(--accent-red)', padding: '8px' }}><X size={18} /></button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
             </motion.div>
          )}

          {activeTab === 'plans' && (
            <motion.div key="plans" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Investment Strategies</h3>
                  <button onClick={() => setShowAddPlan(true)} className="gradient-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Plus size={18} /> New Plan
                  </button>
               </div>

               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
                  {db.plans.map(plan => (
                    <div key={plan.id} className="glass" style={{ padding: '25px', borderRadius: '24px', border: '1px solid var(--glass-border)' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                          <input 
                            value={plan.name} 
                            onChange={(e) => handleUpdatePlanField(plan.id, 'name', e.target.value)}
                            style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.2rem', fontWeight: 700, width: '70%' }}
                          />
                          <button onClick={() => handleDeletePlan(plan.id)} style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer' }}>
                             <Trash2 size={20} />
                          </button>
                       </div>
                       
                       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                          <div>
                             <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Price (PKR)</label>
                             <input 
                               type="number" 
                               className="glass"
                               value={plan.price}
                               onChange={(e) => handleUpdatePlanField(plan.id, 'price', e.target.value)}
                               style={{ width: '100%', padding: '10px', marginTop: '5px', color: 'white', fontWeight: 600 }}
                             />
                          </div>
                          <div>
                             <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Daily Reward (PKR)</label>
                             <input 
                               type="number" 
                               className="glass"
                               value={plan.dailyReward}
                               onChange={(e) => handleUpdatePlanField(plan.id, 'dailyReward', e.target.value)}
                               style={{ width: '100%', padding: '10px', marginTop: '5px', color: 'white', fontWeight: 600 }}
                             />
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
               <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '30px' }}>Global Settings</h3>
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px' }}>
                  {/* Payment Details */}
                  <div className="glass" style={{ padding: '30px', borderRadius: '24px' }}>
                    <h4 style={{ marginBottom: '20px', fontWeight: 700 }}>Admin Wallet (For User Payments)</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                       <div>
                          <label style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>Easypaisa Number</label>
                          <input 
                            className="glass"
                            value={db.settings.adminWallets.easypaisa.number}
                            onChange={(e) => {
                               const s = { ...db.settings };
                               s.adminWallets.easypaisa.number = e.target.value;
                               updateSettings(s);
                               setDb({ ...getDB() });
                            }}
                            style={{ width: '100%', padding: '12px', marginTop: '5px', color: 'white' }}
                          />
                          <input 
                            className="glass"
                            placeholder="Account Name"
                            value={db.settings.adminWallets.easypaisa.name}
                            onChange={(e) => {
                               const s = { ...db.settings };
                               s.adminWallets.easypaisa.name = e.target.value;
                               updateSettings(s);
                               setDb({ ...getDB() });
                            }}
                            style={{ width: '100%', padding: '8px', marginTop: '5px', color: 'var(--text-dim)', fontSize: '0.8rem' }}
                          />
                       </div>
                       <div>
                          <label style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>JazzCash Number</label>
                          <input 
                            className="glass"
                            value={db.settings.adminWallets.jazzcash.number}
                            onChange={(e) => {
                               const s = { ...db.settings };
                               s.adminWallets.jazzcash.number = e.target.value;
                               updateSettings(s);
                               setDb({ ...getDB() });
                            }}
                            style={{ width: '100%', padding: '12px', marginTop: '5px', color: 'white' }}
                          />
                          <input 
                            className="glass"
                            placeholder="Account Name"
                            value={db.settings.adminWallets.jazzcash.name}
                            onChange={(e) => {
                               const s = { ...db.settings };
                               s.adminWallets.jazzcash.name = e.target.value;
                               updateSettings(s);
                               setDb({ ...getDB() });
                            }}
                            style={{ width: '100%', padding: '8px', marginTop: '5px', color: 'var(--text-dim)', fontSize: '0.8rem' }}
                          />
                       </div>
                    </div>
                  </div>

                  {/* Other Config */}
                  <div className="glass" style={{ padding: '30px', borderRadius: '24px' }}>
                    <h4 style={{ marginBottom: '20px', fontWeight: 700 }}>Platform Customization</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                       <div>
                          <label style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>Referral Bonus (%)</label>
                          <input 
                            type="number"
                            className="glass"
                            value={db.settings.referralRewardPercent}
                            onChange={(e) => {
                               updateSettings({ referralRewardPercent: parseInt(e.target.value) || 0 });
                               setDb({ ...getDB() });
                            }}
                            style={{ width: '100%', padding: '12px', marginTop: '5px', color: 'white' }}
                          />
                       </div>
                       <div>
                          <label style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>Primary Theme</label>
                          <input 
                            type="color"
                            value={db.settings.themeColor}
                            onChange={(e) => {
                               updateSettings({ themeColor: e.target.value });
                               setDb({ ...getDB() });
                            }}
                            style={{ width: '100%', height: '50px', background: 'none', border: 'none', cursor: 'pointer', marginTop: '5px' }}
                          />
                       </div>
                    </div>
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Add Plan Modal */}
      {showAddPlan && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
           <div className="glass" style={{ width: '400px', padding: '40px' }}>
              <h2 style={{ marginBottom: '25px' }}>Create New Plan</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                 <input className="glass" placeholder="Plan Name (e.g. Starter)" value={newPlan.name} onChange={e => setNewPlan({...newPlan, name: e.target.value})} style={{ width: '100%', padding: '12px', color: 'white' }} />
                 <input className="glass" type="number" placeholder="Price (PKR)" value={newPlan.price} onChange={e => setNewPlan({...newPlan, price: e.target.value})} style={{ width: '100%', padding: '12px', color: 'white' }} />
                 <input className="glass" type="number" placeholder="Daily Reward (PKR)" value={newPlan.dailyReward} onChange={e => setNewPlan({...newPlan, dailyReward: e.target.value})} style={{ width: '100%', padding: '12px', color: 'white' }} />
                 <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                    <button onClick={handleAddPlan} className="gradient-btn" style={{ flex: 1 }}>Create</button>
                    <button onClick={() => setShowAddPlan(false)} className="glass" style={{ flex: 1, color: 'white' }}>Cancel</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Screenshot Modal */}
      {viewScreenshot && (
        <div onClick={() => setViewScreenshot(null)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
           <img src={viewScreenshot} style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '10px' }} alt="Payment Proof" />
           <p style={{ position: 'absolute', bottom: '20px', color: 'white' }}>Click anywhere to close</p>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
