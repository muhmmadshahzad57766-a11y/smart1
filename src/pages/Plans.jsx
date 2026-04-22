import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { addInvestmentRequest, getSettings, uploadScreenshot } from '../lib/storage';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  X,
  ArrowRight,
  Copy,
  ShieldCheck,
  ShieldAlert,
  Camera,
  DollarSign,
  TrendingUp,
  Wallet
} from 'lucide-react';

const Plans = ({ user, setUser, theme }) => {
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  const [amount, setAmount] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    method: '',
    senderAccountName: '',
    senderAccountNo: '',
    transactionId: '',
    screenshot: ''
  });
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const init = async () => {
      const appSettings = await getSettings();
      setSettings(appSettings);
      setLoading(false);
    };
    init();
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setScreenshotFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_WIDTH = 400;
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
        setFormData({ ...formData, screenshot: dataUrl });
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleInvestStep = () => {
    const num = Number(amount);
    if (!num || num < (settings?.minInvestment || 500)) {
      alert(`Minimum investment is PKR ${settings?.minInvestment || 500}`);
      return;
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.senderAccountName || !formData.senderAccountNo || !formData.transactionId || !formData.method) {
      alert('Please fill all required fields');
      return;
    }

    setSubmitting(true);

    let screenshotUrl = formData.screenshot;
    if (screenshotFile) {
      const uploadedUrl = await uploadScreenshot(screenshotFile);
      if (uploadedUrl) screenshotUrl = uploadedUrl;
    }

    await addInvestmentRequest(user.id, {
      planId: 'custom',
      planName: `Investment: ${amount}`,
      ...formData,
      screenshot: screenshotUrl,
      amountSent: parseInt(amount)
    });

    setUser({ ...user, hasPendingInvestment: true });
    setSubmitting(false);
    setShowModal(false);
    alert('Your investment request has been submitted. Admin will verify it shortly.');
    navigate('/dashboard');
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '100px', color: 'var(--text-dim)' }}>Loading...</div>;

  const estimatedProfit = (Number(amount) * (settings.dailyProfitPercent / 100)).toFixed(2);

  return (
    <div style={{ padding: 'clamp(20px, 5vw, 60px) 20px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: 'clamp(2rem, 6vw, 3.5rem)', fontWeight: 800, marginBottom: '15px' }}>
          Grow Your <span className="text-gradient">Wealth</span>
        </h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '1.2rem' }}>
          Enter the amount you wish to invest and earn <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{settings.dailyProfitPercent}%</span> daily reward.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass"
        style={{ padding: 'clamp(20px, 5vw, 50px)', borderRadius: '32px', maxWidth: '600px', margin: '0 auto' }}
      >
        <div style={{ marginBottom: '30px' }}>
          <label style={{ display: 'block', marginBottom: '12px', fontSize: '0.9rem', color: 'var(--text-dim)', fontWeight: 600 }}>Investment Amount (PKR)</label>
          <div style={{ position: 'relative' }}>
            <Wallet size={20} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input
              type="number"
              className="glass"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 5000"
              style={{ width: '100%', padding: '18px 18px 18px 50px', fontSize: '1.2rem', fontWeight: 700, borderRadius: '20px' }}
            />
          </div>
        </div>

        {Number(amount) > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            style={{ padding: '20px', background: 'var(--surface-light)', borderRadius: '20px', marginBottom: '30px', border: '1px solid var(--glass-border)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>Daily Estimated Reward:</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-green)' }}>PKR {estimatedProfit}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>Monthly Growth:</span>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)' }}>PKR {(estimatedProfit * 30).toLocaleString()}</span>
            </div>
          </motion.div>
        )}

        <button
          onClick={handleInvestStep}
          className="gradient-btn"
          style={{ width: '100%', padding: '20px', borderRadius: '20px', fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
        >
          Proceed to Payment <ArrowRight size={20} />
        </button>
      </motion.div>

      <AnimatePresence>
        {showModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass"
              style={{
                width: '100%',
                maxWidth: '900px',
                maxHeight: '90vh',
                overflowY: 'auto',
                borderRadius: '24px',
                padding: 'clamp(20px, 5vw, 40px)',
                position: 'relative'
              }}
            >
              <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: '25px', right: '25px', background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
                <X size={28} />
              </button>

              <div className="modal-grid">
                <div>
                  <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '10px' }}>Step 1: Payment</h2>
                  <p style={{ color: 'var(--text-dim)', marginBottom: '25px' }}>Send exactly <b>PKR {Number(amount).toLocaleString()}</b> to an account below.</p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {settings.adminWallets.map((cat, idx) => (
                      <div key={idx} style={{ padding: '20px', background: 'var(--surface-light)', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
                        <div style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '10px' }}>{cat.title}</div>
                        {cat.accounts.map((acc, i) => (
                          <div key={i} style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontWeight: 700 }}>{acc.number}</span>
                              <Copy size={14} style={{ cursor: 'pointer', color: 'var(--primary)' }} onClick={() => { navigator.clipboard.writeText(acc.number); alert('Copied!'); }} />
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Name: {acc.name}</div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Step 2: Proof</h2>
                  <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)', display: 'block', marginBottom: '6px' }}>Method Used</label>
                      <select className="glass" value={formData.method} onChange={e => setFormData({ ...formData, method: e.target.value })} style={{ width: '100%', padding: '12px' }}>
                        <option value="">Select Category</option>
                        {settings.adminWallets.map(c => <option key={c.id} value={c.title}>{c.title}</option>)}
                      </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)', display: 'block', marginBottom: '6px' }}>Account Name</label>
                        <input className="glass" placeholder="Your Name" value={formData.senderAccountName} onChange={e => setFormData({ ...formData, senderAccountName: e.target.value })} style={{ width: '100%', padding: '12px' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)', display: 'block', marginBottom: '6px' }}>Account No</label>
                        <input className="glass" placeholder="03XXXX" value={formData.senderAccountNo} onChange={e => setFormData({ ...formData, senderAccountNo: e.target.value })} style={{ width: '100%', padding: '12px' }} />
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)', display: 'block', marginBottom: '6px' }}>Transaction ID</label>
                      <input className="glass" placeholder="TRX ID" value={formData.transactionId} onChange={e => setFormData({ ...formData, transactionId: e.target.value })} style={{ width: '100%', padding: '12px' }} />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)', display: 'block', marginBottom: '6px' }}>Screenshot</label>
                      <div style={{ position: 'relative' }}>
                        <input type="file" accept="image/*" onChange={handleImageUpload} style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer', zIndex: 2 }} />
                        <div className="glass" style={{ padding: '15px', textAlign: 'center', borderStyle: 'dashed', borderWidth: '2px' }}>
                          {formData.screenshot ? <img src={formData.screenshot} style={{ maxHeight: '100px' }} /> : <Camera size={24} />}
                        </div>
                      </div>
                    </div>

                    <button type="submit" disabled={submitting} className="gradient-btn" style={{ padding: '15px', fontSize: '1rem', marginTop: '10px' }}>
                      {submitting ? 'Submitting...' : 'Submit Proof'}
                    </button>
                  </form>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .modal-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 30px;
        }
        @media (max-width: 480px) {
          .modal-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default Plans;
