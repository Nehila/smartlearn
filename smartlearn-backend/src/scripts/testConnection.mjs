import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/database.mjs';
import { User, Course, Progress, Quiz, Note, StudyPlan } from '../models/index.mjs';

// Load environment variables
dotenv.config();

async function testConnection() {
  try {
    console.log('🧪 Testing MongoDB connection...\n');

    // Connect to database
    await connectDB();

    console.log('\n📊 Testing Models...\n');

    // Test each model
    const models = [
      { name: 'User', model: User },
      { name: 'Course', model: Course },
      { name: 'Progress', model: Progress },
      { name: 'Quiz', model: Quiz },
      { name: 'Note', model: Note },
      { name: 'StudyPlan', model: StudyPlan },
    ];

    for (const { name, model } of models) {
      try {
        await model.countDocuments();
        console.log(`✅ ${name} model: OK`);
      } catch (error) {
        console.error(`❌ ${name} model: FAILED`, error.message);
      }
    }

    console.log('\n📈 Database Statistics:\n');

    // Get collection stats
    const stats = await Promise.all(
      models.map(async ({ name, model }) => {
        const count = await model.countDocuments();
        return { name, count };
      })
    );

    stats.forEach(({ name, count }) => {
      console.log(`   ${name}: ${count} documents`);
    });

    console.log('\n✅ All tests passed! Database connection is working correctly.\n');

    // Close connection
    await mongoose.connection.close();
    console.log('🔌 Connection closed');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testConnection();
