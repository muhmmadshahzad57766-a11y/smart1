import { useState } from 'react';
import { getDB, saveDB, updateUserData } from '../lib/storage';
import { motion } from 'framer-motion';
import { Wallet, Send } from 'lucide-react';

const Withdraw = ({ user, setUser }) => {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('JazzCash');
  const [accountNumber, setAccountNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const handleWithdraw = (e) => {
    e.preventDefault();
    const withdrawAmount = parseInt(amount);
    
    if (withdrawAmount > user.balance) {
      alert('Insufficient balance!');
      return;
    }

    if (withdrawAmount < 500) {
      alert('Minimum withdrawal is PKR 500');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const db = getDB();
      const newRequest = {
        id: Date.now().toString(),
        userId: user.id,
        username: user.username,
        amount: withdrawAmount,
        method,
        accountNumber,
        status: 'pending',
        timestamp: Date.now()
      };

      db.withdrawalRequests.push(newRequest);
      saveDB(db);

      // Deduct from user balance
      const updatedUser = updateUserData(user.id, {
        balance: user.balance - withdrawAmount,
        withdrawals: [...user.withdrawals, newRequest]
      });
      
      setUser(updatedUser);
      setLoading(false);
      setAmount('');
      setAccountNumber('');
      alert('Withdrawal request submitted successfully!');
    }, 1500);
  };

  return (
    <div style={{ padding: '30px', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Withdraw <span className="gradient-text">Funds</span></h1>
        <p style={{ color: 'var(--text-dim)' }}>Request a payout to your preferred mobile wallet.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="card glass" style={{ height: 'fit-content' }}>
          <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Wallet size={20} color="var(--primary)" /> Available Balance
          </h3>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '10px' }}>
            <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--text-dim)' }}>PKR</span> {user.balance.toLocaleString()}
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
                placeholder="Min. 500"
                required
                style={{ width: '100%', padding: '12px', color: 'white' }}
              />
            </div>

            <div className="input-group">
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-dim)', fontSize: '0.9rem' }}>Payment Method</label>
              <select 
                className="glass"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                style={{ width: '100%', padding: '12px', color: 'white', background: 'var(--bg-dark)' }}
              >
                <option value="JazzCash">JazzCash</option>
                <option value="EasyPaisa">EasyPaisa</option>
                <option value="Bank Transfer">Bank Transfer</option>
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
                style={{ width: '100%', padding: '12px', color: 'white' }}
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
        {user.withdrawals.length === 0 ? (
          <p style={{ color: 'var(--text-dim)', textAlign: 'center', padding: '20px 0' }}>No withdrawal history found.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {[...user.withdrawals].reverse().map((w, i) => (
              <div key={i} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '15px', 
                background: 'var(--surface-light)',
                borderRadius: '12px'
              }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{w.method} Payout</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{new Date(w.timestamp).toLocaleDateString()}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700 }}>PKR {w.amount}</div>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: w.status === 'pending' ? '#ffc107' : w.status === 'approved' ? 'var(--accent-green)' : 'var(--accent-red)'
                  }}>
                    {w.status.toUpperCase()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Withdraw;
