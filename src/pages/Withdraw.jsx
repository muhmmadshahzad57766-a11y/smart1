import { useState, useEffect } from 'react';
import { submitWithdrawal, fetchUserWithdrawals, getCurrentUser, getSettings } from '../lib/storage';
import { motion } from 'framer-motion';
import { Wallet, Send } from 'lucide-react';

const Withdraw = ({ user, setUser, theme }) => {
  const isDark = theme === 'dark';
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('JazzCash');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountTitle, setAccountTitle] = useState('');
  const [accountName, setAccountName] = useState('');
  const [loading, setLoading] = useState(false);
  const [withdrawals, setWithdrawals] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [settings, setSettings] = useState({ minWithdrawal: 500 });

  useEffect(() => {
    const init = async () => {
      const [history, appSettings] = await Promise.all([
        fetchUserWithdrawals(user.id),
        getSettings()
      ]);
      setWithdrawals(history);
      setSettings(appSettings);
      setFetching(false);
    };
    init();
  }, [user.id]);

  const handleWithdraw = async (e) => {
    e.preventDefault();
    const withdrawAmount = parseInt(amount);
    const totalAvailable = (Number(user.balance) || 0) + (Number(user.investedAmount) || 0);

    if (withdrawAmount > totalAvailable) {
      alert('Insufficient balance!');
      return;
    }

    if (withdrawAmount < (settings.minWithdrawal || 500)) {
      alert(`Minimum withdrawal is PKR ${settings.minWithdrawal || 500}`);
      return;
    }

    setLoading(true);

    await submitWithdrawal(user.id, withdrawAmount, method, accountNumber, accountTitle, accountName);

    // Refresh user balance and withdrawal history
    const [updatedUser, newHistory] = await Promise.all([
      getCurrentUser(),
      fetchUserWithdrawals(user.id)
    ]);

    setUser(updatedUser);
    setWithdrawals(newHistory);
    setLoading(false);
    setAmount('');
    setAccountNumber('');
    setAccountTitle('');
    setAccountName('');
    alert('Withdrawal request submitted successfully!');
  };

  return (
    <div style={{ padding: 'clamp(15px, 4vw, 30px)', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Withdraw <span className="gradient-text">Funds</span></h1>
        <p style={{ color: 'var(--text-dim)' }}>Request a payout to your preferred mobile wallet.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '20px' }}>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="card glass" style={{ height: 'fit-content' }}>
          <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Wallet size={20} color="var(--primary)" /> Available Balance
          </h3>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '10px' }}>
            <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--text-dim)' }}>PKR</span> {((Number(user.balance) || 0) + (Number(user.investedAmount) || 0)).toLocaleString()}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Withdrawal takes 24-48 hours to process.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="card glass">
          <form onSubmit={handleWithdraw} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="input-group">
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-dim)', fontSize: '0.9rem' }}>Amount (PKR)</label>
              <input
                className="glass"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`Min. ${settings.minWithdrawal || 500}`}
                required
                style={{ width: '100%', padding: '12px', color: 'var(--text-main)' }}
              />
            </div>

            <div className="input-group">
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-dim)', fontSize: '0.9rem' }}>Payment Method</label>
              <select
                className="glass"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                style={{ width: '100%', padding: '12px', color: 'var(--text-main)', background: 'var(--surface-light)' }}
              >
                <option value="">Select Method</option>
                {Array.isArray(settings.adminWallets) && settings.adminWallets.map(cat => (
                  <option key={cat.id} value={cat.title}>{cat.title}</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-dim)', fontSize: '0.9rem' }}>Account Number</label>
              <input
                className="glass"
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="e.g. 0300 1234567"
                required
                style={{ width: '100%', padding: '12px', color: 'var(--text-main)' }}
              />
            </div>

            <div className="input-group">
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-dim)', fontSize: '0.9rem' }}>Account Title</label>
              <input
                className="glass"
                type="text"
                value={accountTitle}
                onChange={(e) => setAccountTitle(e.target.value)}
                placeholder="Name of account holder"
                required
                style={{ width: '100%', padding: '12px', color: 'var(--text-main)' }}
              />
            </div>

            <div className="input-group">
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-dim)', fontSize: '0.9rem' }}>Account Name</label>
              <input
                className="glass"
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Bank or Wallet Name (e.g. JazzCash)"
                required
                style={{ width: '100%', padding: '12px', color: 'var(--text-main)' }}
              />
            </div>

            <button type="submit" className="gradient-btn" disabled={loading} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
              {loading ? 'Processing...' : <><Send size={18} /> Request Withdrawal</>}
            </button>
          </form>
        </motion.div>
      </div>

      <div className="card glass" style={{ marginTop: '30px' }}>
        <h3 style={{ marginBottom: '20px' }}>Recent Withdrawals</h3>
        {fetching ? (
          <p style={{ color: 'var(--text-dim)', textAlign: 'center', padding: '20px 0' }}>Loading...</p>
        ) : withdrawals.length === 0 ? (
          <p style={{ color: 'var(--text-dim)', textAlign: 'center', padding: '20px 0' }}>No withdrawal history found.</p>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Account</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map(w => (
                  <tr key={w.id}>
                    <td>{new Date(w.timestamp).toLocaleDateString()}</td>
                    <td style={{ fontWeight: 700 }}>PKR {w.amount}</td>
                    <td>{w.method}</td>
                    <td>{w.accountDetails}</td>
                    <td>
                      <span className={`badge ${w.status === 'pending' ? 'badge-warning' : w.status === 'approved' ? 'badge-success' : 'badge-error'}`}>
                        {w.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
                {withdrawals.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>No transaction history found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Withdraw;
