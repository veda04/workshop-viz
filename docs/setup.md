# Setup Guide

## Prerequisites
- Python 3.x installed
- Node.js and npm installed
- Git (optional, for version control)

## 1. Python Environment Setup

### Activate Virtual Environment
```sh
.\venv\Scripts\Activate.ps1
```

**Note:** If you encounter a PowerShell execution policy error, run this command first:
```sh
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```
Then retry the activation command above.

## 2. Backend Setup (Django)

Navigate to the backend directory and install dependencies:
```sh
cd backend
pip install -r requirements.txt
```

Run database migrations:
```sh
python manage.py migrate
```

Start the Django development server:
```sh
python manage.py runserver
```

The backend will be available at `http://localhost:8000`

## 3. Frontend Setup (React)

In a new terminal window, navigate back to the project root and install React dependencies:
```sh
npm install
```

Start the React development server:
```sh
npm start
```

The frontend will be available at `http://localhost:3000`

## Troubleshooting

- Make sure both servers are running simultaneously for the application to work properly
- If you encounter port conflicts, check if other applications are using ports 8000 or 3000
- Ensure your virtual environment is activated before running Python commands