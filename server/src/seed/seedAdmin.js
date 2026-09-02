/**
 * Seed script — Creates an initial admin user.
 *
 * Run: npm run seed:admin
 *
 * Credentials are read from environment variables:
 *   ADMIN_EMAIL     (required)
 *   ADMIN_PASSWORD  (required)
 *   ADMIN_NAME      (optional, defaults to "ARTIMAS Tech Team")
 *
 * Never hardcode admin credentials.
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const connectDB = require('../config/db');
const Admin = require('../models/Admin');

const seedAdmin = async () => {
  try {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    const name = process.env.ADMIN_NAME || 'ARTIMAS Tech Team';

    if (!email || !password) {
      console.error('✖ ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env');
      console.error('  Example:');
      console.error('    ADMIN_EMAIL=admin@artimas.in');
      console.error('    ADMIN_PASSWORD=your-secure-password');
      process.exit(1);
    }

    if (password.length < 6) {
      console.error('✖ ADMIN_PASSWORD must be at least 6 characters');
      process.exit(1);
    }

    await connectDB();

    // Check if admin already exists
    const existing = await Admin.findOne({ email });
    if (existing) {
      existing.passwordHash = password;
      await existing.save();
      console.log(`✦ Admin user updated successfully with new password (${email})`);
      process.exit(0);
    }

    const admin = await Admin.create({
      name,
      email,
      passwordHash: password, // Will be hashed by the pre-save hook
      role: 'ADMIN',
    });

    console.log('✦ Admin user created successfully:');
    console.log(`   Name:  ${admin.name}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role:  ${admin.role}`);

    process.exit(0);
  } catch (error) {
    console.error('✖ Seed error:', error.message);
    process.exit(1);
  }
};

seedAdmin();
