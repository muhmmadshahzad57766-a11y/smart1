import { useState } from 'react';
import { login, signup } from '../lib/storage';
import { motion } from 'framer-motion';

const Login = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      const user = await login(username, password);
      if (user) onLogin(user);
      else setError('Invalid credentials');
    } else {
      if (referralCode) {
        localStorage.setItem('signup_referral_code', referralCode);
      } else {
        localStorage.removeItem('signup_referral_code');
      }
      const result = await signup(username, password);
      if (result.error) setError(result.error);
      else onLogin(result);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: 'calc(100vh - 100px)',
      padding: '20px'
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass"
        style={{ width: '100%', maxWidth: '400px', padding: '40px' }}
      >
        <h2 style={{ marginBottom: '30px', textAlign: 'center' }}>
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="input-group">
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-dim)', fontSize: '0.9rem' }}>Username</label>
            <input
              className="glass"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{ width: '100%', padding: '12px', color: 'white' }}
            />
          </div>
          <div className="input-group">
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-dim)', fontSize: '0.9rem' }}>Password</label>
            <input
              className="glass"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '12px', color: 'white' }}
            />
          </div>

          {!isLogin && (
            <div className="input-group">
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-dim)', fontSize: '0.9rem' }}>Referral Code (Optional)</label>
              <input
                className="glass"
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                placeholder="REF-XXXXX"
                style={{ width: '100%', padding: '12px', color: 'white' }}
              />
            </div>
          )}

          {error && <div style={{ color: 'var(--accent-red)', fontSize: '0.85rem' }}>{error}</div>}

          <button type="submit" className="gradient-btn" style={{ marginTop: '10px' }}>
            {isLogin ? 'Login' : 'Signup'}
          </button>
        </form>

        <p style={{ marginTop: '20px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <span
            onClick={() => setIsLogin(!isLogin)}
            style={{ color: 'var(--primary)', cursor: 'pointer', marginLeft: '5px', fontWeight: 600 }}
          >
            {isLogin ? 'Signup' : 'Login'}
          </span>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
