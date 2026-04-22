import { useState, useEffect } from 'react';
import { getSettings } from '../lib/storage';
import { Info, Shield, Target, Users } from 'lucide-react';
import { motion } from 'framer-motion';

const About = ({ theme }) => {
    const isDark = theme === 'dark';
    const [settings, setSettings] = useState(null);

    useEffect(() => {
        const load = async () => {
            const s = await getSettings();
            setSettings(s);
        };
        load();
    }, []);

    if (!settings) return <div style={{ padding: '100px', textAlign: 'center', color: 'var(--text-dim)' }}>Loading...</div>;

    return (
        <div className="page-container" style={{ padding: 'clamp(20px, 5vw, 60px)', maxWidth: '1200px', margin: '0 auto' }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass"
                style={{ padding: 'clamp(30px, 8vw, 60px)', borderRadius: '32px', textAlign: 'center', marginBottom: '60px' }}
            >
                <div style={{ display: 'inline-flex', padding: '15px', background: 'var(--surface-light)', borderRadius: '20px', color: 'var(--primary)', marginBottom: '25px' }}>
                    <Info size={40} />
                </div>
                <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 800, marginBottom: '25px', lineHeight: 1.1 }}>
                    About Our <span className="text-gradient">Platform</span>
                </h1>
                <p style={{ fontSize: 'clamp(1.1rem, 2vw, 1.4rem)', color: 'var(--text-dim)', maxWidth: '800px', margin: '0 auto', lineHeight: 1.6 }}>
                    {settings.aboutMessage || "Discover the future of digital asset management and profitable investment strategies."}
                </p>
            </motion.div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
                <motion.div
                    whileHover={{ y: -10 }}
                    className="glass"
                    style={{ padding: '40px', borderRadius: '24px' }}
                >
                    <div style={{ color: 'var(--accent-green)', marginBottom: '20px' }}><Shield size={32} /></div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '15px' }}>Secure Investing</h3>
                    <p style={{ color: 'var(--text-dim)', lineHeight: 1.6 }}>We utilize state-of-the-art security protocols to ensure your data and assets are protected 24/7.</p>
                </motion.div>

                <motion.div
                    whileHover={{ y: -10 }}
                    className="glass"
                    style={{ padding: '40px', borderRadius: '24px' }}
                >
                    <div style={{ color: 'var(--primary)', marginBottom: '20px' }}><Target size={32} /></div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '15px' }}>Dynamic Growth</h3>
                    <p style={{ color: 'var(--text-dim)', lineHeight: 1.6 }}>Our percentage-based reward system ensures your capital grows precisely according to your investment level.</p>
                </motion.div>

                <motion.div
                    whileHover={{ y: -10 }}
                    className="glass"
                    style={{ padding: '40px', borderRadius: '24px' }}
                >
                    <div style={{ color: 'var(--accent-yellow)', marginBottom: '20px' }}><Users size={32} /></div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '15px' }}>Community Focused</h3>
                    <p style={{ color: 'var(--text-dim)', lineHeight: 1.6 }}>Join thousands of members who are already building their financial future with our community-driven platform.</p>
                </motion.div>
            </div>
        </div>
    );
};

export default About;
