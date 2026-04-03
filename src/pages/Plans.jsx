import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchPlans, addInvestmentRequest, getSettings } from '../lib/storage';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  X,
  ArrowRight,
  Copy,
  ShieldCheck,
  ShieldAlert,
  Camera
} from 'lucide-react';

const Plans = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [settings, setSettings] = useState({ adminWallets: { easypaisa: {}, jazzcash: {} } });
  const [loadingConfig, setLoadingConfig] = useState(true);

  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    method: 'easypaisa',
    senderAccountName: '',
    senderAccountNo: '',
    amountSent: '',
    transactionId: '',
    screenshot: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const init = async () => {
      const [fetchedPlans, appSettings] = await Promise.all([
        fetchPlans(),
        getSettings()
      ]);
      setPlans(fetchedPlans);

      // Fix missing nested objects
      if (!appSettings.adminWallets) appSettings.adminWallets = { easypaisa: {}, jazzcash: {} };
      setSettings(appSettings);
      setLoadingConfig(false);
    };
    init();
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Use Canvas to compress image if it's too large
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Resize if larger than 800px
        const MAX_WIDTH = 800;
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to low-quality JPEG to save space
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        setFormData({ ...formData, screenshot: dataUrl });
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleInvestClick = (plan) => {
    setSelectedPlan(plan);
    setFormData({ ...formData, amountSent: plan.price.toString() });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.senderAccountName || !formData.senderAccountNo || !formData.transactionId || !formData.amountSent) {
      alert('Please fill all required fields');
      return;
    }

    setSubmitting(true);
    await addInvestmentRequest(user.id, {
      planId: selectedPlan.id,
      planName: selectedPlan.name,
      ...formData,
      amountSent: parseInt(formData.amountSent)
    });

    setSubmitting(false);
    setShowModal(false);
    setSelectedPlan(null);
    alert('Your investment request has been submitted. Admin will verify it shortly.');
    navigate('/dashboard');
  };

  if (loadingConfig) return <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>;

  return (
    <div style={{ padding: '60px 20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '60px' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '15px' }}>Premium <span className="gradient-text">Investment Plans</span></h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>Select a strategic portfolio and grow your wealth with daily rewards.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
        {plans.map((plan) => (
          <motion.div
            key={plan.id}
            whileHover={{ y: -10 }}
            className={`card glass ${user.planId === plan.id ? 'active-plan' : ''}`}
            style={{
              padding: '40px',
              border: user.planId === plan.id ? '2px solid var(--primary)' : '1px solid var(--glass-border)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {user.planId === plan.id && (
              <div style={{ background: 'var(--primary)', color: 'black', padding: '5px 15px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800, width: 'fit-content', marginBottom: '15px' }}>
                ACTIVE NOW
              </div>
            )}

            <h3 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '5px' }}>{plan.name}</h3>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-main)', margin: '20px 0' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 400, color: 'var(--text-dim)' }}>PKR</span> {plan.price.toLocaleString()}
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '20px', marginBottom: '30px' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-dim)', marginBottom: '5px' }}>Daily ROI</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent-green)' }}>PKR {plan.dailyReward}</div>
            </div>

            <button
              onClick={() => handleInvestClick(plan)}
              disabled={user.planId === plan.id}
              className={user.planId === plan.id ? 'glass' : 'gradient-btn'}
              style={{ width: '100%', padding: '16px', borderRadius: '15px', marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
            >
              {user.planId === plan.id ? 'Already Subscribed' : (
                <>Start Investing <ArrowRight size={18} /></>
              )}
            </button>
          </motion.div>
        ))}
      </div>

      {/* Investment & Payment Proof Modal */}
      <AnimatePresence>
        {showModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass"
              style={{ width: '100%', maxWidth: '900px', height: '90vh', overflowY: 'auto', borderRadius: '30px', padding: '40px', border: '1px solid var(--glass-border)', position: 'relative' }}
            >
              <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: '30px', right: '30px', background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
                <X size={30} />
              </button>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '40px' }}>
                {/* Left: Admin Details */}
                <div>
                  <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '10px' }}>Step 1: Payment</h2>
                  <p style={{ color: 'var(--text-dim)', marginBottom: '30px' }}>Please send the plan amount to one of the following accounts.</p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Easypaisa */}
                    <div style={{ padding: '25px', background: 'linear-gradient(135deg, rgba(22, 163, 74, 0.1), rgba(22, 163, 74, 0.05))', borderRadius: '24px', border: '1px solid rgba(22, 163, 74, 0.2)' }}>
                      <div style={{ color: 'var(--accent-green)', fontWeight: 800, fontSize: '0.8rem', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '5px' }}>Easypaisa</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, margin: '5px 0' }}>{settings.adminWallets?.easypaisa?.number}</div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>Name: {settings.adminWallets?.easypaisa?.name}</div>
                    </div>

                    {/* Jazzcash */}
                    <div style={{ padding: '25px', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.05))', borderRadius: '24px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                      <div style={{ color: 'var(--accent-yellow)', fontWeight: 800, fontSize: '0.8rem', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '5px' }}>JazzCash</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, margin: '5px 0' }}>{settings.adminWallets?.jazzcash?.number}</div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>Name: {settings.adminWallets?.jazzcash?.name}</div>
                    </div>
                  </div>

                  <div style={{ marginTop: '30px', padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '20px', borderLeft: '4px solid var(--primary)' }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', lineHeight: '1.6' }}>
                      <b>Important:</b> Always double check the account details and ensure you send exactly <b>PKR {selectedPlan?.price.toLocaleString()}</b>.
                    </p>
                  </div>
                </div>

                {/* Right: Submission Form */}
                <div>
                  <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '10px' }}>Step 2: Proof</h2>
                  <p style={{ color: 'var(--text-dim)', marginBottom: '30px' }}>Submit your transaction details for verification.</p>

                  <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                      <label style={{ fontSize: '0.9rem', color: 'var(--text-dim)', display: 'block', marginBottom: '8px' }}>Payment Method Used</label>
                      <select className="glass" value={formData.method} onChange={e => setFormData({ ...formData, method: e.target.value })} style={{ width: '100%', padding: '14px', color: 'white' }}>
                        <option value="easypaisa">Easypaisa</option>
                        <option value="jazzcash">JazzCash</option>
                      </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <div>
                        <label style={{ fontSize: '0.9rem', color: 'var(--text-dim)', display: 'block', marginBottom: '8px' }}>Account Name</label>
                        <input className="glass" placeholder="Your Name" value={formData.senderAccountName} onChange={e => setFormData({ ...formData, senderAccountName: e.target.value })} style={{ width: '100%', padding: '14px', color: 'white' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.9rem', color: 'var(--text-dim)', display: 'block', marginBottom: '8px' }}>Account No</label>
                        <input className="glass" placeholder="03XXXXXXXXX" value={formData.senderAccountNo} onChange={e => setFormData({ ...formData, senderAccountNo: e.target.value })} style={{ width: '100%', padding: '14px', color: 'white' }} />
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.9rem', color: 'var(--text-dim)', display: 'block', marginBottom: '8px' }}>Transaction ID (TRX)</label>
                      <input className="glass" placeholder="e.g. 192837465" value={formData.transactionId} onChange={e => setFormData({ ...formData, transactionId: e.target.value })} style={{ width: '100%', padding: '14px', color: 'white' }} />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.9rem', color: 'var(--text-dim)', display: 'block', marginBottom: '8px' }}>Payment Screenshot</label>
                      <div style={{ position: 'relative', display: 'block', width: '100%' }}>
                        {/* The input MUST be on top of the UI to be clickable */}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            opacity: 0,
                            zIndex: 10,
                            cursor: 'pointer'
                          }}
                        />
                        <div className="glass" style={{ padding: '20px', textAlign: 'center', borderStyle: 'solid', borderWidth: '2px', borderStyle: 'dashed', borderColor: 'var(--glass-border)', pointerEvents: 'none' }}>
                          {formData.screenshot ? (
                            <img src={formData.screenshot} style={{ width: '100%', maxHeight: '150px', borderRadius: '10px', objectFit: 'contain' }} />
                          ) : (
                            <div style={{ color: 'var(--text-dim)' }}>
                              <Camera size={30} style={{ marginBottom: '10px' }} />
                              <div>Click to upload proof</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <button type="submit" disabled={submitting} className="gradient-btn" style={{ padding: '18px', width: '100%', marginTop: '10px', fontSize: '1.1rem', fontWeight: 700 }}>
                      {submitting ? 'Submitting Request...' : (
                        <>Submit Verification Proof <ShieldCheck size={20} style={{ marginLeft: '10px' }} /></>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .active-plan {
          box-shadow: 0 0 40px rgba(79, 172, 254, 0.2);
          background: rgba(79, 172, 254, 0.05) !important;
        }
        select option {
           background: #111;
           color: white;
        }
      `}</style>
    </div>
  );
};

export default Plans;
