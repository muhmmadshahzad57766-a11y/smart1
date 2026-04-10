import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, User, Shield, Bell } from 'lucide-react';
import { fetchSupportMessages, sendSupportMessage, markSupportMessagesAsRead } from '../lib/storage';
import { motion, AnimatePresence } from 'framer-motion';

const SupportChat = ({ user, theme }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);
    const scrollRef = useRef(null);
    const isDark = theme === 'dark';

    useEffect(() => {
        if (!user) return;

        const loadMessages = async () => {
            const msgs = await fetchSupportMessages(user.id);
            setMessages(msgs);

            const unread = msgs.filter(m => !m.is_read && m.sender_type === 'admin').length;
            setUnreadCount(unread);
        };

        loadMessages();
        const interval = setInterval(loadMessages, 5000); // Poll every 5 seconds
        return () => clearInterval(interval);
    }, [user]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const res = await sendSupportMessage(user.id, 'user', input);
        if (res) {
            setMessages([...messages, res]);
            setInput('');
        }
    };

    const toggleChat = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            setUnreadCount(0);
            markSupportMessagesAsRead(user.id, 'user');
        }
    };

    if (!user || user.role === 'admin') return null;

    return (
        <>
            {/* Floating Button */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleChat}
                style={{
                    position: 'fixed',
                    bottom: '30px',
                    right: '30px',
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    color: 'black',
                    border: 'none',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                    cursor: 'pointer',
                    zIndex: 1001,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
                {unreadCount > 0 && !isOpen && (
                    <span style={{
                        position: 'absolute',
                        top: '0',
                        right: '0',
                        background: 'var(--accent-red)',
                        color: 'white',
                        borderRadius: '50%',
                        padding: '4px 8px',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        border: '2px solid var(--bg-darker)'
                    }}>
                        {unreadCount}
                    </span>
                )}
            </motion.button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        style={{
                            position: 'fixed',
                            bottom: '100px',
                            right: '30px',
                            width: 'clamp(300px, 90vw, 400px)',
                            height: '550px',
                            zIndex: 1000,
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            borderRadius: '28px',
                            border: '1px solid var(--glass-border)',
                            background: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                            backdropFilter: 'blur(20px)',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            padding: '24px',
                            background: 'var(--gradient-primary)',
                            color: 'black',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '15px'
                        }}>
                            <div style={{ padding: '10px', background: 'rgba(0,0,0,0.1)', borderRadius: '15px' }}>
                                <Shield size={22} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>Support Center</div>
                                <div style={{ fontSize: '0.8rem', opacity: 0.8, fontWeight: 500 }}>Online • Precision Support</div>
                            </div>
                            <button
                                onClick={toggleChat}
                                style={{
                                    background: 'rgba(0,0,0,0.05)',
                                    border: 'none',
                                    color: 'black',
                                    cursor: 'pointer',
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div
                            ref={scrollRef}
                            style={{
                                flex: 1,
                                padding: '25px',
                                overflowY: 'auto',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '16px',
                                background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)'
                            }}
                        >
                            {messages.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-dim)' }}>
                                    <div style={{
                                        width: '70px',
                                        height: '70px',
                                        borderRadius: '50%',
                                        background: 'rgba(79, 172, 254, 0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: '0 auto 20px'
                                    }}>
                                        <MessageCircle size={32} style={{ color: 'var(--primary)' }} />
                                    </div>
                                    <p style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-main)' }}>How can we help you?</p>
                                    <p style={{ fontSize: '0.85rem', marginTop: '5px' }}>Our specialists are ready to assist you.</p>
                                </div>
                            ) : (
                                messages.map((msg, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            maxWidth: '85%',
                                            alignSelf: msg.sender_type === 'user' ? 'flex-end' : 'flex-start',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: msg.sender_type === 'user' ? 'flex-end' : 'flex-start'
                                        }}
                                    >
                                        <div style={{
                                            padding: '12px 18px',
                                            borderRadius: msg.sender_type === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                                            background: msg.sender_type === 'user' ? 'var(--primary)' : (isDark ? 'rgba(255,255,255,0.05)' : 'white'),
                                            color: msg.sender_type === 'user' ? 'black' : 'var(--text-main)',
                                            fontSize: '0.92rem',
                                            lineHeight: '1.5',
                                            fontWeight: 500,
                                            boxShadow: msg.sender_type === 'user' ? '0 4px 15px var(--primary-glow)' : '0 4px 15px rgba(0,0,0,0.1)',
                                            border: msg.sender_type === 'user' ? 'none' : '1px solid var(--glass-border)'
                                        }}>
                                            {msg.content}
                                        </div>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '6px', fontWeight: 500 }}>
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Input Area */}
                        <form
                            onSubmit={handleSend}
                            style={{
                                padding: '20px',
                                background: isDark ? 'rgba(0,0,0,0.4)' : 'white',
                                display: 'flex',
                                gap: '12px',
                                borderTop: '1px solid var(--glass-border)'
                            }}
                        >
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Type your message..."
                                style={{
                                    flex: 1,
                                    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: '16px',
                                    padding: '12px 20px',
                                    color: 'var(--text-main)',
                                    outline: 'none',
                                    fontSize: '0.95rem',
                                    transition: 'all 0.3s ease'
                                }}
                                onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                                onBlur={(e) => e.target.style.borderColor = 'var(--glass-border)'}
                            />
                            <button
                                type="submit"
                                style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '16px',
                                    background: 'var(--primary)',
                                    color: 'black',
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 4px 15px var(--primary-glow)',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <Send size={20} />
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default SupportChat;
