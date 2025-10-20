import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Unauthorized = () => {
  const { isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate(isAdmin ? '/admin' : '/resident');
  };

  return (
    <div className="unauthorized-container">
      <div className="unauthorized-content">
        <div className="unauthorized-icon">🚫</div>
        <h1>Access Denied</h1>
        <p>You don't have permission to access this page.</p>
        
        <div className="unauthorized-actions">
          <button onClick={handleGoHome} className="home-btn">
            Go to Dashboard
          </button>
          <button onClick={logout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
