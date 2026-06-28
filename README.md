# 🚀 Pro Chat – Real-Time Chat Application

A modern full-stack real-time chat application built using **Node.js**, **Express.js**, **Socket.IO**, **MongoDB**, **WebRTC**, and **Docker**.

Pro Chat enables users to securely communicate through real-time messaging, voice calling, and file sharing with a clean, responsive interface.

---

# 🌐 Live Demo

https://real-time-chat-app-production-d526.up.railway.app

---

# 📂 GitHub Repository

https://github.com/Manognacse/real-time-chat-app

---

# 📖 Project Overview

Pro Chat is a secure real-time communication platform that allows authenticated users to chat instantly, make one-to-one voice calls, share files, react to messages, and manage conversations efficiently.

The project demonstrates full-stack web development concepts including real-time communication, authentication, cloud storage integration, WebRTC signaling, Docker containerization, and cloud deployment.

---

# ✨ Features

- 🔐 JWT Authentication
- 👤 User Registration & Login
- 💬 Real-Time Messaging using Socket.IO
- 📞 One-to-One Voice Calling (WebRTC)
- 📂 File Sharing (Images, Videos & PDFs)
- ☁️ Cloudinary File Storage
- 😊 Emoji Picker
- ❤️ Message Reactions
- ↩️ Reply to Messages
- ✏️ Edit Messages
- 🗑️ Delete Messages
- 🔍 Search Messages
- 🟢 Online User Status
- 🌙 Dark Theme
- 🔔 Browser Notifications
- 🐳 Docker Support
- ☁️ Railway Deployment

---

# 🛠️ Tech Stack

## Frontend

- HTML5
- CSS3
- JavaScript

## Backend

- Node.js
- Express.js
- Socket.IO

## Database

- MongoDB Atlas
- Mongoose

## Authentication

- JSON Web Tokens (JWT)
- bcrypt.js

## File Storage

- Cloudinary
- Multer

## Voice Calling

- WebRTC

## Deployment

- Railway

## Containerization

- Docker

---

# 📁 Project Structure

```
real-time-chat-app
│
├── middleware/
├── models/
├── public/
├── uploads/
├── server.js
├── package.json
├── package-lock.json
├── Dockerfile
├── .dockerignore
├── .gitignore
└── README.md
```

---

# ⚙️ Installation

Clone the repository

```bash
git clone https://github.com/Manognacse/real-time-chat-app.git
```

Go into the project

```bash
cd real-time-chat-app
```

Install dependencies

```bash
npm install
```

Create a `.env` file

Example:

```env
PORT=3000

MONGO_URI=YOUR_MONGODB_CONNECTION_STRING

JWT_SECRET=YOUR_SECRET_KEY

OPENROUTER_API_KEY=YOUR_OPENROUTER_API_KEY

CLOUDINARY_CLOUD_NAME=YOUR_CLOUD_NAME
CLOUDINARY_API_KEY=YOUR_API_KEY
CLOUDINARY_API_SECRET=YOUR_API_SECRET
```

Start the application

```bash
npm start
```

Visit

```
http://localhost:3000
```

---

# 🐳 Docker

Build Docker Image

```bash
docker build -t real-time-chat-app .
```

Run Docker Container

```bash
docker run --env-file .env -p 3000:3000 real-time-chat-app
```

---

# 🚀 Deployment

The application is deployed on **Railway**.

Live URL:

https://real-time-chat-app-production-d526.up.railway.app

---

# 🔒 Security

Current Implementation

- JWT Authentication
- Password Hashing using bcrypt
- Protected Routes
- Environment Variables
- Secure MongoDB Atlas Connection

Future Improvements

- End-to-End Encryption
- OAuth Login
- Refresh Tokens
- Rate Limiting
- Two-Factor Authentication

---

# 🚀 Future Enhancements

- 📹 Video Calling
- 👥 Group Voice Calls
- 👨‍👩‍👧‍👦 Group Chat
- 📱 Mobile Application
- 📩 Push Notifications
- 🔐 End-to-End Encryption
- 🤖 AI Chat Assistant
- 📨 Read Receipts
- 🎥 Screen Sharing

---

# 👨‍💻 Developer

**B. Manogna**

B.Tech (Computer Science Engineering) Student

GitHub:

https://github.com/Manognacse

---

# 📄 License

This project is developed for educational and portfolio purposes.

---

⭐ If you found this project useful, consider giving it a star on GitHub!
