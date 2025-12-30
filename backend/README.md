# Focus Forge Backend

Node.js + Express backend with MongoDB and JWT authentication.

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB running locally on `mongodb://localhost:27017`

### Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Update `.env` with your configuration:
```
MONGODB_URI=mongodb://localhost:27017/focus-forge
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
PORT=5000
NODE_ENV=development
```

### Running the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication

#### Signup
- **POST** `/api/auth/signup`
- Body:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "fullName": "John Doe"
}
```
- Response:
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "fullName": "John Doe"
  }
}
```

#### Login
- **POST** `/api/auth/login`
- Body:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
- Response: (same as signup)

#### Get Current User
- **GET** `/api/auth/me`
- Headers: `Authorization: Bearer jwt_token_here`
- Response:
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "fullName": "John Doe"
  }
}
```

## Database Schema

### User Model
```javascript
{
  email: String (unique, required),
  password: String (hashed, required),
  fullName: String (required),
  createdAt: Date,
  updatedAt: Date
}
```

## Notes

- Passwords are hashed using bcryptjs with 10 salt rounds
- JWT tokens expire after 7 days
- CORS is configured to allow requests from `http://localhost:8080`
