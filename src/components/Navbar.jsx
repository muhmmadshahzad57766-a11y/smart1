import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogOut, Home, PieChart, Shield, Wallet, Menu, X, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = ({ user, onLogout, theme, onToggleTheme, siteName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = () => setIsOpen(!isOpen);

  const navItems = user
    ? (user.role === 'admin'
      ? [{ path: '/admin', label: 'Admin', icon: <Shield size={20} /> }]
      : [
        { path: '/dashboard', label: 'Dashboard', icon: <Home size={20} /> },
        { path: '/plans', label: 'Plans', icon: <PieChart size={20} /> },
        { path: '/withdraw', label: 'Withdraw', icon: <Wallet size={20} /> },
      ])
    : [
      { path: '/', label: 'Home', icon: <Home size={20} /> },
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
          <Link to="/" style={{ textDecoration: 'none' }}>
            <span className="gradient-text">{siteName}</span>
          </Link>
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
          <button
            onClick={onToggleTheme}
            className="glass"
            style={{ width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', cursor: 'pointer', border: '1px solid var(--glass-border)' }}
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {user ? (
            <>
              <div className="user-info-desktop" style={{ textAlign: 'right', display: 'none' }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{user.username}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{user.role}</div>
              </div>
              <button
                onClick={onLogout}
                className="glass"
                style={{ width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-red)', cursor: 'pointer', border: '1px solid var(--glass-border)' }}
              >
                <LogOut size={20} />
              </button>
            </>
          ) : (
            <Link to="/login" className="gradient-btn" style={{ padding: '8px 20px', borderRadius: '10px', textDecoration: 'none', fontSize: '0.9rem' }}>
              Login
            </Link>
          )}

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
              borderLeft: '1px solid var(--glass-border)',
              boxShadow: '-10px 0 30px rgba(0,0,0,0.5)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
              <div style={{ fontWeight: 800, fontSize: '1.2rem' }} className="gradient-text">{siteName}</div>
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

              {user ? (
                <div style={{ padding: '10px' }}>
                  <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-main)' }}>{user.username}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '20px' }}>{user.role.toUpperCase()}</div>
                  <button onClick={() => { onLogout(); toggleMenu(); }} className="gradient-btn" style={{ width: '100%', background: 'var(--accent-red)' }}>Logout</button>
                </div>
              ) : (
                <Link to="/login" onClick={toggleMenu} className="gradient-btn" style={{ textAlign: 'center', textDecoration: 'none' }}>
                  Login / Sign Up
                </Link>
              )}
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
          transition: all 0.2s;
        }
        .nav-item-mobile:hover {
          background: rgba(255,255,255,0.05);
        }
        .nav-item-mobile.active {
          background: rgba(79, 172, 254, 0.1);
          color: var(--primary);
        }

        @media (min-width: 769px) {
          .user-info-desktop { display: block !important; }
        }

        @media (max-width: 768px) {
          .nav-links { display: none !important; }
          .user-info-desktop { display: none !important; }
          .mobile-toggle { display: block !important; }
        }
      `}</style>
    </>
  );
};

export default Navbar;
