# PG Management Backend

Node.js/Express backend for PG (Paying Guest) Management System.

## 📁 Project Structure

```
backend/
├── config/              # Configuration files
│   └── db.js           # Database connection
├── controllers/         # Route controllers
│   └── userController.js
├── middleware/          # Custom middleware
│   ├── auth.js         # Authentication middleware
│   ├── errorHandler.js # Error handling
│   ├── rateLimiter.js  # Rate limiting
│   └── validate.js     # Validation middleware
├── models/              # Database models
│   └── User.js
├── routes/              # API routes
│   └── userRoutes.js
├── utils/               # Utility functions
│   ├── ApiResponse.js  # Standardized API responses
│   └── asyncHandler.js # Async error handling
├── validation/          # Validation rules
│   └── userValidation.js
├── logs/                # Application logs
├── .env.example         # Environment variables template
├── .gitignore          # Git ignore rules
├── package.json        # Dependencies
└── server.js           # Application entry point
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and update the values:
   - `MONGODB_URI`: Your MongoDB connection string
   - `JWT_SECRET`: Your secret key for JWT
   - `PORT`: Server port (default: 5000)

4. **Start the server**
   
   Development mode:
   ```bash
   npm run dev
   ```
   
   Production mode:
   ```bash
   npm start
   ```

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5000 |
| `NODE_ENV` | Environment mode | development |
| `MONGODB_URI` | MongoDB connection string | - |
| `JWT_SECRET` | JWT secret key | - |
| `JWT_EXPIRE` | JWT expiration time | 7d |
| `CORS_ORIGIN` | Allowed CORS origin | http://localhost:3000 |

## 🛠️ Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon

## 📚 API Endpoints

### Health Check
- `GET /health` - Server health check

### Users (Example)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user (protected)
- `DELETE /api/users/:id` - Delete user (protected)

## 🔒 Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: Prevent API abuse
- **JWT Authentication**: Secure authentication
- **Input Validation**: Express-validator
- **Error Handling**: Centralized error handling

## 🏗️ Architecture

### Middleware Stack
1. Helmet (Security headers)
2. CORS (Cross-origin requests)
3. Compression (Response compression)
4. Morgan (Logging)
5. Express JSON/URL-encoded parsers
6. Rate Limiting (API abuse prevention)
7. Custom middleware (auth, validation, etc.)

### Error Handling
- Centralized error handler
- Async error catching
- Mongoose error formatting
- Development/Production error responses

### Response Format
All API responses follow a standardized format:

**Success Response:**
```json
{
  "success": true,
  "message": "Success message",
  "data": {}
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error message",
  "errors": []
}
```

## 📦 Dependencies

### Production
- **express**: Web framework
- **mongoose**: MongoDB ODM
- **dotenv**: Environment variables
- **cors**: CORS middleware
- **bcryptjs**: Password hashing
- **jsonwebtoken**: JWT authentication
- **express-validator**: Input validation
- **morgan**: HTTP logger
- **helmet**: Security headers
- **express-rate-limit**: Rate limiting
- **compression**: Response compression

### Development
- **nodemon**: Auto-restart server

## 🔄 Next Steps

1. Customize the User model according to your needs
2. Add more models (Room, Booking, Payment, etc.)
3. Create controllers for each model
4. Define routes for all endpoints
5. Add authentication logic (register, login, logout)
6. Implement authorization (role-based access)
7. Add file upload functionality
8. Set up email notifications
9. Add API documentation (Swagger)
10. Write tests

## 📄 License

ISC

## 👨‍💻 Author

Your Name
