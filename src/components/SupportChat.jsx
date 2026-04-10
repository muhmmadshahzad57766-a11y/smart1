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
                        className="glass"
                        style={{
                            position: 'fixed',
                            bottom: '100px',
                            right: '30px',
                            width: 'clamp(300px, 90vw, 380px)',
                            height: '500px',
                            zIndex: 1000,
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            borderRadius: '24px',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                            border: '1px solid var(--glass-border)'
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            padding: '20px',
                            background: 'var(--gradient-primary)',
                            color: 'black',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                        }}>
                            <div style={{ padding: '8px', background: 'rgba(0,0,0,0.1)', borderRadius: '12px' }}>
                                <Shield size={20} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 800, fontSize: '1rem' }}>Support Center</div>
                                <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>We're online to help you</div>
                            </div>
                            <button onClick={toggleChat} style={{ background: 'none', border: 'none', color: 'black', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div
                            ref={scrollRef}
                            style={{
                                flex: 1,
                                padding: '20px',
                                overflowY: 'auto',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px',
                                background: 'rgba(0,0,0,0.2)'
                            }}
                        >
                            {messages.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-dim)' }}>
                                    <MessageCircle size={40} style={{ opacity: 0.2, marginBottom: '15px' }} />
                                    <p style={{ fontSize: '0.9rem' }}>How can we help you today? Send us a message!</p>
                                </div>
                            ) : (
                                messages.map((msg, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            maxWidth: '80%',
                                            alignSelf: msg.sender_type === 'user' ? 'flex-end' : 'flex-start',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: msg.sender_type === 'user' ? 'flex-end' : 'flex-start'
                                        }}
                                    >
                                        <div style={{
                                            padding: '12px 16px',
                                            borderRadius: msg.sender_type === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                            background: msg.sender_type === 'user' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                            color: msg.sender_type === 'user' ? 'black' : 'var(--text-main)',
                                            fontSize: '0.9rem',
                                            fontWeight: 500,
                                            border: msg.sender_type === 'user' ? 'none' : '1px solid var(--glass-border)'
                                        }}>
                                            {msg.content}
                                        </div>
                                        <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '4px' }}>
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
                                padding: '15px',
                                background: 'rgba(0,0,0,0.3)',
                                display: 'flex',
                                gap: '10px',
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
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: '12px',
                                    padding: '10px 15px',
                                    color: 'var(--text-main)',
                                    outline: 'none',
                                    fontSize: '0.9rem'
                                }}
                            />
                            <button
                                type="submit"
                                style={{
                                    width: '45px',
                                    height: '45px',
                                    borderRadius: '12px',
                                    background: 'var(--primary)',
                                    color: 'black',
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
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
