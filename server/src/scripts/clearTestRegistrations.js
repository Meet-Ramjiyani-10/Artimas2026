const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');

async function clearTestRegistrations() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await connectDB();

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();

    // Identify all registration collections and ctfsubmissions
    const targetCollections = collections.filter(c => {
      return c.name === 'registrations' || 
             c.name.startsWith('registrations_') ||
             c.name === 'ctfsubmissions';
    });

    console.log(`Found ${targetCollections.length} target collection(s) to clear:`);

    let totalDeleted = 0;
    for (const col of targetCollections) {
      // Safety check: NEVER touch events or admins
      if (col.name === 'events' || col.name === 'admins') {
        console.log(`[PROTECTED] Skipping ${col.name}`);
        continue;
      }

      const countBefore = await db.collection(col.name).countDocuments();
      const result = await db.collection(col.name).deleteMany({});
      console.log(`- ${col.name}: deleted ${result.deletedCount} of ${countBefore} document(s) (indexes preserved)`);
      totalDeleted += result.deletedCount;
    }

    console.log(`\nSuccessfully cleared ${totalDeleted} total test document(s).`);

    // Verification check
    console.log('\nPost-cleanup verification:');
    const remainingEvents = await db.collection('events').countDocuments();
    const remainingAdmins = await db.collection('admins').countDocuments();
    const remainingRegs = await db.collection('registrations').countDocuments();

    console.log(`- events: ${remainingEvents} (intact)`);
    console.log(`- admins: ${remainingAdmins} (intact)`);
    console.log(`- registrations: ${remainingRegs} (cleared)`);

    await mongoose.disconnect();
    console.log('Database disconnected successfully.');
  } catch (err) {
    console.error('Error clearing test data:', err);
    process.exit(1);
  }
}

clearTestRegistrations();
