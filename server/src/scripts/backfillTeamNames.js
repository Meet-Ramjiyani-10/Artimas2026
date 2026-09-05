const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');

async function backfillTeamNames() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    const masterCol = db.collection('registrations');

    const missingDocs = await masterCol.find({
      $or: [
        { teamName: { $exists: false } },
        { teamName: null },
        { teamName: '' }
      ]
    }).toArray();

    console.log(`Found ${missingDocs.length} registrations with missing/empty teamName.`);

    let count = 0;
    for (const doc of missingDocs) {
      const fallbackName = doc.leadName || 'Participant';
      await masterCol.updateOne(
        { _id: doc._id },
        { $set: { teamName: fallbackName } }
      );

      if (doc.eventSlug) {
        const eventColName = 'registrations_' + doc.eventSlug.replace(/-/g, '_');
        const eventCol = db.collection(eventColName);
        await eventCol.updateOne(
          { registrationId: doc.registrationId },
          { $set: { teamName: fallbackName } }
        );
      }
      count++;
    }

    console.log(`Successfully updated ${count} registrations with user-typed participant name.`);
  } catch (err) {
    console.error('Error during backfill:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Database disconnected.');
  }
}

backfillTeamNames();
