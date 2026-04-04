import { Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getCurrentUser, logout, getSettings, getTheme, setTheme } from './lib/storage';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import Plans from './pages/Plans';
import Withdraw from './pages/Withdraw';

function App() {
  const [user, setUser] = useState(null);
  const [theme, setThemeState] = useState(() => getTheme());
  const [settings, setSettings] = useState({ themeColor: '#4facfe', siteName: 'InvestSmart' });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const initApp = async () => {
      const [currentUser, appSettings] = await Promise.all([
        getCurrentUser(),
        getSettings()
      ]);
      setUser(currentUser);
      setSettings(appSettings);
      setLoading(false);
    };
    initApp();
  }, []);

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, [theme]);

  useEffect(() => {
    if (settings?.siteName) {
      document.title = settings.siteName;
    }
  }, [settings?.siteName]);

  const handleToggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);       // persist to localStorage
    setThemeState(next);  // re-render → triggers useEffect
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    navigate('/login');
  };

  const themeColor = settings?.themeColor || '#4facfe';

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-main)' }}>
        <div className="gradient-text" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <style>{`
        :root {
          --primary: ${themeColor};
          --primary-glow: ${themeColor}4d;
          --gradient-primary: linear-gradient(135deg, ${themeColor} 0%, ${themeColor}dd 100%);
        }
        .gradient-text {
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      `}</style>

      {user && location.pathname !== '/login' && (
        <Navbar
          user={user}
          onLogout={handleLogout}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          siteName={settings?.siteName || 'InvestSmart'}
        />
      )}

      <div className="content">
        <Routes>
          <Route
            path="/login"
            element={
              user
                ? <Navigate to="/" replace />
                : <Login onLogin={(u) => { setUser(u); navigate(u.role === 'admin' ? '/admin' : '/dashboard'); }} />
            }
          />
          <Route path="/dashboard" element={user ? <Dashboard user={user} setUser={setUser} /> : <Navigate to="/login" />} />
          <Route path="/admin" element={user && user.role === 'admin' ? <AdminDashboard /> : <Navigate to="/login" />} />
          <Route path="/plans" element={user ? <Plans user={user} setUser={setUser} /> : <Navigate to="/login" />} />
          <Route path="/withdraw" element={user ? <Withdraw user={user} setUser={setUser} /> : <Navigate to="/login" />} />
          <Route path="/" element={<Navigate to={user ? (user.role === 'admin' ? '/admin' : '/dashboard') : '/login'} />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
