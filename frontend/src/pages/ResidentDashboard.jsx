import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userAPI, notificationAPI } from '../utils/api';

const ResidentDashboard = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [notificationStats, setNotificationStats] = useState({ unreadCount: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);

  const { user, logout } = useAuth();

  useEffect(() => {
    if (activeTab === 'profile' && !profile) {
      fetchProfile();
    } else if (activeTab === 'notifications') {
      fetchNotifications();
    }
  }, [activeTab]);

  // Initial load - fetch profile and notification count
  useEffect(() => {
    fetchProfile();
    fetchNotificationCount();
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Auto-refresh notifications every 10 seconds when on notifications tab
  useEffect(() => {
    let interval;
    
    if (autoRefresh && activeTab === 'notifications') {
      interval = setInterval(() => {
        fetchNotificationCount(); // Update badge count
        if (activeTab === 'notifications') {
          fetchNotifications(false); // Update notifications list without loading spinner
        }
      }, 10000); // 10 seconds
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [autoRefresh, activeTab]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getProfile();
      setProfile(response.data.user);
    } catch (error) {
      setError('Failed to fetch profile information');
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError('');
      const response = await notificationAPI.getMyNotifications();
      
      // Check for new notifications
      const newNotifications = response.data.notifications;
      const previousCount = notifications.length;
      const newCount = newNotifications.length;
      
      if (!showLoading && newCount > previousCount) {
        setHasNewNotifications(true);
        // Auto-clear the indicator after 3 seconds
        setTimeout(() => setHasNewNotifications(false), 3000);
        
        // Show browser notification if permission granted
        if (Notification.permission === 'granted') {
          const latestNotification = newNotifications[0];
          new Notification('Society 360 - New Notification', {
            body: latestNotification.title,
            icon: '/favicon.ico',
            badge: '/favicon.ico'
          });
        }
        
        // Show success message
        setSuccess('New notification received!');
        setTimeout(() => setSuccess(''), 2000);
      }
      
      setNotifications(newNotifications);
      setNotificationStats({
        unreadCount: response.data.pagination.unreadCount
      });
      setLastRefresh(new Date());
    } catch (error) {
      setError('Failed to fetch notifications');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const fetchNotificationCount = async () => {
    try {
      const response = await notificationAPI.getMyNotifications(1);
      setNotificationStats({
        unreadCount: response.data.pagination.unreadCount
      });
    } catch (error) {
      // Silently fail for notification count
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId 
            ? { ...notif, isRead: true, readAt: new Date() }
            : notif
        )
      );
      
      // Update unread count
      setNotificationStats(prev => ({
        ...prev,
        unreadCount: Math.max(0, prev.unreadCount - 1)
      }));
      
      setSuccess('Notification marked as read');
    } catch (error) {
      setError('Failed to mark notification as read');
    }
  };

  const handleRespondToNotification = async (notificationId, response, responseMessage = null) => {
    try {
      setLoading(true);
      const result = await notificationAPI.respondToNotification(notificationId, response, responseMessage);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId 
            ? { 
                ...notif, 
                hasResponse: true, 
                response: response,
                responseAt: new Date(),
                responseMessage: responseMessage,
                isRead: true,
                readAt: notif.readAt || new Date()
              }
            : notif
        )
      );
      
      // Update unread count
      setNotificationStats(prev => ({
        ...prev,
        unreadCount: Math.max(0, prev.unreadCount - 1)
      }));
      
      const responseText = response === 'coming' ? 'Coming' : 'Not Coming';
      setSuccess(`Response "${responseText}" sent successfully!`);
    } catch (error) {
      setError(`Failed to send response: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">Loading your profile...</div>
      </div>
    );
  }

  return (
    <div className="resident-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Society 360</h1>
          <div className="header-actions">
            <span>Resident Portal - Welcome, {user?.fullName || user?.username}</span>
            <button onClick={logout} className="logout-btn">Logout</button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="dashboard-nav">
        <button
          className={activeTab === 'profile' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveTab('profile')}
        >
          👤 Profile
        </button>
        <button
          className={activeTab === 'notifications' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveTab('notifications')}
        >
          🔔 Notifications
          {notificationStats.unreadCount > 0 && (
            <span className="notification-badge">{notificationStats.unreadCount}</span>
          )}
        </button>
      </nav>

      {/* Main Content */}
      <main className="dashboard-content">
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {/* Profile Tab */}
        {activeTab === 'profile' && profile && (
          <div className="profile-container">
            {/* Profile Header */}
            <div className="profile-header">
              <div className="profile-avatar">
                {profile.imageUrl ? (
                  <img 
                    src={profile.imageUrl} 
                    alt={profile.fullName}
                    className="avatar-image"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className="avatar-placeholder" 
                  style={{ display: profile.imageUrl ? 'none' : 'flex' }}
                >
                  {profile.fullName?.charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="profile-info">
                <h2>{profile.fullName}</h2>
                <p className="username">@{profile.username}</p>
                <p className="room-info">Room {profile.roomNumber}, Floor {profile.floor}</p>
              </div>
            </div>

            {/* Profile Details */}
            <div className="profile-sections">
              {/* Personal Information */}
              <section className="profile-section">
                <h3>Personal Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="label">Full Name</span>
                    <span className="value">{profile.fullName}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Email</span>
                    <span className="value">{profile.email}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Phone</span>
                    <span className="value">{profile.phone}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Date of Joining</span>
                    <span className="value">{formatDate(profile.dateOfJoining)}</span>
                  </div>
                </div>
              </section>

              {/* Room Information */}
              <section className="profile-section">
                <h3>Room Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="label">Room Number</span>
                    <span className="value">{profile.roomNumber}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Floor</span>
                    <span className="value">{profile.floor}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Account Status</span>
                    <span className={`value status ${profile.isActive ? 'active' : 'inactive'}`}>
                      {profile.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {profile.createdBy && (
                    <div className="info-item">
                      <span className="label">Registered By</span>
                      <span className="value">{profile.createdBy.username}</span>
                    </div>
                  )}
                </div>
              </section>

              {/* Emergency Contact */}
              {profile.emergencyContact && (
                <section className="profile-section">
                  <h3>Emergency Contact</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="label">Name</span>
                      <span className="value">{profile.emergencyContact.name}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Phone</span>
                      <span className="value">{profile.emergencyContact.phone}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Relationship</span>
                      <span className="value">{profile.emergencyContact.relationship}</span>
                    </div>
                  </div>
                </section>
              )}
            </div>

            {/* Vehicle Information */}
            {profile.vehicleDetails && (
              <section className="profile-section">
                <h3>Vehicle Information</h3>
                {profile.vehicleDetails.hasVehicle ? (
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="label">Vehicle Type</span>
                      <span className="value">{profile.vehicleDetails.vehicleType}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Vehicle Number</span>
                      <span className="value">{profile.vehicleDetails.vehicleNumber}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Brand</span>
                      <span className="value">{profile.vehicleDetails.vehicleBrand}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Color</span>
                      <span className="value">{profile.vehicleDetails.vehicleColor}</span>
                    </div>
                  </div>
                ) : (
                  <div className="no-vehicle-message">
                    <p>No vehicle registered</p>
                  </div>
                )}
              </section>
            )}

            {/* Quick Actions */}
            <div className="quick-actions">
              <h3>Quick Actions</h3>
              <div className="actions-grid">
                <div className="action-card">
                  <h4>Need Help?</h4>
                  <p>Contact the society administration for any queries or issues.</p>
                  <button className="action-btn">Contact Admin</button>
                </div>
                
                <div className="action-card">
                  <h4>Report Issue</h4>
                  <p>Report any maintenance or facility issues in your room.</p>
                  <button className="action-btn">Report Issue</button>
                </div>
                
                <div className="action-card">
                  <h4>Society Rules</h4>
                  <p>View society rules and regulations for residents.</p>
                  <button className="action-btn">View Rules</button>
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div className="account-info">
              <h3>Account Information</h3>
              <div className="account-details">
                <div className="detail-item">
                  <span>Account Created: {formatDate(profile.createdAt)}</span>
                </div>
                <div className="detail-item">
                  <span>Last Updated: {formatDate(profile.updatedAt)}</span>
                </div>
                <div className="detail-item">
                  <span className="note">
                    Note: For any changes to your profile information, please contact the hostel administration.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="notifications-container">
            <div className="notifications-header">
              <div className="notifications-title-section">
                <h2>My Notifications</h2>
                {lastRefresh && (
                  <div className="last-refresh">
                    Last updated: {lastRefresh.toLocaleTimeString()}
                    {autoRefresh && activeTab === 'notifications' && (
                      <span className="auto-refresh-status">
                        🟢 Auto-refreshing every 10s
                      </span>
                    )}
                    {hasNewNotifications && (
                      <span className="new-notification-indicator">
                        ✨ New notifications!
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="notifications-controls">
                {notificationStats.unreadCount > 0 && (
                  <div className="unread-count">
                    🔔 {notificationStats.unreadCount} unread
                  </div>
                )}
                <div className="refresh-controls">
                  <button 
                    className="refresh-btn"
                    onClick={() => fetchNotifications()}
                    title="Refresh notifications"
                  >
                    🔄 Refresh
                  </button>
                  <button 
                    className={`auto-refresh-toggle ${autoRefresh ? 'active' : ''}`}
                    onClick={() => setAutoRefresh(!autoRefresh)}
                    title={autoRefresh ? 'Disable auto-refresh' : 'Enable auto-refresh'}
                  >
                    {autoRefresh ? '⏸️ Auto' : '▶️ Auto'}
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="loading">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="no-notifications">
                <div className="no-notifications-icon">📩</div>
                <h3>No notifications yet</h3>
                <p>You'll see messages from the watchman here when they send notifications.</p>
              </div>
            ) : (
              <div className="notifications-list">
                {notifications.map(notification => (
                  <div 
                    key={notification._id} 
                    className={`notification-item ${
                      !notification.isRead ? 'unread' : 'read'
                    } ${
                      notification.isUrgent ? 'urgent' : ''
                    }`}
                  >
                    <div className="notification-header">
                      <div className="notification-type">
                        {notification.type === 'parcel' && '📦'}
                        {notification.type === 'visitor' && '👥'}
                        {notification.type === 'maintenance' && '🔧'}
                        {notification.type === 'emergency' && '🚨'}
                        {notification.type === 'general' && '📢'}
                        <span className="notification-title">{notification.title}</span>
                      </div>
                      <div className="notification-meta">
                        <span className="notification-time">
                          {formatDate(notification.createdAt)}
                        </span>
                        {notification.isUrgent && (
                          <span className="urgent-badge">URGENT</span>
                        )}
                        {!notification.isRead && (
                          <span className="unread-dot">•</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="notification-message">
                      {notification.message}
                    </div>
                    
                    <div className="notification-footer">
                      <span className="notification-sender">
                        From: {notification.sender?.username || 'Watchman'}
                      </span>
                      
                      {!notification.hasResponse ? (
                        <div className="response-buttons">
                          <button 
                            className="response-btn coming"
                            onClick={() => handleRespondToNotification(notification._id, 'coming')}
                          >
                            👍 Coming
                          </button>
                          <button 
                            className="response-btn not-coming"
                            onClick={() => handleRespondToNotification(notification._id, 'not_coming')}
                          >
                            🙅 Not Coming
                          </button>
                          <button 
                            className="mark-read-only-btn"
                            onClick={() => handleMarkAsRead(notification._id)}
                            title="Mark as read without responding"
                          >
                            ✓
                          </button>
                        </div>
                      ) : (
                        <div className="response-status">
                          <span className={`response-indicator ${notification.response}`}>
                            {notification.response === 'coming' ? '👍 Coming' : '🙅 Not Coming'}
                          </span>
                          <span className="response-time">
                            Responded on {formatDate(notification.responseAt)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default ResidentDashboard;
