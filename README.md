# Society 360 - Smart Society Management Platform

A full-stack MERN application for managing society residents with a beautiful modern dark mode UI. The system provides role-based access control with separate interfaces for administrators and residents.

## Features

### Admin Interface (Watchman)
- Dashboard with statistics and analytics
- Add new residents with complete profile information
- **Profile image URL support** for resident photos
- **Vehicle registration** (optional) - type, number, brand, color
- **Delete residents permanently** with double confirmation
- **Password visibility** for admins to help residents with login issues
- **Copy-to-clipboard** functionality for easy credential sharing
- **Quick credentials reference** section for easy access
- **Two-way communication system**: Send notifications and receive responses
- **Sent Messages tab**: View all sent notifications with resident responses
- **Response tracking**: See if residents are "Coming" or "Not Coming"
- View all residents with vehicle information
- Create login credentials for residents

### Resident Interface
- Personal profile dashboard with **profile photo**
- **Complete notification system** to receive messages from watchman
- **Notification categories**: Parcel delivery, visitor alerts, maintenance notices, emergencies
- **Real-time notification badges** showing unread count
- **Two-way communication**: Respond with "Coming" or "Not Coming"
- **Interactive responses** instead of just "mark as read"
- View personal information and room details
- Emergency contact information
- **Vehicle information display** (if registered)
- Account status and joining date
- Quick action buttons for common tasks

## Tech Stack

### Frontend
- **React 18** with Vite
- **React Router** for navigation
- **Axios** for API calls
- **Context API** for state management
- **CSS3** with responsive design

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcrypt** for password hashing
- **CORS** for cross-origin requests

## Project Structure

```
society360/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── context/         # React contexts
│   │   ├── utils/           # Utility functions
│   │   └── hooks/           # Custom hooks
│   └── package.json
├── backend/                 # Express server
│   ├── models/              # MongoDB models
│   ├── routes/              # API routes
│   ├── middleware/          # Custom middleware
│   ├── server.js           # Main server file
│   ├── seedAdmin.js        # Admin seeder script
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- Git

### Quick Start (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd society360
   ```

2. **One-time Setup** (installs all dependencies and seeds database)
   ```bash
   npm run setup
   ```

3. **Start the Application** (starts both frontend and backend)
   ```bash
   npm run dev
   ```
   
   The application will be available on:
   - **Local Access:**
     - Frontend: http://localhost:5173
     - Backend: http://localhost:5000
   - **Network Access:** 
     - Frontend: http://[your-ip]:5173
     - Backend: http://[your-ip]:5000
   
   💡 **Perfect for demos!** Other devices on your network can access the application using your computer's IP address.

### Manual Installation (Alternative)

1. **Install Dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install backend dependencies
   cd backend && npm install
   
   # Install frontend dependencies
   cd ../frontend && npm install
   ```

2. **Environment Setup**
   
   Create a `.env` file in the backend directory:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/hostel-management
   JWT_SECRET=hostel_management_secret_key_2024
   JWT_EXPIRE=7d
   ```

3. **Database Setup**
   
   Make sure MongoDB is running, then seed the database:
   ```bash
   npm run seed-data
   ```

4. **Start the Application**
   ```bash
   npm run dev
   ```

### Available Scripts

From the root directory, you can run:

- `npm run dev` - Start both frontend and backend in development mode
- `npm run setup` - Install all dependencies and seed database with sample data
- `npm run seed-data` - Seed database with admin and sample residents
- `npm run seed-admin` - Create only the admin user
- `npm run client` - Start only the frontend
- `npm run server` - Start only the backend
- `npm run install-all` - Install dependencies for both frontend and backend
- `npm run build` - Build the frontend for production

### Network Access & Demo Setup

The application is configured to be accessible from other devices on your network, making it perfect for classroom demos!

**To access from other devices:**
1. Find your computer's IP address (shown when you run `npm run dev`)
2. Use that IP instead of localhost: `http://192.168.1.100:5173`
3. Make sure your firewall allows connections on ports 5173 and 5000

**Troubleshooting Network Access:**
- **Windows:** Allow Node.js through Windows Firewall when prompted
- **macOS:** System Preferences > Security & Privacy > Firewall > Allow connections
- **Linux:** Use `ufw allow 5173` and `ufw allow 5000`

**Demo Tips:**
- Students can scan a QR code (use online QR generator with your IP) to quickly access
- Test on mobile devices to show responsive design
- Use different browsers to demonstrate cross-platform compatibility

## Login Credentials

### Admin (Watchman)
- **Username**: watchman
- **Password**: watchman123

### Sample Residents
- **John Doe**: john_doe / password123 (Room 101)
- **Jane Smith**: jane_smith / password123 (Room 102) 
- **Mike Wilson**: mike_wilson / password123 (Room 201)
- **Emily Brown**: emily_brown / password123 (Room 202)
- **Alex Johnson**: alex_johnson / password123 (Room 301)

## Usage

### For Administrators (Watchman)

1. Login with admin credentials
2. Navigate to the Dashboard to view statistics
3. Go to "Manage Residents" to:
   - Add new residents
   - View all residents
   - Deactivate resident accounts

### For Residents

1. Use credentials provided by the administrator
2. View personal profile and account information
3. Check room details and emergency contacts

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-token` - Token verification
- `POST /api/auth/logout` - User logout

### User Management
- `POST /api/users/residents` - Create resident (Admin only)
- `GET /api/users/residents` - Get all residents (Admin only)
- `GET /api/users/residents/:id` - Get resident by ID (Admin only)
- `PUT /api/users/residents/:id` - Update resident (Admin only)
- `DELETE /api/users/residents/:id` - Deactivate resident (Admin only)
- `GET /api/users/profile` - Get current user profile
- `GET /api/users/dashboard-stats` - Get dashboard statistics (Admin only)

## Features Implemented

✅ User Authentication with JWT  
✅ Role-based Access Control (Admin/Resident)  
✅ Admin Dashboard with Statistics  
✅ Resident Management (CRUD Operations)  
✅ **Profile Image Support** (URL-based)  
✅ **Vehicle Registration & Management**  
✅ Resident Profile Interface with Photos  
✅ Vehicle Information Display  
✅ Enhanced Form Validation  
✅ Responsive Design  
✅ Error Handling  
✅ Loading States  
✅ Network Access for Demos

## Development Notes

- The application uses JWT tokens stored in localStorage for authentication
- Passwords are hashed using bcrypt before storage
- **Educational Feature**: Plain text passwords are visible to admins for demo/educational purposes
- In production environments, implement password reset functionality instead of displaying passwords
- The frontend includes comprehensive error handling and loading states
- All routes are protected with appropriate middleware
- The design is fully responsive and mobile-friendly

## Demo Purpose

This project was created as a MERN stack demonstration for educational purposes, showcasing:

- Full-stack JavaScript development
- Modern React patterns with hooks
- RESTful API design
- Database modeling with MongoDB
- Authentication and authorization
- Responsive web design

## Future Enhancements

Potential features that could be added:
- Email notifications
- Room booking system
- Maintenance requests
- Visitor management
- Payment tracking
- Mobile application

## Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Built with ❤️ using the MERN Stack**
