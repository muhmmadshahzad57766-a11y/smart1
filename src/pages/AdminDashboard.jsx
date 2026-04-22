import { useState, useMemo, useEffect } from 'react';
import {
  fetchAllUsers,
  fetchPlans,
  fetchWithdrawals,
  fetchInvestmentRequests,
  getSettings,
  addPlan,
  updatePlan,
  deletePlan,
  handleInvestmentRequest,
  updateSettings,
  handleWithdrawal,
  updateUserData,
  deleteUser,
  fetchAllSupportConversations,
  fetchSupportMessages,
  sendSupportMessage,
  markSupportMessagesAsRead
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
  Eye,
  ChevronLeft,
  ChevronRight,
  Edit,
  MessageSquare,
  Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ITEMS_PER_PAGE = 10;

const AdminDashboard = ({ theme }) => {
  const isDark = theme === 'dark';
  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [investmentRequests, setInvestmentRequests] = useState([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);
  const [settings, setSettings] = useState({ adminWallets: { easypaisa: {}, jazzcash: {} } });
  const [loading, setLoading] = useState(true);
  const [dirtyPlans, setDirtyPlans] = useState({}); // { planId: { updates } }

  const [activeTab, setActiveTab] = useState('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewScreenshot, setViewScreenshot] = useState(null);

  // Support states
  const [supportConversations, setSupportConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null); // { userId, username }
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');

  // Pagination states
  const [userPage, setUserPage] = useState(1);
  const [investPage, setInvestPage] = useState(1);
  const [withdrawPage, setWithdrawPage] = useState(1);

  // Sub-tabs for investments
  const [investSubTab, setInvestSubTab] = useState('pending'); // 'pending' | 'approved'

  // Sub-tabs for withdrawals
  const [withdrawSubTab, setWithdrawSubTab] = useState('pending'); // 'pending' | 'approved'

  const refreshData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') setUsers(await fetchAllUsers());
      else if (activeTab === 'plans') setPlans(await fetchPlans());
      else if (activeTab === 'investments') setInvestmentRequests(await fetchInvestmentRequests());
      else if (activeTab === 'withdrawals') setWithdrawalRequests(await fetchWithdrawals());
      else if (activeTab === 'settings') {
        const s = await getSettings();
        if (s) setSettings(s);
      }

      const [u, w, i] = await Promise.all([
        fetchAllUsers(),
        fetchWithdrawals(),
        fetchInvestmentRequests()
      ]);
      setUsers(u);
      setWithdrawalRequests(w);
      setInvestmentRequests(i);
      setSupportConversations(await fetchAllSupportConversations());
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(() => {
      if (activeTab === 'support') refreshSupportData();
      else refreshUnreadCount();
    }, 5000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const refreshSupportData = async () => {
    setSupportConversations(await fetchAllSupportConversations());
    if (selectedChat) {
      const msgs = await fetchSupportMessages(selectedChat.userId);
      setChatMessages(msgs);
    }
  };

  const refreshUnreadCount = async () => {
    setSupportConversations(await fetchAllSupportConversations());
  };

  useEffect(() => {
    if (selectedChat) {
      refreshSupportData();
      markSupportMessagesAsRead(selectedChat.userId, 'admin');
    }
  }, [selectedChat]);

  // Edit User State
  const [editUserModal, setEditUserModal] = useState(null);

  // New Plan State
  const [showAddPlan, setShowAddPlan] = useState(false);
  const [newPlan, setNewPlan] = useState({ name: '', price: '', percentage: '', dailyReward: '' });

  // Stats Calculations
  const stats = useMemo(() => {
    const totalUsers = users.filter(u => u.role !== 'admin').length;
    const totalInvested = users.reduce((acc, u) => acc + (Number(u.investedAmount) || 0), 0);
    const totalBalance = users.reduce((acc, u) => acc + (Number(u.balance) || 0), 0);
    const pendingWithdrawals = withdrawalRequests.filter(r => r.status === 'pending').length;
    const pendingInvestments = investmentRequests.filter(r => r.status === 'pending').length;

    return { totalUsers, totalInvested, totalBalance, pendingWithdrawals, pendingInvestments };
  }, [users, withdrawalRequests, investmentRequests]);

  const filteredUsers = useMemo(() => {
    return users.filter(u =>
      (u.username || '').toLowerCase().includes(searchTerm.toLowerCase()) && u.role !== 'admin'
    );
  }, [users, searchTerm]);

  // Pagination Selectors
  const paginatedUsers = useMemo(() => {
    const startIndex = (userPage - 1) * ITEMS_PER_PAGE;
    return filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredUsers, userPage]);

  const filteredInvestments = useMemo(() => {
    return investSubTab === 'pending' ? investmentRequests.filter(i => i.status === 'pending') : investmentRequests.filter(i => i.status === 'approved' || i.status === 'rejected');
  }, [investmentRequests, investSubTab]);

  const paginatedInvestments = useMemo(() => {
    const startIndex = (investPage - 1) * ITEMS_PER_PAGE;
    return [...filteredInvestments].reverse().slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredInvestments, investPage]);

  const filteredWithdrawals = useMemo(() => {
    return withdrawSubTab === 'pending' ? withdrawalRequests.filter(w => w.status === 'pending') : withdrawalRequests.filter(w => w.status === 'approved' || w.status === 'rejected');
  }, [withdrawalRequests, withdrawSubTab]);

  const paginatedWithdrawals = useMemo(() => {
    const startIndex = (withdrawPage - 1) * ITEMS_PER_PAGE;
    return filteredWithdrawals.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredWithdrawals, withdrawPage]);


  const handleAddPlan = async () => {
    if (!newPlan.name || !newPlan.price || !newPlan.dailyReward) return;
    if (!window.confirm(`Are you sure you want to create the plan "${newPlan.name}"?`)) return;

    await addPlan({
      name: newPlan.name,
      price: parseInt(newPlan.price),
      dailyReward: parseInt(newPlan.dailyReward)
    });
    setShowAddPlan(false);
    setNewPlan({ name: '', price: '', percentage: '', dailyReward: '' });
    refreshData();
  };

  const handleDeletePlan = async (id) => {
    if (window.confirm('Are you sure you want to delete this plan?')) {
      await deletePlan(id);
      refreshData();
    }
  };

  const handleUpdatePlanField = (id, field, value) => {
    const plan = plans.find(p => p.id === id);
    if (!plan) return;

    const currentUpdates = dirtyPlans[id] || {};
    let newUpdates = { ...currentUpdates, [field]: field === 'name' ? value : parseFloat(value) || 0 };

    // Auto-calculate dailyReward if price or percentage changes in the local edit
    if (field === 'price' || field === 'percentage') {
      const price = field === 'price' ? parseFloat(value) : (newUpdates.price || plan.price);
      const percentage = field === 'percentage' ? parseFloat(value) : (newUpdates.percentage || (plan.percentage || ((plan.dailyReward / plan.price) * 100)));
      newUpdates.dailyReward = Math.round((price * percentage) / 100);
      newUpdates.percentage = percentage;
    }

    setDirtyPlans({ ...dirtyPlans, [id]: newUpdates });
  };

  const handleSavePlan = async (id) => {
    const updates = dirtyPlans[id];
    if (!updates) return;

    if (window.confirm("Are you sure you want to save the changes to this plan?")) {
      await updatePlan(id, updates);
      const newDirty = { ...dirtyPlans };
      delete newDirty[id];
      setDirtyPlans(newDirty);
      refreshData();
      alert("Plan updated successfully!");
    }
  };

  const handleCancelEdit = (id) => {
    const newDirty = { ...dirtyPlans };
    delete newDirty[id];
    setDirtyPlans(newDirty);
  };

  const handleUpdateUser = async () => {
    if (!editUserModal) return;
    try {
      await updateUserData(editUserModal.id, {
        balance: editUserModal.balance,
        investedAmount: editUserModal.investedAmount,
        ...(editUserModal.password ? { password: editUserModal.password } : {})
      });
      alert('User updated successfully');
      setEditUserModal(null);
      refreshData();
    } catch (e) {
      alert('Error updating user');
    }
  };

  const handleDeleteUser = async (u) => {
    if (window.confirm(`Are you extremely sure you want to delete the user ${u.username}? This action is permanent and cannot be undone.`)) {
      try {
        await deleteUser(u.id);
        alert('User removed successfully');
        refreshData();
      } catch (e) {
        alert('Error removing user');
      }
    }
  };

  const processInvestment = async (id, status) => {
    await handleInvestmentRequest(id, status);
    alert(`Investment ${status} successfully.`);
    refreshData();
  };

  const processWithdrawal = async (id, status) => {
    await handleWithdrawal(id, status);
    alert(`Withdrawal ${status} successfully.`);
    refreshData();
  };

  const saveSettings = async () => {
    await updateSettings(settings);
    alert("Settings saved!");
    refreshData();
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedChat) return;
    const res = await sendSupportMessage(selectedChat.userId, 'admin', chatInput);
    if (res) {
      setChatMessages([...chatMessages, res]);
      setChatInput('');
      refreshSupportData();
    }
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

  const Pagination = ({ currentPage, totalItems, onPageChange }) => {
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    if (totalPages <= 1) return null;
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '20px' }}>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="glass"
          style={{ padding: '8px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
        >
          <ChevronLeft size={18} />
        </button>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>Page {currentPage} of {totalPages}</span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="glass"
          style={{ padding: '8px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
        >
          <ChevronRight size={18} />
        </button>
      </div>
    );
  };

  return (
    <div style={{ padding: 'clamp(15px, 4vw, 30px)', maxWidth: '1400px', margin: '0 auto' }} className="fade-in">
      {/* Header */}
      <header style={{ marginBottom: 'clamp(25px, 8vw, 40px)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary)', marginBottom: '10px', fontSize: '0.8rem', fontWeight: 600 }}>
            <Settings size={14} /> ADMINISTRATOR VIEW
          </div>
          <h1 style={{ fontSize: 'clamp(1.8rem, 6vw, 2.5rem)', fontWeight: 800, lineHeight: 1.2 }}>System <span className="gradient-text">Overview</span></h1>
          <p style={{ color: 'var(--text-dim)', marginTop: '5px', fontSize: '0.9rem' }}>Monitor platform performance and manage user assets.</p>
        </div>
      </header>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
        gap: '20px',
        marginBottom: 'clamp(25px, 8vw, 40px)'
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
        gap: '8px',
        marginBottom: '30px',
        padding: '6px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '16px',
        width: '100%',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        position: 'sticky',
        top: 'calc(var(--header-height) + 30px)',
        zIndex: 900
      }}>
        {[
          { id: 'users', label: 'Users', icon: Users },
          { id: 'investments', label: 'Payments', icon: DollarSign },
          { id: 'withdrawals', label: 'Withdraws', icon: Download },
          { id: 'plans', label: 'Plans', icon: Briefcase },
          { id: 'support', label: 'Support', icon: MessageSquare, badge: supportConversations.reduce((acc, c) => acc + c.unreadCount, 0) },
          { id: 'settings', label: 'Config', icon: Palette }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setUserPage(1); setInvestPage(1); setWithdrawPage(1); }}
            style={{
              padding: '10px 18px',
              borderRadius: '12px',
              border: 'none',
              background: activeTab === tab.id ? 'var(--primary)' : 'transparent',
              color: activeTab === tab.id ? 'black' : 'var(--text-dim)',
              whiteSpace: 'nowrap',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.3s ease',
              fontSize: '0.9rem'
            }}
          >
            <tab.icon size={16} /> {tab.label}
            {tab.badge > 0 && (
              <span style={{ padding: '2px 6px', background: 'var(--accent-red)', color: 'white', borderRadius: '10px', fontSize: '0.7rem' }}>{tab.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="glass" style={{ padding: 'clamp(15px, 4vw, 30px)', minHeight: '400px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--primary)', padding: '50px' }}>Loading Data...</div>
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === 'users' && (
              <motion.div key="users" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>User Management</h3>
                  <input
                    type="text"
                    placeholder="Search username..."
                    className="glass"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ padding: '12px 15px', width: 'clamp(200px, 100%, 300px)', fontSize: '0.9rem', color: 'var(--text-main)' }}
                  />
                </div>
                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Plan ID</th>
                        <th>Balance</th>
                        <th>Invested</th>
                        <th>Daily ROI</th>
                        <th>Join Date</th>
                        <th style={{ textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedUsers.map(u => (
                        <tr key={u.id}>
                          <td>{u.username}</td>
                          <td>{u.planId ? <span className="badge badge-info">{u.planId}</span> : 'None'}</td>
                          <td>PKR {(Number(u.balance) || 0).toLocaleString()}</td>
                          <td>PKR {(Number(u.investedAmount) || 0).toLocaleString()}</td>
                          <td style={{ color: 'var(--accent-green)', fontWeight: 600 }}>PKR {(Number(u.dailyReward) || 0).toLocaleString()}</td>
                          <td>{formatDate(u.createdAt)}</td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                              <button
                                onClick={() => setEditUserModal({
                                  id: u.id,
                                  username: u.username,
                                  balance: Number(u.balance) || 0,
                                  investedAmount: Number(u.investedAmount) || 0,
                                  password: ''
                                })}
                                className="glass"
                                style={{ padding: '8px', color: 'var(--text-dim)' }}
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u)}
                                className="glass"
                                style={{ padding: '8px', color: 'var(--accent-red)' }}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination currentPage={userPage} totalItems={filteredUsers.length} onPageChange={setUserPage} />
              </motion.div>
            )}

            {activeTab === 'investments' && (
              <motion.div key="investments" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Investment Verifications</h3>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => { setInvestSubTab('pending'); setInvestPage(1); }} className={`badge ${investSubTab === 'pending' ? 'badge-warning' : 'glass'}`} style={{ border: 'none', cursor: 'pointer', padding: '8px 15px' }}>Pending</button>
                    <button onClick={() => { setInvestSubTab('approved'); setInvestPage(1); }} className={`badge ${investSubTab === 'approved' ? 'badge-success' : 'glass'}`} style={{ border: 'none', cursor: 'pointer', padding: '8px 15px' }}>History</button>
                  </div>
                </div>

                {(!paginatedInvestments || paginatedInvestments.length === 0) ? (
                  <p style={{ color: 'var(--text-dim)', textAlign: 'center', padding: '50px' }}>No payment requests found.</p>
                ) : (
                  <div className="table-container">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>User / Plan</th>
                          <th>Method / Account</th>
                          <th>TXR ID / Amount</th>
                          <th>Status</th>
                          <th>Proof</th>
                          {investSubTab === 'pending' && <th style={{ textAlign: 'right' }}>Actions</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedInvestments.map(r => (
                          <tr key={r.id}>
                            <td>
                              <div style={{ fontWeight: 600 }}>{r.username}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>{r.planName}</div>
                            </td>
                            <td>
                              <div style={{ fontWeight: 500 }}>{r.method}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{r.senderAccountNo}</div>
                            </td>
                            <td>
                              <div style={{ fontWeight: 600 }}>{r.transactionId}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--accent-green)' }}>PKR {(Number(r.amountSent) || 0).toLocaleString()}</div>
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
                            {investSubTab === 'pending' && (
                              <td style={{ textAlign: 'right' }}>
                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                  <button onClick={() => processInvestment(r.id, 'approved')} className="glass" style={{ color: 'var(--accent-green)', padding: '8px' }}><Check size={18} /></button>
                                  <button onClick={() => processInvestment(r.id, 'rejected')} className="glass" style={{ color: 'var(--accent-red)', padding: '8px' }}><X size={18} /></button>
                                </div>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <Pagination currentPage={investPage} totalItems={filteredInvestments.length} onPageChange={setInvestPage} />
              </motion.div>
            )}

            {activeTab === 'withdrawals' && (
              <motion.div key="withdrawals" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Withdrawal Processing</h3>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => { setWithdrawSubTab('pending'); setWithdrawPage(1); }} className={`badge ${withdrawSubTab === 'pending' ? 'badge-warning' : 'glass'}`} style={{ border: 'none', cursor: 'pointer', padding: '8px 15px' }}>Pending</button>
                    <button onClick={() => { setWithdrawSubTab('approved'); setWithdrawPage(1); }} className={`badge ${withdrawSubTab === 'approved' ? 'badge-success' : 'glass'}`} style={{ border: 'none', cursor: 'pointer', padding: '8px 15px' }}>History</button>
                  </div>
                </div>

                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Amount</th>
                        <th>Method</th>
                        <th>Account Details</th>
                        <th>Date</th>
                        <th>Status</th>
                        {withdrawSubTab === 'pending' && <th style={{ textAlign: 'right' }}>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedWithdrawals.map(w => (
                        <tr key={w.id}>
                          <td>{w.username}</td>
                          <td style={{ fontWeight: 700, color: 'var(--primary)' }}>PKR {w.amount}</td>
                          <td>{w.method}</td>
                          <td style={{ fontSize: '0.85rem' }}>{w.accountDetails}</td>
                          <td>{formatDate(w.timestamp)}</td>
                          <td><span className={`badge badge-${w.status === 'pending' ? 'warning' : w.status === 'approved' ? 'success' : 'error'}`}>{w.status.toUpperCase()}</span></td>
                          {withdrawSubTab === 'pending' && (
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <button onClick={() => processWithdrawal(w.id, 'approved')} className="glass" style={{ color: 'var(--accent-green)', padding: '6px' }}><Check size={16} /></button>
                                <button onClick={() => processWithdrawal(w.id, 'rejected')} className="glass" style={{ color: 'var(--accent-red)', padding: '6px' }}><X size={16} /></button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination currentPage={withdrawPage} totalItems={filteredWithdrawals.length} onPageChange={setWithdrawPage} />
              </motion.div>
            )}

            {activeTab === 'plans' && (
              <motion.div key="plans" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Investment Strategies</h3>
                  <button onClick={() => setShowAddPlan(true)} className="gradient-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px', width: 'clamp(140px, 100%, 180px)', justifyContent: 'center' }}>
                    <Plus size={18} /> New Plan
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '20px' }}>
                  {plans.map(plan => {
                    const updates = dirtyPlans[plan.id] || {};
                    const isDirty = Object.keys(updates).length > 0;

                    return (
                      <div key={plan.id} className="glass" style={{ padding: '25px', borderRadius: '24px', border: isDirty ? '1px solid var(--primary)' : '1px solid var(--glass-border)', transition: 'all 0.3s ease' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                          <input
                            value={updates.name !== undefined ? updates.name : plan.name}
                            onChange={(e) => handleUpdatePlanField(plan.id, 'name', e.target.value)}
                            style={{ background: 'none', border: 'none', color: 'var(--text-main)', fontSize: '1.2rem', fontWeight: 700, width: '70%' }}
                          />
                          <button onClick={() => handleDeletePlan(plan.id)} style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer' }}>
                            <Trash2 size={20} />
                          </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '20px' }}>
                          <div>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Price (PKR)</label>
                            <input
                              type="number"
                              className="glass"
                              value={updates.price !== undefined ? updates.price : plan.price}
                              onChange={(e) => handleUpdatePlanField(plan.id, 'price', e.target.value)}
                              style={{ width: '100%', padding: '10px', marginTop: '5px', color: 'var(--text-main)', fontWeight: 600 }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Percentage (%)</label>
                            <input
                              type="number"
                              className="glass"
                              value={updates.percentage !== undefined ? updates.percentage : (plan.percentage || Math.round((plan.dailyReward / plan.price) * 100))}
                              onChange={(e) => handleUpdatePlanField(plan.id, 'percentage', e.target.value)}
                              style={{ width: '100%', padding: '10px', marginTop: '5px', color: 'var(--text-main)', fontWeight: 600 }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Daily Reward (PKR)</label>
                            <input
                              type="number"
                              className="glass"
                              value={updates.dailyReward !== undefined ? updates.dailyReward : plan.dailyReward}
                              onChange={(e) => handleUpdatePlanField(plan.id, 'dailyReward', e.target.value)}
                              style={{ width: '100%', padding: '10px', marginTop: '5px', color: 'var(--text-main)', fontWeight: 600 }}
                            />
                          </div>
                        </div>

                        {isDirty && (
                          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button
                              onClick={() => handleSavePlan(plan.id)}
                              className="gradient-btn"
                              style={{ flex: 1, padding: '8px', fontSize: '0.85rem' }}
                            >
                              Save Changes
                            </button>
                            <button
                              onClick={() => handleCancelEdit(plan.id)}
                              className="glass"
                              style={{ flex: 1, padding: '8px', fontSize: '0.85rem', color: 'var(--text-dim)' }}
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {activeTab === 'support' && (
              <motion.div key="support" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ height: '600px', display: 'flex', gap: '20px' }}>
                {/* User List */}
                <div className="glass" style={{ width: '300px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <div style={{ padding: '20px', borderBottom: '1px solid var(--glass-border)', fontWeight: 700 }}>Conversations</div>
                  <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
                    {supportConversations.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-dim)', fontSize: '0.85rem' }}>No conversations yet.</div>
                    ) : (
                      supportConversations.map(conv => (
                        <div
                          key={conv.userId}
                          onClick={() => setSelectedChat({ userId: conv.userId, username: conv.username })}
                          style={{
                            padding: '12px',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            background: selectedChat?.userId === conv.userId ? 'rgba(79, 172, 254, 0.1)' : 'transparent',
                            marginBottom: '8px',
                            transition: 'all 0.2s'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{conv.username}</div>
                            {conv.unreadCount > 0 && <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>{conv.unreadCount}</span>}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conv.lastMessage}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Chat Window */}
                <div className="glass" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  {selectedChat ? (
                    <>
                      <div style={{ padding: '20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontWeight: 700 }}>Chatting with: <span className="gradient-text">{selectedChat.username}</span></div>
                      </div>
                      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(0,0,0,0.2)' }}>
                        {chatMessages.map((msg, i) => (
                          <div key={i} style={{ alignSelf: msg.sender_type === 'admin' ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                            <div style={{
                              padding: '10px 15px',
                              borderRadius: '12px',
                              background: msg.sender_type === 'admin' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                              color: msg.sender_type === 'admin' ? 'black' : 'var(--text-main)',
                              fontSize: '0.9rem',
                              border: msg.sender_type === 'admin' ? 'none' : '1px solid var(--glass-border)'
                            }}>
                              {msg.content}
                            </div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '4px', textAlign: msg.sender_type === 'admin' ? 'right' : 'left' }}>
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        ))}
                      </div>
                      <form onSubmit={handleSendReply} style={{ padding: '15px', display: 'flex', gap: '10px', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid var(--glass-border)' }}>
                        <input
                          className="glass"
                          value={chatInput}
                          onChange={e => setChatInput(e.target.value)}
                          placeholder="Type your reply..."
                          style={{ flex: 1, padding: '10px 15px', color: 'var(--text-main)', borderRadius: '10px' }}
                        />
                        <button type="submit" className="gradient-btn" style={{ padding: '10px 20px', borderRadius: '10px' }}><Send size={18} /></button>
                      </form>
                    </>
                  ) : (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>
                      Select a conversation to start chatting
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '30px' }}>Global Settings</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '30px' }}>
                  {/* Payment Details */}
                  <div className="glass" style={{ padding: 'clamp(20px, 5vw, 30px)', borderRadius: '24px' }}>
                    <h4 style={{ marginBottom: '20px', fontWeight: 700 }}>Admin Wallet (For User Payments)</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {/* Easypaisa Section */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <label style={{ fontSize: '0.9rem', color: 'var(--text-dim)', fontWeight: 600 }}>Easypaisa Accounts</label>
                          <button
                            className="glass"
                            style={{ padding: '4px 10px', fontSize: '0.75rem', color: 'var(--primary)' }}
                            onClick={() => {
                              const s = { ...settings };
                              if (!s.adminWallets) s.adminWallets = { easypaisa: [], jazzcash: [] };
                              if (!Array.isArray(s.adminWallets.easypaisa)) s.adminWallets.easypaisa = [];
                              s.adminWallets.easypaisa.push({ number: '', name: '', id: Date.now() });
                              setSettings(s);
                            }}
                          >
                            + Add New
                          </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {(settings.adminWallets?.easypaisa && Array.isArray(settings.adminWallets.easypaisa)) ? settings.adminWallets.easypaisa.map((acc, index) => (
                            <div key={acc.id || index} className="glass" style={{ padding: '12px', display: 'flex', gap: '10px', alignItems: 'flex-start', background: 'rgba(255,255,255,0.02)' }}>
                              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <input
                                  className="glass"
                                  placeholder="Number (e.g. 0300...)"
                                  value={acc.number || ''}
                                  onChange={(e) => {
                                    const s = { ...settings };
                                    s.adminWallets.easypaisa[index].number = e.target.value;
                                    setSettings(s);
                                  }}
                                  style={{ width: '100%', padding: '8px', color: 'var(--text-main)', fontSize: '0.9rem' }}
                                />
                                <input
                                  className="glass"
                                  placeholder="Account Name"
                                  value={acc.name || ''}
                                  onChange={(e) => {
                                    const s = { ...settings };
                                    s.adminWallets.easypaisa[index].name = e.target.value;
                                    setSettings(s);
                                  }}
                                  style={{ width: '100%', padding: '8px', color: 'var(--text-dim)', fontSize: '0.8rem' }}
                                />
                              </div>
                              <button
                                onClick={() => {
                                  const s = { ...settings };
                                  s.adminWallets.easypaisa.splice(index, 1);
                                  setSettings(s);
                                }}
                                style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', paddingTop: '8px' }}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          )) : (
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textAlign: 'center' }}>No Easypaisa accounts added.</p>
                          )}
                        </div>
                      </div>

                      {/* JazzCash Section */}
                      <div style={{ marginTop: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <label style={{ fontSize: '0.9rem', color: 'var(--text-dim)', fontWeight: 600 }}>JazzCash Accounts</label>
                          <button
                            className="glass"
                            style={{ padding: '4px 10px', fontSize: '0.75rem', color: 'var(--secondary)' }}
                            onClick={() => {
                              const s = { ...settings };
                              if (!s.adminWallets) s.adminWallets = { easypaisa: [], jazzcash: [] };
                              if (!Array.isArray(s.adminWallets.jazzcash)) s.adminWallets.jazzcash = [];
                              s.adminWallets.jazzcash.push({ number: '', name: '', id: Date.now() });
                              setSettings(s);
                            }}
                          >
                            + Add New
                          </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {(settings.adminWallets?.jazzcash && Array.isArray(settings.adminWallets.jazzcash)) ? settings.adminWallets.jazzcash.map((acc, index) => (
                            <div key={acc.id || index} className="glass" style={{ padding: '12px', display: 'flex', gap: '10px', alignItems: 'flex-start', background: 'rgba(255,255,255,0.02)' }}>
                              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <input
                                  className="glass"
                                  placeholder="Number (e.g. 0340...)"
                                  value={acc.number || ''}
                                  onChange={(e) => {
                                    const s = { ...settings };
                                    s.adminWallets.jazzcash[index].number = e.target.value;
                                    setSettings(s);
                                  }}
                                  style={{ width: '100%', padding: '8px', color: 'var(--text-main)', fontSize: '0.9rem' }}
                                />
                                <input
                                  className="glass"
                                  placeholder="Account Name"
                                  value={acc.name || ''}
                                  onChange={(e) => {
                                    const s = { ...settings };
                                    s.adminWallets.jazzcash[index].name = e.target.value;
                                    setSettings(s);
                                  }}
                                  style={{ width: '100%', padding: '8px', color: 'var(--text-dim)', fontSize: '0.8rem' }}
                                />
                              </div>
                              <button
                                onClick={() => {
                                  const s = { ...settings };
                                  s.adminWallets.jazzcash.splice(index, 1);
                                  setSettings(s);
                                }}
                                style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', paddingTop: '8px' }}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          )) : (
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textAlign: 'center' }}>No JazzCash accounts added.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Other Config */}
                  <div className="glass" style={{ padding: 'clamp(20px, 5vw, 30px)', borderRadius: '24px' }}>
                    <h4 style={{ marginBottom: '20px', fontWeight: 700 }}>Platform Customization</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div>
                        <label style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>Referral Bonus (%)</label>
                        <input
                          type="number"
                          className="glass"
                          value={settings.referralRewardPercent || ''}
                          onChange={(e) => {
                            setSettings({ ...settings, referralRewardPercent: parseInt(e.target.value) || 0 });
                          }}
                          style={{ width: '100%', padding: '12px', marginTop: '5px', color: 'var(--text-main)' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>Minimum Withdrawal (PKR)</label>
                        <input
                          type="number"
                          className="glass"
                          value={settings.minWithdrawal || ''}
                          onChange={(e) => {
                            setSettings({ ...settings, minWithdrawal: parseInt(e.target.value) || 0 });
                          }}
                          style={{ width: '100%', padding: '12px', marginTop: '5px', color: 'var(--text-main)' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>Site Name (Brand)</label>
                        <input
                          type="text"
                          className="glass"
                          value={settings.siteName || ''}
                          onChange={(e) => {
                            setSettings({ ...settings, siteName: e.target.value });
                          }}
                          style={{ width: '100%', padding: '12px', marginTop: '5px', color: 'var(--text-main)' }}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: '30px' }}>
                    <button className="gradient-btn" onClick={saveSettings} style={{ padding: '15px 30px', fontSize: '1.1rem' }}>
                      Save Settings
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Edit User Modal */}
      {editUserModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass" style={{ width: '400px', padding: '40px' }}>
            <h2 style={{ marginBottom: '25px' }}>Edit Member: {editUserModal.username}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Current Balance (PKR)</label>
                <input className="glass" type="number" value={editUserModal.balance} onChange={e => setEditUserModal({ ...editUserModal, balance: Number(e.target.value) })} style={{ width: '100%', padding: '12px', color: 'var(--text-main)' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Invested Amount (PKR)</label>
                <input className="glass" type="number" value={editUserModal.investedAmount} onChange={e => setEditUserModal({ ...editUserModal, investedAmount: Number(e.target.value) })} style={{ width: '100%', padding: '12px', color: 'var(--text-main)' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>New Password (Optional)</label>
                <input className="glass" type="text" placeholder="Leave blank to keep same" value={editUserModal.password} onChange={e => setEditUserModal({ ...editUserModal, password: e.target.value })} style={{ width: '100%', padding: '12px', color: 'var(--text-main)' }} />
              </div>
              <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                <button onClick={handleUpdateUser} className="gradient-btn" style={{ flex: 1 }}>Save Changes</button>
                <button onClick={() => setEditUserModal(null)} className="glass" style={{ flex: 1, color: 'var(--text-main)' }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Plan Modal */}
      {showAddPlan && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass" style={{ width: '400px', padding: '40px' }}>
            <h2 style={{ marginBottom: '25px' }}>Create New Plan</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <input className="glass" placeholder="Plan Name (e.g. Starter)" value={newPlan.name} onChange={e => setNewPlan({ ...newPlan, name: e.target.value })} style={{ width: '100%', padding: '12px', color: 'var(--text-main)' }} />
              <input
                className="glass"
                type="number"
                placeholder="Price (PKR)"
                value={newPlan.price}
                onChange={e => {
                  const price = parseFloat(e.target.value) || 0;
                  const percentage = parseFloat(newPlan.percentage) || 0;
                  setNewPlan({
                    ...newPlan,
                    price: e.target.value,
                    dailyReward: Math.round((price * percentage) / 100)
                  });
                }}
                style={{ width: '100%', padding: '12px', color: 'var(--text-main)' }}
              />
              <input
                className="glass"
                type="number"
                placeholder="Percentage (%)"
                value={newPlan.percentage}
                onChange={e => {
                  const percentage = parseFloat(e.target.value) || 0;
                  const price = parseFloat(newPlan.price) || 0;
                  setNewPlan({
                    ...newPlan,
                    percentage: e.target.value,
                    dailyReward: Math.round((price * percentage) / 100)
                  });
                }}
                style={{ width: '100%', padding: '12px', color: 'var(--text-main)' }}
              />
              <input
                className="glass"
                type="number"
                placeholder="Daily Reward (PKR)"
                value={newPlan.dailyReward}
                onChange={e => setNewPlan({ ...newPlan, dailyReward: e.target.value })}
                style={{ width: '100%', padding: '12px', color: 'var(--text-main)' }}
              />
              <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                <button onClick={handleAddPlan} className="gradient-btn" style={{ flex: 1 }}>Create</button>
                <button onClick={() => setShowAddPlan(false)} className="glass" style={{ flex: 1, color: 'var(--text-main)' }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Screenshot Modal */}
      {viewScreenshot && (
        <div className="modal-overlay" onClick={() => setViewScreenshot(null)}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="modal-content"
            style={{ padding: '15px' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0 }}>Payment Verification</h3>
              <button onClick={() => setViewScreenshot(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)' }}><X size={24} /></button>
            </div>
            <div style={{ borderRadius: '15px', overflow: 'hidden', background: '#000', display: 'flex', justifyContent: 'center' }}>
              <img src={viewScreenshot} style={{ maxWidth: '100%', display: 'block' }} alt="Payment Proof" />
            </div>
            <button className="gradient-btn" onClick={() => setViewScreenshot(null)} style={{ width: '100%', marginTop: '15px' }}>Close Preview</button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
