# Attendance Tracking System

A full-stack attendance tracking application with Node.js backend and React frontend.

## Features
- Track attendance for multiple people across multiple events
- Mark attendance as Present, Absent, or Excused
- Support for employee hire/end dates
- Department-based reporting
- Export reports to CSV
- Bulk import for people and events

## Setup

### Prerequisites
- Node.js (v16 or higher)
- npm

### Installation

1. Install backend dependencies:
```bash
cd backend
npm install
```

2. Install frontend dependencies:
```bash
cd frontend
npm install
```

### Running the Application

1. Start the backend server (Terminal 1):
```bash
cd backend
npm start
```

2. In a new terminal, start the frontend (Terminal 2):
```bash
cd frontend
npm start
```

3. Open http://localhost:3000 in your browser

## Database

The application uses SQLite for data storage. The database file (`attendance.db`) is created automatically in the backend directory.

### Backup
Simply copy the `attendance.db` file to back up your data.

## Deployment

See the setup guide for deployment instructions to VPS, Railway, or Docker.
