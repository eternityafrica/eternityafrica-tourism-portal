# Eternity Africa Tourism Portal

A comprehensive centralized tourism portal for managing operations, bookings, marketing, HR, and finance. Features include tour package creation, real-time booking engine, role-based access, analytics, CRM integration, localization, and OTA connectivity.

## 🌍 Overview

The Eternity Africa Tourism Portal is designed to streamline tourism operations across all departments. It provides a unified platform for managing tour packages, processing bookings, analyzing performance, and maintaining customer relationships.

## ✨ Features

### Core Functionality
- **Tour Package Management**: Create, edit, and manage detailed tour packages with pricing, itineraries, and availability
- **Real-time Booking Engine**: Process bookings with instant confirmation and payment integration
- **Role-based Access Control**: Secure access for different user roles (Admin, Manager, Agent, Customer, HR, Finance, Marketing)
- **Analytics Dashboard**: Comprehensive reporting and business intelligence
- **CRM Integration**: Customer relationship management with segmentation and communication tools
- **Multi-language Support**: Localization ready for international markets

### Department-Specific Features
- **Operations**: Tour package creation, availability management, resource allocation
- **Bookings**: Real-time booking processing, confirmation system, traveler management
- **Marketing**: Customer segmentation, campaign management, performance tracking
- **HR**: User management, role assignments, staff analytics
- **Finance**: Revenue tracking, payment processing, financial reporting

### Technical Features
- **RESTful API**: Comprehensive API for all operations
- **MongoDB Database**: Scalable NoSQL database for flexible data management
- **JWT Authentication**: Secure token-based authentication
- **Email Integration**: Automated email notifications and confirmations
- **File Upload Support**: Media management for tour packages
- **Data Validation**: Comprehensive input validation using Joi

## 🚀 Getting Started

### Prerequisites
- Node.js (v16.0.0 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/eternityafrica/eternityafrica-tourism-portal.git
   cd eternityafrica-tourism-portal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration values.

4. **Start MongoDB**
   Make sure MongoDB is running on your system.

5. **Run the application**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

The server will start on `http://localhost:3000`.

## 📊 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile

### Tour Package Endpoints
- `GET /api/tours` - Get all tour packages (with filtering)
- `GET /api/tours/:id` - Get single tour package
- `POST /api/tours` - Create tour package (Admin/Manager)
- `PUT /api/tours/:id` - Update tour package (Admin/Manager)
- `DELETE /api/tours/:id` - Delete tour package (Admin)
- `GET /api/tours/featured/list` - Get featured tours

### Booking Endpoints
- `POST /api/bookings` - Create new booking
- `GET /api/bookings/my-bookings` - Get user's bookings
- `GET /api/bookings` - Get all bookings (Staff only)
- `GET /api/bookings/:id` - Get single booking
- `PATCH /api/bookings/:id/status` - Update booking status
- `POST /api/bookings/:id/notes` - Add internal notes

### User Management Endpoints
- `GET /api/users` - Get all users (Admin/HR)
- `POST /api/users` - Create user (Admin/HR)
- `PUT /api/users/:id` - Update user (Admin/HR)
- `PATCH /api/users/:id/activate` - Activate user
- `PATCH /api/users/:id/deactivate` - Deactivate user

### Analytics Endpoints
- `GET /api/analytics/dashboard` - Get dashboard overview
- `GET /api/analytics/bookings` - Get booking analytics
- `GET /api/analytics/revenue` - Get revenue analytics

### CRM Endpoints
- `GET /api/crm/customers` - Get customer profiles
- `GET /api/crm/customers/:id` - Get customer details
- `POST /api/crm/customers/:id/notes` - Add customer notes
- `GET /api/crm/segments/overview` - Get customer segments
- `POST /api/crm/campaigns` - Create marketing campaign

## 🔐 Security Features

- JWT-based authentication
- Role-based authorization
- Password hashing with bcrypt
- CORS protection
- Helmet.js security headers
- Input validation and sanitization
- Rate limiting (recommended for production)

## 🧪 Testing

```bash
# Run all tests
npm test
```

## 📁 Project Structure

```
src/
├── config/
│   └── database.js          # Database configuration
├── middleware/
│   └── auth.js              # Authentication middleware
├── models/
│   ├── User.js              # User model
│   ├── TourPackage.js       # Tour package model
│   └── Booking.js           # Booking model
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── tours.js             # Tour package routes
│   ├── bookings.js          # Booking routes
│   ├── users.js             # User management routes
│   ├── analytics.js         # Analytics routes
│   └── crm.js               # CRM routes
├── services/
│   └── emailService.js      # Email service
├── utils/
│   └── validation.js        # Input validation schemas
└── server.js                # Main application file
```

## 🔧 Configuration

### User Roles

- **Admin**: Full system access, can manage all resources
- **Manager**: Operations management, can manage tours and bookings
- **Agent**: Booking management, customer service
- **Customer**: Can browse tours and make bookings
- **HR**: Human resources management, user administration
- **Finance**: Financial reporting and revenue analytics
- **Marketing**: Customer relationship management and campaigns

## 🚀 Deployment

The application is designed to be cloud-ready with:
- Environment-based configuration
- Stateless architecture
- MongoDB Atlas compatibility
- Azure/AWS integration ready

---

**Eternity Africa Tourism Portal** - Transforming tourism management through technology