import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userAPI, notificationAPI } from '../utils/api';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [residents, setResidents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    email: '',
    phone: '',
    imageUrl: '',
    roomNumber: '',
    floor: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    vehicleDetails: {
      hasVehicle: false,
      vehicleType: '',
      vehicleNumber: '',
      vehicleBrand: '',
      vehicleColor: ''
    }
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [selectedResident, setSelectedResident] = useState(null);
  const [showSentNotifications, setShowSentNotifications] = useState(false);
  const [sentNotifications, setSentNotifications] = useState([]);
  const [notificationData, setNotificationData] = useState({
    type: 'parcel',
    title: '',
    message: '',
    isUrgent: false
  });

  const { user, logout } = useAuth();

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchStats();
    } else if (activeTab === 'residents') {
      fetchResidents();
    } else if (activeTab === 'sent-notifications') {
      fetchSentNotifications();
    }
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getDashboardStats();
      setStats(response.data.stats);
    } catch (error) {
      setError('Failed to fetch dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const fetchResidents = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getResidents();
      setResidents(response.data.residents);
    } catch (error) {
      setError('Failed to fetch residents');
    } finally {
      setLoading(false);
    }
  };

  const fetchSentNotifications = async () => {
    try {
      setLoading(true);
      console.log('Fetching sent notifications...');
      const response = await notificationAPI.getSentNotifications();
      console.log('Sent notifications response:', response);
      console.log('Notifications data:', response.data.notifications);
      setSentNotifications(response.data.notifications);
    } catch (error) {
      console.error('Error fetching sent notifications:', error);
      setError('Failed to fetch sent notifications');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('emergencyContact.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        emergencyContact: {
          ...prev.emergencyContact,
          [field]: value
        }
      }));
    } else if (name.startsWith('vehicleDetails.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        vehicleDetails: {
          ...prev.vehicleDetails,
          [field]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleAddResident = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      
      await userAPI.createResident(formData);
      setSuccess('Resident added successfully!');
      setShowAddForm(false);
      
      // Reset form
      setFormData({
        username: '',
        password: '',
        fullName: '',
        email: '',
        phone: '',
        imageUrl: '',
        roomNumber: '',
        floor: '',
        emergencyContact: {
          name: '',
          phone: '',
          relationship: ''
        },
        vehicleDetails: {
          hasVehicle: false,
          vehicleType: '',
          vehicleNumber: '',
          vehicleBrand: '',
          vehicleColor: ''
        }
      });
      
      // Refresh residents list
      fetchResidents();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to add resident');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteResident = async (id, residentName) => {
    // First confirmation
    if (!window.confirm(`Are you sure you want to permanently delete ${residentName}?\n\nThis will remove all their data including:\n- Profile information\n- Room assignment\n- Vehicle details\n- Emergency contacts`)) {
      return;
    }
    
    // Second confirmation for safety
    if (!window.confirm(`FINAL WARNING: Delete ${residentName}?\n\nThis action CANNOT be undone!\n\nClick OK to permanently delete or Cancel to keep the resident.`)) {
      return;
    }
    
    try {
      setLoading(true);
      await userAPI.deleteResident(id);
      setSuccess(`${residentName} has been permanently deleted`);
      fetchResidents();
    } catch (error) {
      setError(`Failed to delete ${residentName}: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleNotifyResident = (resident) => {
    setSelectedResident(resident);
    setShowNotificationModal(true);
    // Pre-fill common notification types
    if (notificationData.type === 'parcel') {
      setNotificationData({
        ...notificationData,
        title: 'Parcel Delivery',
        message: `Hi ${resident.fullName}, you have a parcel waiting at the reception. Please collect it at your earliest convenience.`
      });
    }
  };

  const handleNotificationInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNotificationData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    
    if (!notificationData.title || !notificationData.message) {
      setError('Title and message are required');
      return;
    }
    
    try {
      setLoading(true);
      await notificationAPI.sendNotification({
        recipientId: selectedResident._id,
        ...notificationData
      });
      setSuccess(`Notification sent to ${selectedResident.fullName} successfully!`);
      setShowNotificationModal(false);
      setNotificationData({
        type: 'parcel',
        title: '',
        message: '',
        isUrgent: false
      });
      setSelectedResident(null);
    } catch (error) {
      setError(`Failed to send notification: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationTemplate = (type) => {
    const templates = {
      parcel: {
        title: 'Parcel Delivery',
        message: `Hi ${selectedResident?.fullName}, you have a parcel waiting at the reception. Please collect it at your earliest convenience.`
      },
      visitor: {
        title: 'Visitor at Gate',
        message: `Hi ${selectedResident?.fullName}, you have a visitor waiting at the main gate. Please come to receive them.`
      },
      maintenance: {
        title: 'Maintenance Notice',
        message: `Hi ${selectedResident?.fullName}, maintenance work is scheduled for your room/floor. Please contact the office for details.`
      },
      emergency: {
        title: 'Important Notice',
        message: `Hi ${selectedResident?.fullName}, this is an urgent message from hostel management. Please contact the office immediately.`
      },
      general: {
        title: 'General Notice',
        message: `Hi ${selectedResident?.fullName}, `
      }
    };
    return templates[type] || templates.general;
  };

  const handleTypeChange = (type) => {
    const template = getNotificationTemplate(type);
    setNotificationData({
      ...notificationData,
      type,
      title: template.title,
      message: template.message
    });
  };

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Society 360</h1>
          <div className="header-actions">
            <span>Admin Dashboard - Welcome, {user?.username}</span>
            <button onClick={logout} className="logout-btn">Logout</button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="dashboard-nav">
        <button
          className={activeTab === 'dashboard' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button
          className={activeTab === 'residents' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveTab('residents')}
        >
          Manage Residents
        </button>
        <button
          className={activeTab === 'sent-notifications' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveTab('sent-notifications')}
        >
          💬 Sent Messages
        </button>
      </nav>

      {/* Main Content */}
      <main className="dashboard-content">
        {/* Messages */}
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="dashboard-tab">
            <h2>Dashboard Overview</h2>
            
            {loading ? (
              <div className="loading">Loading statistics...</div>
            ) : stats ? (
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>Total Residents</h3>
                  <div className="stat-number">{stats.totalResidents}</div>
                </div>
                
                <div className="stat-card">
                  <h3>Active Residents</h3>
                  <div className="stat-number">{stats.activeResidents}</div>
                </div>
                
                <div className="stat-card">
                  <h3>Occupied Rooms</h3>
                  <div className="stat-number">{stats.totalResidents}</div>
                </div>
              </div>
            ) : null}

            {/* Floor Statistics */}
            {stats?.floorStats && (
              <div className="floor-stats">
                <h3>Floor-wise Distribution</h3>
                <div className="floor-grid">
                  {stats.floorStats.map(floor => (
                    <div key={floor._id} className="floor-stat">
                      <span>Floor {floor._id}</span>
                      <span>{floor.count} residents</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Residents */}
            {stats?.recentResidents && (
              <div className="recent-residents">
                <h3>Recent Residents</h3>
                <div className="resident-list">
                  {stats.recentResidents.map(resident => (
                    <div key={resident._id} className="resident-item">
                      <span>{resident.fullName}</span>
                      <span>Room {resident.roomNumber}</span>
                      <span>Floor {resident.floor}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Residents Tab */}
        {activeTab === 'residents' && (
          <div className="residents-tab">
            <div className="residents-header">
              <h2>Manage Residents</h2>
              <button
                onClick={() => setShowAddForm(true)}
                className="add-btn"
              >
                Add New Resident
              </button>
            </div>

            {/* Add Resident Form */}
            {showAddForm && (
              <div className="modal-overlay">
                <div className="modal">
                  <div className="modal-header">
                    <h3>Add New Resident</h3>
                    <button onClick={() => setShowAddForm(false)}>×</button>
                  </div>
                  
                  <form onSubmit={handleAddResident} className="add-resident-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Username *</label>
                        <input
                          type="text"
                          name="username"
                          value={formData.username}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Password *</label>
                        <input
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Full Name *</label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Profile Image URL</label>
                      <input
                        type="url"
                        name="imageUrl"
                        value={formData.imageUrl}
                        onChange={handleInputChange}
                        placeholder="https://example.com/image.jpg (optional)"
                      />
                      {formData.imageUrl && (
                        <div className="image-preview">
                          <img 
                            src={formData.imageUrl} 
                            alt="Preview"
                            className="form-image-preview"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'inline';
                            }}
                          />
                          <span className="preview-error" style={{display: 'none', color: '#dc3545', fontSize: '0.8rem'}}>⚠️ Invalid image URL</span>
                        </div>
                      )}
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Email *</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Phone *</label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Room Number *</label>
                        <input
                          type="text"
                          name="roomNumber"
                          value={formData.roomNumber}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Floor *</label>
                        <input
                          type="number"
                          name="floor"
                          value={formData.floor}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    <h4>Emergency Contact</h4>
                    <div className="form-group">
                      <label>Name *</label>
                      <input
                        type="text"
                        name="emergencyContact.name"
                        value={formData.emergencyContact.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Phone *</label>
                        <input
                          type="tel"
                          name="emergencyContact.phone"
                          value={formData.emergencyContact.phone}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Relationship *</label>
                        <input
                          type="text"
                          name="emergencyContact.relationship"
                          value={formData.emergencyContact.relationship}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    <h4>Vehicle Details (Optional)</h4>
                    <div className="form-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          name="vehicleDetails.hasVehicle"
                          checked={formData.vehicleDetails.hasVehicle}
                          onChange={handleInputChange}
                        />
                        Resident has a vehicle
                      </label>
                    </div>

                    {formData.vehicleDetails.hasVehicle && (
                      <>
                        <div className="form-row">
                          <div className="form-group">
                            <label>Vehicle Type *</label>
                            <select
                              name="vehicleDetails.vehicleType"
                              value={formData.vehicleDetails.vehicleType}
                              onChange={handleInputChange}
                              required={formData.vehicleDetails.hasVehicle}
                            >
                              <option value="">Select vehicle type</option>
                              <option value="bike">Bike/Motorcycle</option>
                              <option value="scooter">Scooter</option>
                              <option value="car">Car</option>
                              <option value="bicycle">Bicycle</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                          
                          <div className="form-group">
                            <label>Vehicle Number *</label>
                            <input
                              type="text"
                              name="vehicleDetails.vehicleNumber"
                              value={formData.vehicleDetails.vehicleNumber}
                              onChange={handleInputChange}
                              required={formData.vehicleDetails.hasVehicle}
                              placeholder="e.g., MH01AB1234"
                              style={{ textTransform: 'uppercase' }}
                            />
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label>Vehicle Brand *</label>
                            <input
                              type="text"
                              name="vehicleDetails.vehicleBrand"
                              value={formData.vehicleDetails.vehicleBrand}
                              onChange={handleInputChange}
                              required={formData.vehicleDetails.hasVehicle}
                              placeholder="e.g., Honda, Toyota, Hero"
                            />
                          </div>
                          
                          <div className="form-group">
                            <label>Vehicle Color *</label>
                            <input
                              type="text"
                              name="vehicleDetails.vehicleColor"
                              value={formData.vehicleDetails.vehicleColor}
                              onChange={handleInputChange}
                              required={formData.vehicleDetails.hasVehicle}
                              placeholder="e.g., Red, Blue, Black"
                            />
                          </div>
                        </div>
                      </>
                    )}

                    <div className="form-actions">
                      <button type="button" onClick={() => setShowAddForm(false)}>
                        Cancel
                      </button>
                      <button type="submit" disabled={loading}>
                        {loading ? 'Adding...' : 'Add Resident'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Notification Modal */}
            {showNotificationModal && selectedResident && (
              <div className="modal-overlay">
                <div className="modal">
                  <div className="modal-header">
                    <h3>Send Notification to {selectedResident.fullName}</h3>
                    <button onClick={() => {
                      setShowNotificationModal(false);
                      setSelectedResident(null);
                      setNotificationData({
                        type: 'parcel',
                        title: '',
                        message: '',
                        isUrgent: false
                      });
                    }}>×</button>
                  </div>
                  
                  <form onSubmit={handleSendNotification} className="notification-form">
                    <div className="resident-info">
                      <div className="resident-details">
                        {selectedResident.imageUrl && (
                          <img 
                            src={selectedResident.imageUrl} 
                            alt={selectedResident.fullName}
                            className="modal-resident-image"
                          />
                        )}
                        <div>
                          <strong>{selectedResident.fullName}</strong>
                          <p>Room {selectedResident.roomNumber}, Floor {selectedResident.floor}</p>
                          <p>📞 {selectedResident.phone}</p>
                        </div>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Notification Type *</label>
                      <select
                        name="type"
                        value={notificationData.type}
                        onChange={(e) => handleTypeChange(e.target.value)}
                        required
                      >
                        <option value="parcel">📦 Parcel Delivery</option>
                        <option value="visitor">👥 Visitor at Gate</option>
                        <option value="maintenance">🔧 Maintenance Notice</option>
                        <option value="general">📢 General Notice</option>
                        <option value="emergency">🚨 Emergency/Urgent</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Title *</label>
                      <input
                        type="text"
                        name="title"
                        value={notificationData.title}
                        onChange={handleNotificationInputChange}
                        required
                        placeholder="Notification title"
                      />
                    </div>

                    <div className="form-group">
                      <label>Message *</label>
                      <textarea
                        name="message"
                        value={notificationData.message}
                        onChange={handleNotificationInputChange}
                        required
                        rows="4"
                        placeholder="Notification message"
                        className="message-textarea"
                      />
                    </div>

                    <div className="form-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          name="isUrgent"
                          checked={notificationData.isUrgent}
                          onChange={handleNotificationInputChange}
                        />
                        🚨 Mark as Urgent
                      </label>
                    </div>

                    <div className="form-actions">
                      <button 
                        type="button" 
                        onClick={() => {
                          setShowNotificationModal(false);
                          setSelectedResident(null);
                        }}
                      >
                        Cancel
                      </button>
                      <button type="submit" disabled={loading}>
                        {loading ? 'Sending...' : '📞 Send Notification'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}


            {/* Residents List */}
            {loading ? (
              <div className="loading">Loading residents...</div>
            ) : (
              <div className="residents-table-container">
                <table className="residents-table">
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Name</th>
                      <th>Username</th>
                      <th>Password</th>
                      <th>Room</th>
                      <th>Floor</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Vehicle</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {residents.map(resident => (
                      <tr key={resident._id}>
                        <td>
                          <div className="table-avatar" title={resident.imageUrl ? `Image URL: ${resident.imageUrl}` : 'No image provided'}>
                            {resident.imageUrl ? (
                              <img 
                                src={resident.imageUrl} 
                                alt={resident.fullName}
                                className="table-avatar-image"
                                title={`${resident.fullName}'s Profile Image - Click to view full size`}
                                onClick={() => window.open(resident.imageUrl, '_blank')}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div 
                              className="table-avatar-placeholder" 
                              style={{ display: resident.imageUrl ? 'none' : 'flex' }}
                              title={`${resident.fullName} - No image provided`}
                            >
                              {resident.fullName?.charAt(0).toUpperCase()}
                            </div>
                          </div>
                        </td>
                        <td>{resident.fullName}</td>
                        <td>{resident.username}</td>
                        <td>
                          <div className="password-cell">
                            <span className="password-display">
                              {resident.plainTextPassword || 'N/A'}
                            </span>
                            <button 
                              className="copy-password-btn"
                              onClick={() => {
                                navigator.clipboard.writeText(resident.plainTextPassword || '');
                                setSuccess(`Password copied for ${resident.fullName}!`);
                              }}
                              title="Copy password to clipboard"
                            >
                              📋
                            </button>
                          </div>
                        </td>
                        <td>{resident.roomNumber}</td>
                        <td>{resident.floor}</td>
                        <td>{resident.email}</td>
                        <td>{resident.phone}</td>
                        <td>
                          {resident.vehicleDetails?.hasVehicle ? (
                            <span className="vehicle-info">
                              {resident.vehicleDetails.vehicleType} ({resident.vehicleDetails.vehicleNumber})
                            </span>
                          ) : (
                            <span className="no-vehicle">No Vehicle</span>
                          )}
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              onClick={() => handleNotifyResident(resident)}
                              className="notify-btn"
                              title={`Send notification to ${resident.fullName}`}
                            >
                              📞 Notify
                            </button>
                            <button
                              onClick={() => handleDeleteResident(resident._id, resident.fullName)}
                              className="delete-btn"
                              title={`Delete ${resident.fullName} permanently`}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Sent Notifications Tab */}
        {activeTab === 'sent-notifications' && (
          <div className="sent-notifications-tab">
            <h2>Sent Messages & Responses</h2>
            
            {loading ? (
              <div className="loading">Loading sent messages...</div>
            ) : sentNotifications.length === 0 ? (
              <div className="no-notifications">
                <div className="no-notifications-icon">📬</div>
                <h3>No messages sent yet</h3>
                <p>Messages sent to residents will appear here with their responses.</p>
              </div>
            ) : (
              <div className="sent-notifications-list">
                {sentNotifications.map(notification => {
                  console.log('Rendering notification:', notification);
                  try {
                    return (
                      <div key={notification._id} className="sent-notification-item">
                        <div className="sent-notification-header">
                          <div className="notification-type">
                            {notification.type === 'parcel' && '📦'}
                            {notification.type === 'visitor' && '👥'}
                            {notification.type === 'maintenance' && '🔧'}
                            {notification.type === 'emergency' && '🚨'}
                            {notification.type === 'general' && '📢'}
                            <span className="notification-title">{notification.title || 'No title'}</span>
                          </div>
                          <div className="notification-recipient">
                            To: <strong>{notification.recipient?.fullName || 'Unknown'}</strong> (Room {notification.recipient?.roomNumber || 'N/A'})
                          </div>
                        </div>
                        
                        <div className="sent-notification-message">
                          {notification.message || 'No message'}
                        </div>
                        
                        <div className="sent-notification-footer">
                          <div className="sent-info">
                            <span className="sent-time">
                              Sent: {notification.createdAt ? formatDate(notification.createdAt) : 'Unknown date'}
                            </span>
                            {notification.isUrgent && (
                              <span className="urgent-badge">URGENT</span>
                            )}
                          </div>
                          
                          <div className="response-section">
                            {notification.hasResponse ? (
                              <div className="response-received">
                                <span className={`response-status ${notification.response}`}>
                                  {notification.response === 'coming' ? '👍 Coming' : '🙅 Not Coming'}
                                </span>
                                <span className="response-time-info">
                                  Responded: {notification.responseAt ? formatDate(notification.responseAt) : 'Unknown date'}
                                </span>
                              </div>
                            ) : notification.isRead ? (
                              <span className="read-indicator">
                                👁️ Read (no response)
                              </span>
                            ) : (
                              <span className="unread-indicator">
                                📬 Sent (unread)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  } catch (error) {
                    console.error('Error rendering notification:', notification, error);
                    return (
                      <div key={notification._id || Math.random()} className="sent-notification-item error">
                        <div className="error-message">Error displaying notification</div>
                      </div>
                    );
                  }
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
