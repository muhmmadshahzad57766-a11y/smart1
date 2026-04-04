import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Shield, Users, ArrowRight, Zap, Target, Award } from 'lucide-react';
import { Link } from 'react-router-dom';

const Landing = () => {
    const plans = [
        { name: 'Bronze Strategy', min: '1,000', roi: '3.5%', color: '#cd7f32' },
        { name: 'Silver Strategy', min: '5,000', roi: '5.0%', color: '#c0c0c0' },
        { name: 'Gold Strategy', min: '15,000', roi: '8.5%', color: '#ffd700' },
        { name: 'Pro Strategy', min: '50,000', roi: '12.0%', color: 'var(--primary)' },
    ];

    const features = [
        { icon: <Shield size={32} />, title: 'Secure Assets', desc: 'Bank-grade encryption and Supabase-backed security layers for your peace of mind.' },
        { icon: <Zap size={32} />, title: 'Instant Yield', desc: 'Watch your portfolio grow in real-time with daily automated profit distributions.' },
        { icon: <Users size={32} />, title: 'Referral Rewards', desc: 'Build your network and earn 10% lifetime commissions on every referral deposit.' },
    ];

    return (
        <div style={{ background: 'var(--bg-main)', color: 'white', minHeight: '100vh' }}>
            {/* Hero Section */}
            <section className="landing-hero">
                <div className="landing-grid container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="badge badge-info" style={{ marginBottom: '20px' }}>v2.0 Now Live</div>
                        <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: '25px' }}>
                            Accelerate Your <br />
                            <span className="gradient-text">Financial Future</span>
                        </h1>
                        <p style={{ fontSize: '1.2rem', color: 'var(--text-dim)', marginBottom: '40px', maxWidth: '500px' }}>
                            The most advanced automated investment portal. Secure, transparent, and built for consistent daily growth.
                        </p>
                        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                            <Link to="/login" className="gradient-btn" style={{ padding: '18px 35px', borderRadius: '15px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem' }}>
                                Get Started Now <ArrowRight size={20} />
                            </Link>
                            <a href="#plans" className="glass" style={{ padding: '18px 35px', borderRadius: '15px', textDecoration: 'none', color: 'white', border: '1px solid var(--glass-border)', fontSize: '1.1rem' }}>
                                View Strategies
                            </a>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1 }}
                        className="floating"
                        style={{ position: 'relative' }}
                    >
                        <img
                            src="/hero.png"
                            alt="InvestSmart Hero"
                            style={{ width: '100%', borderRadius: '30px', boxShadow: '0 30px 60px rgba(0,0,0,0.5)' }}
                        />
                        {/* Glow effect background */}
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '120%', height: '120%', background: 'radial-gradient(circle, var(--primary-glow) 0%, transparent 70%)', zIndex: -1 }}></div>
                    </motion.div>
                </div>
            </section>

            {/* Features Section */}
            <section style={{ padding: '100px 5%', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <h2 className="section-title">Engineered for <span className="gradient-text">Success</span></h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
                        {features.map((f, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ y: -10 }}
                                className="feature-step"
                                style={{ textAlign: 'center' }}
                            >
                                <div style={{ color: 'var(--primary)', marginBottom: '20px', display: 'inline-block', padding: '15px', background: 'var(--primary-glow)', borderRadius: '15px' }}>
                                    {f.icon}
                                </div>
                                <h3 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>{f.title}</h3>
                                <p style={{ color: 'var(--text-dim)', lineHeight: 1.6 }}>{f.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Investment Plans Section */}
            <section id="plans" style={{ padding: '100px 5%' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <h2 className="section-title">Growth <span className="gradient-text">Strategies</span></h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '25px' }}>
                        {plans.map((p, i) => (
                            <div key={i} className="glass" style={{ padding: '35px', borderRadius: '25px', position: 'relative', overflow: 'hidden', border: `1px solid ${p.color}33` }}>
                                <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: p.color, opacity: 0.05, borderRadius: '50%' }}></div>
                                <h4 style={{ color: p.color, fontWeight: 700, textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '2px', marginBottom: '15px' }}>{p.name}</h4>
                                <div style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '5px' }}>{p.roi}</div>
                                <div style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '30px' }}>Daily ROI Guaranteed</div>
                                <div style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '15px', marginBottom: '25px' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Minimum Deposit</div>
                                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>PKR {p.min}</div>
                                </div>
                                <Link to="/login" style={{ display: 'block', textAlign: 'center', padding: '12px', background: 'white', color: 'black', borderRadius: '12px', fontWeight: 700, textDecoration: 'none', transition: 'all 0.3s' }}>
                                    Select Plan
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Trust Section */}
            <section style={{ padding: '100px 5%', textAlign: 'center', background: 'linear-gradient(to bottom, transparent, rgba(79, 172, 254, 0.05))' }}>
                <div className="glass" style={{ maxWidth: '800px', margin: '0 auto', padding: '60px', borderRadius: '40px' }}>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '20px' }}>Ready to Scale?</h2>
                    <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem', marginBottom: '40px' }}>Join over 5,000+ active investors already generating passive yield every single day.</p>
                    <Link to="/login" className="gradient-btn" style={{ padding: '18px 50px', borderRadius: '15px', textDecoration: 'none', fontSize: '1.2rem', fontWeight: 700 }}>
                        Create Your Account
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer style={{ padding: '60px 5%', borderTop: '1px solid var(--glass-border)', textAlign: 'center' }}>
                <div style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '1.5rem', marginBottom: '20px' }}>InvestSmart</div>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>© 2026 InvestSmart. All rights reserved. Professional wealth management made accessible.</p>
            </footer>
        </div>
    );
};

export default Landing;
