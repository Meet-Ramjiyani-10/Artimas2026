const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const Admin = require('../models/Admin');
const Event = require('../models/Event');
const Registration = require('../models/Registration');

async function seedAdmins() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not set in environment variables');
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected successfully');

    // Fetch all events from DB
    const events = await Event.find().lean();
    console.log(`Found ${events.length} events in database:`, events.map((e) => e.slug).join(', '));

    const eventBySlug = {};
    events.forEach((ev) => {
      eventBySlug[ev.slug.toLowerCase()] = ev;
    });

    // 1. Seed or Update Master Admin
    const masterEmail = (process.env.ADMIN_EMAIL || 'admin@artimas.in').toLowerCase();
    let masterAdmin = await Admin.findOne({ email: masterEmail });

    if (masterAdmin) {
      masterAdmin.role = 'MASTER_ADMIN';
      masterAdmin.username = 'admin';
      masterAdmin.eventId = null;
      masterAdmin.eventSlug = null;
      masterAdmin.eventName = null;
      await masterAdmin.save();
      console.log(`✔ Updated Master Admin: ${masterAdmin.email} (role: MASTER_ADMIN, username: admin)`);
    } else {
      masterAdmin = new Admin({
        name: 'ARTIMAS Master Admin',
        email: masterEmail,
        username: 'admin',
        passwordHash: process.env.ADMIN_PASSWORD || 'admin_artimas2026',
        role: 'MASTER_ADMIN',
        eventId: null,
        eventSlug: null,
        eventName: null,
      });
      await masterAdmin.save();
      console.log(`✔ Created Master Admin: ${masterAdmin.email} (username: admin)`);
    }

    // 2. Define Event Admins config matching the actual 8 events
    const eventAdminConfigs = [
      {
        slug: 'datathon',
        name: 'Datathon Admin',
        email: 'datathon@artimas.in',
        username: 'datathon',
        password: 'datathon_0987654321',
      },
      {
        slug: 'pixel-perfect',
        name: 'Pixel Perfect Admin',
        email: 'pixelperfect@artimas.in',
        username: 'pixel-perfect',
        password: 'pixel-perfect_0987654321',
      },
      {
        slug: 'prompt-relay',
        name: 'Prompt Relay Admin',
        email: 'promptrelay@artimas.in',
        username: 'prompt-relay',
        password: 'prompt-relay_0987654321',
      },
      {
        slug: 'brandathon',
        name: 'Brandathon Admin',
        email: 'brandathon@artimas.in',
        username: 'brandathon',
        password: 'brandathon_0987654321',
      },
      {
        slug: 'capture-the-flag',
        name: 'Capture the Flag Admin',
        email: 'ctf@artimas.in',
        username: 'capture-the-flag',
        password: 'capture-the-flag_0987654321',
      },
      {
        slug: 'houdini-heist',
        name: 'Houdini Heist Admin',
        email: 'houdini@artimas.in',
        username: 'houdini-heist',
        password: 'houdini-heist_0987654321',
      },
      {
        slug: 'among-us',
        name: 'Among Us Admin',
        email: 'amongus@artimas.in',
        username: 'among-us',
        password: 'among-us_0987654321',
      },
      {
        slug: 'hackmatrix',
        name: 'HackMatrix Admin',
        email: 'hackmatrix@artimas.in',
        username: 'hackmatrix',
        password: 'hackmatrix_0987654321',
      },
    ];

    for (const conf of eventAdminConfigs) {
      const eventDoc = eventBySlug[conf.slug];
      if (!eventDoc) {
        console.warn(`✖ Warning: Event with slug '${conf.slug}' not found in DB`);
        continue;
      }

      let adminDoc = await Admin.findOne({
        $or: [{ email: conf.email }, { username: conf.username }, { eventSlug: conf.slug }],
      });

      if (adminDoc) {
        adminDoc.name = conf.name;
        adminDoc.email = conf.email;
        adminDoc.username = conf.username;
        adminDoc.role = 'EVENT_ADMIN';
        adminDoc.eventId = eventDoc._id;
        adminDoc.eventSlug = eventDoc.slug;
        adminDoc.eventName = eventDoc.name;
        adminDoc.passwordHash = conf.password; // pre-save hook will hash if modified
        await adminDoc.save();
        console.log(`✔ Updated Event Admin for ${eventDoc.name} [${conf.username}]`);
      } else {
        adminDoc = new Admin({
          name: conf.name,
          email: conf.email,
          username: conf.username,
          passwordHash: conf.password, // pre-save hook will hash
          role: 'EVENT_ADMIN',
          eventId: eventDoc._id,
          eventSlug: eventDoc.slug,
          eventName: eventDoc.name,
        });
        await adminDoc.save();
        console.log(`✔ Created Event Admin for ${eventDoc.name} [${conf.username}]`);
      }
    }

    // 3. Backfill existing registrations with verified flag
    const unbackfilledCount = await Registration.countDocuments({ verified: { $exists: false } });
    if (unbackfilledCount > 0) {
      console.log(`Backfilling ${unbackfilledCount} registrations with 'verified' flag...`);
      await Registration.updateMany(
        { verified: { $exists: false }, status: 'APPROVED' },
        { $set: { verified: true } }
      );
      await Registration.updateMany(
        { verified: { $exists: false } },
        { $set: { verified: false } }
      );
      console.log('✔ Registrations backfilled successfully');
    }

    // Print summary
    const allAdmins = await Admin.find().lean();
    console.log('\n================ Current Admins in System ================');
    allAdmins.forEach((a, idx) => {
      console.log(
        `${idx + 1}. [${a.role}] username: '${a.username || a.email}', event: '${a.eventName || 'ALL'}', email: '${a.email}'`
      );
    });
    console.log('==========================================================\n');

    await mongoose.disconnect();
    console.log('Seeding completed.');
  } catch (error) {
    console.error('Error seeding admins:', error);
    process.exit(1);
  }
}

seedAdmins();
