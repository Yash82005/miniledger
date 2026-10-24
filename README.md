# MiniLedger

MiniLedger is a mobile loan-tracking application built using React Native, Expo, Node.js, Express, TypeScript, and PostgreSQL.

## Features

- Phone number login using mock OTP authentication
- JWT-based authentication
- Add loans with friend name, amount, and due date
- View all loans
- Highlight overdue loans
- Mark loans as repaid
- Dashboard with total lent, repaid, and overdue amounts
- PostgreSQL database integration

## Tech Stack

### Frontend
- React Native
- Expo
- TypeScript

### Backend
- Node.js
- Express.js
- TypeScript
- PostgreSQL
- JWT Authentication

## Project Structure

```text
miniledger/
├── backend/
├── mobile/
├── screenshots/
├── .gitignore
└── README.md
```

## Backend Setup

1. Navigate to the backend directory:

```bash
cd backend
npm install
```

2. Create a `.env` file containing your local database configuration and JWT secret.

3. Create the required PostgreSQL database and tables using the project's database schema.

4. Start the backend:

```bash
npm run dev
```

The API runs on port 5000 by default.

## Mobile Setup

1. Navigate to the mobile directory:

```bash
cd mobile
npm install
```

2. Configure the backend API address in `src/api.ts`.

For testing on a physical Android device, use your computer's local network IP address.

3. Start Expo:

```bash
npx expo start --tunnel ngrok
```

4. Scan the QR code using Expo Go.

## Authentication

MiniLedger uses mock OTP authentication.

When a user requests an OTP, the backend generates a six-digit code and prints it in the backend terminal.

Enter this code in the mobile application to log in.

No SMS service is required.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/send-otp` | Generate mock OTP |
| POST | `/api/auth/verify-otp` | Verify OTP |
| GET | `/api/loans` | Get user loans |
| POST | `/api/loans` | Add loan |
| PATCH | `/api/loans/:id/repay` | Mark loan repaid |
| GET | `/api/summary` | Get dashboard totals |

## Screenshots

Add screenshots of the login screen, dashboard, loan form, and overdue highlighting in the `screenshots` folder.

## Author

Yash Tomar