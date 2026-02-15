# SmartLearn Backend API

A Node.js + Express + MongoDB backend for the SmartLearn learning management platform.

## 🚀 Features

- ✅ MongoDB database connection with Mongoose ODM
- ✅ User authentication and authorization
- ✅ Course management
- ✅ Progress tracking
- ✅ Quiz generation and management
- ✅ Note-taking system
- ✅ AI-powered study plans
- ✅ RESTful API design
- ✅ CORS enabled
- ✅ Error handling middleware

## 📋 Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

## 🛠️ Installation

1. **Navigate to the backend directory:**
   ```bash
   cd smartlearn-backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

4. **Configure your environment variables in `.env`:**
   ```env
   PORT=8001
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/smartlearn
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRE=7d
   CORS_ORIGIN=http://localhost:3000
   OPENAI_API_KEY=sk-your-openai-api-key
   ```

## 🗄️ Database Setup

### Option 1: Local MongoDB

1. **Install MongoDB:**
   - macOS: `brew install mongodb-community`
   - Ubuntu: `sudo apt-get install mongodb`
   - Windows: Download from [mongodb.com](https://www.mongodb.com/try/download/community)

2. **Start MongoDB:**
   ```bash
   # macOS/Linux
   mongod --dbpath /path/to/data/directory
   
   # Or use brew services (macOS)
   brew services start mongodb-community
   ```

3. **Verify connection:**
   ```bash
   mongosh
   ```

### Option 2: MongoDB Atlas (Cloud)

1. **Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)**

2. **Create a new cluster**

3. **Get your connection string:**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password

4. **Update your `.env` file:**
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/smartlearn?retryWrites=true&w=majority
   ```

## 🏃 Running the Server

### Development mode (with auto-reload):
```bash
npm run dev
```

### Production mode:
```bash
npm start
```

The server will start on `http://localhost:8001` (or your configured PORT)

## 📊 Database Models

### User Model
- User authentication and profile management
- Learning goals and preferences
- Enrolled and completed courses
- Role-based access (student, instructor, admin)

### Course Model
- Course information and metadata
- Modules and topics
- Instructor details
- AI-generated or manual courses
- Ratings and enrollment tracking

### Progress Model
- User progress per course
- Completed modules tracking
- Time spent and current module
- Notes and quiz scores

### Quiz Model
- Multiple choice questions
- Course and module association
- AI-generated or manual quizzes
- Time limits and passing scores

### Note Model
- User notes with tagging
- Course and module association
- Archive and pin functionality
- Full-text search support

### StudyPlan Model
- AI-generated or manual study plans
- Tasks and goals
- Course associations
- Progress tracking

## 🔌 API Endpoints

### Health Check
```
GET /health
```

### API Info
```
GET /api
```

### Authentication (Coming Soon)
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
```

### Courses (Coming Soon)
```
GET    /api/courses
GET    /api/courses/:id
POST   /api/courses
PUT    /api/courses/:id
DELETE /api/courses/:id
```

### Progress (Coming Soon)
```
GET    /api/progress
GET    /api/progress/:courseId
POST   /api/progress/:courseId/module/:moduleId
```

### Quizzes (Coming Soon)
```
GET    /api/quizzes
GET    /api/quizzes/:id
POST   /api/quizzes
POST   /api/quizzes/generate
```

### Notes (Coming Soon)
```
GET    /api/notes
GET    /api/notes/:id
POST   /api/notes
PUT    /api/notes/:id
DELETE /api/notes/:id
```

### Study Plans (Coming Soon)
```
GET    /api/study-plans
GET    /api/study-plans/:id
POST   /api/study-plans
POST   /api/study-plans/generate
```

## 🧪 Testing the Connection

1. **Start the server:**
   ```bash
   npm run dev
   ```

2. **Test the health endpoint:**
   ```bash
   curl http://localhost:8001/health
   ```

   Expected response:
   ```json
   {
     "success": true,
     "message": "SmartLearn API is running",
     "timestamp": "2024-01-18T...",
     "database": "connected"
   }
   ```

3. **Check MongoDB connection in logs:**
   ```
   ✅ MongoDB Connected: localhost
   📊 Database: smartlearn
   🚀 SmartLearn API running on port 8001
   ```

## 📁 Project Structure

```
smartlearn-backend/
├── src/
│   ├── config/
│   │   └── database.mjs          # MongoDB connection
│   ├── models/
│   │   ├── User.mjs              # User model
│   │   ├── Course.mjs            # Course model
│   │   ├── Progress.mjs          # Progress tracking model
│   │   ├── Quiz.mjs              # Quiz model
│   │   ├── Note.mjs              # Note model
│   │   └── StudyPlan.mjs         # Study plan model
│   ├── controllers/              # Route controllers (to be added)
│   ├── routes/                   # API routes (to be added)
│   ├── middleware/               # Custom middleware (to be added)
│   ├── services/                 # Business logic (to be added)
│   ├── utils/                    # Utility functions (to be added)
│   └── server.mjs                # Express server setup
├── .env.example                  # Environment variables template
├── package.json                  # Dependencies and scripts
└── README.md                     # This file
```

## 🔧 Troubleshooting

### MongoDB Connection Issues

**Error: "MongooseServerSelectionError"**
- Check if MongoDB is running
- Verify your connection string in `.env`
- Check firewall settings
- For Atlas: Whitelist your IP address

**Error: "Authentication failed"**
- Verify your MongoDB username and password
- Check database user permissions

### Port Already in Use

**Error: "EADDRINUSE"**
```bash
# Find and kill the process using port 8001
lsof -ti:8001 | xargs kill -9
```

## 📝 Next Steps

1. ✅ Database connection setup
2. ⏳ Implement authentication routes
3. ⏳ Create course management endpoints
4. ⏳ Add progress tracking APIs
5. ⏳ Implement quiz functionality
6. ⏳ Add note-taking features
7. ⏳ Create study plan generation
8. ⏳ Integrate OpenAI for AI features

## 🤝 Contributing

1. Create a new branch for your feature
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

MIT License

## 📧 Support

For issues or questions, please open an issue on GitHub.
