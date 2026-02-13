import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { getUserAvatar } from '../utils/avatar';
import AuthModal from './AuthModal';
import './Header.css';

export default function Header() {
  const { user, userData, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
    navigate('/');
  };

  return (
    <>
      <motion.header 
        className="header"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 100 }}
      >
        <div className="header-container">
          <Link to="/" className="logo">
            <span className="logo-icon">💣</span>
            <span className="logo-text">CS2 <span className="accent">Nades</span></span>
          </Link>

          <nav className="nav">
            <Link to="/" className="nav-link">Карты</Link>
            {user && <Link to="/profile" className="nav-link">Избранное</Link>}
            {userData?.role === 'admin' && (
              <Link to="/admin" className="nav-link admin-link">Админ</Link>
            )}
          </nav>

          <div className="auth-section">
            {user ? (
              <div className="user-menu-container">
                <button 
                  className="user-button"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <img 
                    src={getUserAvatar(user, userData)} 
                    alt="Avatar" 
                    className="user-avatar"
                  />
                  <span className="user-name">{user.displayName || user.email?.split('@')[0]}</span>
                </button>
                
                {showUserMenu && (
                  <motion.div 
                    className="user-menu"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Link to="/profile" onClick={() => setShowUserMenu(false)}>
                      Профиль
                    </Link>
                    {userData?.role === 'admin' && (
                      <Link to="/admin" onClick={() => setShowUserMenu(false)}>
                        Админ панель
                      </Link>
                    )}
                    <button onClick={handleLogout}>Выйти</button>
                  </motion.div>
                )}
              </div>
            ) : (
              <motion.button 
                className="login-button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAuthModal(true)}
              >
                Войти
              </motion.button>
            )}
          </div>
        </div>
      </motion.header>

      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </>
  );
}
