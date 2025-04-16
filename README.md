# Referral Investment Platform API

This is the backend API for the Referral Investment Platform built with Node.js, Express, and MongoDB.

## Development Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file with the following variables:
   ```
   PORT=8000
   MONGODB_URI=mongodb://localhost:27017/referral-platform
   JWT_SECRET=your_jwt_secret_key
   FRONTEND_URL=http://localhost:3000
   ```

3. Start the development server:
   ```
   npm run dev
   ```

## Production Deployment

### Platform Options
- **Render**: [Deploy Node.js service on Render](https://render.com/docs/deploy-node-express-app)
- **Railway**: [Deploy on Railway](https://railway.app/new)
- **Heroku**: [Deploy on Heroku](https://devcenter.heroku.com/articles/deploying-nodejs)

### Required Environment Variables
| Variable | Description | Example |
|----------|-------------|---------|
| MONGODB_URI | MongoDB connection string | mongodb+srv://user:pass@cluster.mongodb.net/db |
| JWT_SECRET | Secret key for JWT tokens | a-strong-random-secret-key |
| FRONTEND_URL | URL of the frontend app | https://your-frontend-app.vercel.app |
| PORT | Port for the server | 8000 |

## API Documentation

### Authentication Routes
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/verify` - Verify JWT token

### User Routes
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `GET /api/user/dashboard` - Get user dashboard stats

### Investment Routes
- `GET /api/investment/plans` - Get all investment plans
- `POST /api/investment` - Create a new investment
- `GET /api/investment/user` - Get user investments

### Withdrawal Routes
- `GET /api/withdrawal/balance` - Get withdrawable balance
- `POST /api/withdrawal` - Request a withdrawal
- `GET /api/withdrawal` - Get all user withdrawals

### Admin Routes
- `GET /api/admin/users` - Get all users
- `GET /api/admin/investments` - Get all investments
- `PUT /api/admin/investment/:id` - Update investment status
- `GET /api/admin/withdrawals` - Get all withdrawals
- `PUT /api/admin/withdrawal/:id` - Process withdrawal

## Folder Structure
```
backend/
├── config/               # Database and app configuration
├── controllers/          # API controllers
├── middleware/           # Express middleware
├── models/               # Mongoose models
├── routes/               # API routes
├── services/             # Business logic
├── utils/                # Utility functions
├── validation/           # Input validation
├── .env                  # Environment variables (not versioned)
└── server.js             # Entry point
``` 