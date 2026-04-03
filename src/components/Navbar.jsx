import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogOut, Home, PieChart, Shield, Wallet, Menu, X, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = ({ user, onLogout, theme, onToggleTheme }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = () => setIsOpen(!isOpen);

  const navItems = user.role === 'admin'
    ? [{ path: '/admin', label: 'Admin', icon: <Shield size={20} /> }]
    : [
        { path: '/dashboard', label: 'Dashboard', icon: <Home size={20} /> },
        { path: '/plans',     label: 'Plans',     icon: <PieChart size={20} /> },
        { path: '/withdraw',  label: 'Withdraw',  icon: <Wallet size={20} /> },
      ];

  const isActive = (path) => location.pathname === path;
  const isDark = theme === 'dark';

  return (
    <>
      <nav className="glass" style={{
        height: 'var(--header-height)',
        margin: '10px 15px',
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: '10px',
        zIndex: 1000
      }}>
        {/* Logo */}
        <div className="logo" style={{ fontWeight: 800, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ padding: '6px', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', borderRadius: '10px', display: 'flex' }}>
            <PieChart size={20} color="white" />
          </div>
          <span className="gradient-text">InvestSmart</span>
        </div>

        {/* Desktop Links */}
        <div className="nav-links" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
            >
              {item.icon} {item.label}
            </Link>
          ))}
        </div>

        {/* Right-side actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="user-info-desktop" style={{ textAlign: 'right', display: 'none' }}>
            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{user.username}</div>
          </div>

          {/* ─── Theme Toggle Button ─── */}
          <button
            id="theme-toggle-btn"
            onClick={onToggleTheme}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="glass theme-toggle-btn"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              border: '1px solid var(--glass-border)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isDark ? '#f59e0b' : '#475569',
              background: isDark
                ? 'rgba(245, 158, 11, 0.1)'
                : 'rgba(79, 172, 254, 0.1)',
              transition: 'all 0.3s ease',
              flexShrink: 0,
            }}
          >
            <motion.div
              key={isDark ? 'moon' : 'sun'}
              initial={{ rotate: -30, opacity: 0, scale: 0.7 }}
              animate={{ rotate: 0,   opacity: 1, scale: 1   }}
              exit={{ rotate: 30,    opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.25 }}
            >
              {isDark ? <Moon size={18} /> : <Sun size={18} />}
            </motion.div>
          </button>

          <button
            onClick={onLogout}
            className="logout-btn-desktop glass"
            style={{ padding: '8px', cursor: 'pointer', color: 'var(--accent-red)', border: '1px solid rgba(239, 68, 68, 0.2)' }}
          >
            <LogOut size={18} />
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={toggleMenu}
            className="mobile-toggle"
            style={{ display: 'none', background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            className="glass"
            style={{
              position: 'fixed',
              top: 0, right: 0, bottom: 0,
              width: '280px',
              zIndex: 2000,
              padding: '40px 20px',
              borderRadius: '0',
              borderLeft: '1px solid var(--glass-border)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
              {/* Theme toggle inside mobile menu too */}
              <button
                onClick={onToggleTheme}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: isDark ? 'rgba(245,158,11,0.1)' : 'rgba(79,172,254,0.1)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '10px',
                  padding: '8px 14px',
                  cursor: 'pointer',
                  color: isDark ? '#f59e0b' : '#475569',
                  fontFamily: 'var(--font-family)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                }}
              >
                {isDark ? <Moon size={16} /> : <Sun size={16} />}
                {isDark ? 'Light Mode' : 'Dark Mode'}
              </button>
              <button onClick={toggleMenu} style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}>
                <X size={28} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={toggleMenu}
                  className={`nav-item-mobile ${isActive(item.path) ? 'active' : ''}`}
                >
                  {item.icon} {item.label}
                </Link>
              ))}
              <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: '10px 0' }} />
              <div style={{ padding: '10px' }}>
                <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-main)' }}>{user.username}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '20px' }}>{user.role.toUpperCase()}</div>
                <button onClick={onLogout} className="gradient-btn" style={{ width: '100%', background: 'var(--accent-red)' }}>Logout</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .nav-item {
          text-decoration: none;
          color: var(--text-dim);
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.9rem;
          transition: all 0.3s ease;
        }
        .nav-item:hover, .nav-item.active {
          color: var(--text-main);
        }
        .nav-item.active {
          color: var(--primary);
        }

        .nav-item-mobile {
          text-decoration: none;
          color: var(--text-main);
          font-size: 1.2rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 12px;
          border-radius: 12px;
        }
        .nav-item-mobile.active {
          background: rgba(79, 172, 254, 0.1);
          color: var(--primary);
        }

        .theme-toggle-btn:hover {
          transform: scale(1.08);
          box-shadow: 0 4px 14px rgba(79, 172, 254, 0.25);
        }

        @media (min-width: 769px) {
          .user-info-desktop { display: block !important; }
        }

        @media (max-width: 768px) {
          .nav-links { display: none !important; }
          .logout-btn-desktop { display: none !important; }
          .mobile-toggle { display: block !important; }
        }
      `}</style>
    </>
  );
};

export default Navbar;
