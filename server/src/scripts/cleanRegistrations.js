/**
 * Data Migration & Optimization Script
 *
 * Cleans up all existing registrations in MongoDB Atlas:
 * 1. Promotes primary participant (team leader) contact details to top level:
 *    leadName, leadEmail, leadPhone, leadCollege, leadYear, leadBranch
 * 2. Structures members into a clean array: [{ name, email, phone, college, year, branch, isPccoe }]
 * 3. Adds top-level memberCount and isPccoe flag
 * 4. Normalizes payment fields: amount, transactionId, screenshotUrl, status
 * 5. Removes non-useful clutter:
 *    - __v (version key)
 *    - submissionToken (for all non-CTF events)
 *    - emailStatus / emailError / emailSentAt (no more "FAILED" indicators)
 *    - eligibility nested object (now cleanly represented as isPccoe & memberCount)
 *    - payment.reason & payment.screenshotPublicId
 *    - empty verification objects
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const extractPccoeBatch = (email) => {
  if (!email || typeof email !== 'string') return null;
  const trimmed = email.trim().toLowerCase();
  if (!trimmed.endsWith('@pccoepune.org')) return null;
  const localPart = trimmed.split('@')[0];
  const match = localPart.match(/(\d{2})$/);
  return match ? match[1] : null;
};

const isEmailPccoe = (email) => {
  const batch = extractPccoeBatch(email);
  return ['23', '24', '25', '26'].includes(batch);
};

const cleanRegistrations = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await connectDB();

    const collection = mongoose.connection.collection('registrations');
    const totalCount = await collection.countDocuments();
    console.log(`Found ${totalCount} registrations in database.`);

    if (totalCount === 0) {
      console.log('No registrations to clean.');
      process.exit(0);
    }

    const cursor = collection.find({});
    let updatedCount = 0;

    while (await cursor.hasNext()) {
      const doc = await cursor.next();

      // Determine participants list from participantData or members
      const rawList = Array.isArray(doc.participantData)
        ? doc.participantData
        : Array.isArray(doc.members)
        ? doc.members
        : doc.participantData
        ? [doc.participantData]
        : [];

      const lead = rawList[0] || {};
      const m2 = rawList[1] || {};
      const m3 = rawList[2] || {};
      const m4 = rawList[3] || {};

      const leadName = lead.name || doc.teamName || 'Participant';
      const leadEmail = lead.email ? String(lead.email).toLowerCase().trim() : '';
      const leadPhone = lead.phone ? String(lead.phone).trim() : '';
      const leadCollege = lead.college ? String(lead.college).trim() : '';
      const leadYear = lead.year ? String(lead.year).trim() : '';
      const leadBranch = lead.branch ? String(lead.branch).trim() : '';

      const cleanMembers = rawList.map((m) => {
        const email = m.email ? String(m.email).toLowerCase().trim() : '';
        return {
          name: m.name ? String(m.name).trim() : '',
          email,
          phone: m.phone ? String(m.phone).trim() : '',
          college: m.college ? String(m.college).trim() : '',
          year: m.year ? String(m.year).trim() : '',
          branch: m.branch ? String(m.branch).trim() : '',
          isPccoe: isEmailPccoe(email),
        };
      });

      const memberCount = cleanMembers.length || 1;
      const isPccoe = cleanMembers.length > 0 && cleanMembers.every((m) => m.isPccoe);

      const teamSummary = cleanMembers
        .map((m, i) => `${i + 1}. ${m.name} (${m.phone || 'N/A'}, ${m.email || 'N/A'}, ${m.college || 'N/A'})`)
        .join(' | ');

      // Payment normalization
      const rawPayment = doc.payment || {};
      const amount = typeof rawPayment.amount === 'number' ? rawPayment.amount : doc.amount || 0;
      const transactionId = (rawPayment.transactionId || doc.transactionId || '').trim() || undefined;
      const screenshotUrl = (rawPayment.screenshotUrl || doc.screenshotUrl || '').trim() || undefined;

      let paymentStatus = 'NOT_REQUIRED';
      if (isPccoe) {
        paymentStatus = 'FREE_PCCOE';
      } else if (amount > 0) {
        paymentStatus = rawPayment.status || (doc.status === 'APPROVED' ? 'APPROVED' : 'PENDING');
      }

      const updateFields = {
        leadName,
        leadEmail,
        leadPhone,
        leadCollege,
        leadYear,
        leadBranch,
        memberCount,
        isPccoe,
        teamMembersSummary: teamSummary,

        // Member 2
        member2Name: m2.name ? String(m2.name).trim() : '',
        member2Email: m2.email ? String(m2.email).toLowerCase().trim() : '',
        member2Phone: m2.phone ? String(m2.phone).trim() : '',
        member2College: m2.college ? String(m2.college).trim() : '',
        member2Year: m2.year ? String(m2.year).trim() : '',
        member2Branch: m2.branch ? String(m2.branch).trim() : '',

        // Member 3
        member3Name: m3.name ? String(m3.name).trim() : '',
        member3Email: m3.email ? String(m3.email).toLowerCase().trim() : '',
        member3Phone: m3.phone ? String(m3.phone).trim() : '',
        member3College: m3.college ? String(m3.college).trim() : '',
        member3Year: m3.year ? String(m3.year).trim() : '',
        member3Branch: m3.branch ? String(m3.branch).trim() : '',

        // Member 4
        member4Name: m4.name ? String(m4.name).trim() : '',
        member4Email: m4.email ? String(m4.email).toLowerCase().trim() : '',
        member4Phone: m4.phone ? String(m4.phone).trim() : '',
        member4College: m4.college ? String(m4.college).trim() : '',
        member4Year: m4.year ? String(m4.year).trim() : '',
        member4Branch: m4.branch ? String(m4.branch).trim() : '',

        members: cleanMembers,
        participantData: cleanMembers,
        amount,
        payment: {
          amount,
          status: paymentStatus,
          ...(transactionId ? { transactionId } : {}),
          ...(screenshotUrl ? { screenshotUrl } : {}),
        },
      };

      if (transactionId) updateFields.transactionId = transactionId;
      if (screenshotUrl) updateFields.screenshotUrl = screenshotUrl;

      // Fields to remove from top level
      const unsetFields = {
        __v: '',
        eligibility: '',
        emailStatus: '',
        emailError: '',
        emailSentAt: '',
      };

      // Only CTF event keeps submissionToken
      if (doc.eventSlug !== 'capture-the-flag') {
        unsetFields.submissionToken = '';
      }

      if (!doc.verification || Object.keys(doc.verification).length === 0 || !doc.verification.verifiedBy) {
        unsetFields.verification = '';
      }

      await collection.updateOne(
        { _id: doc._id },
        {
          $set: updateFields,
          $unset: unsetFields,
        }
      );

      // Sync into event-specific collection (e.g. registrations_datathon)
      const eventColName = `registrations_${String(doc.eventSlug || 'general').toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      const eventCollection = mongoose.connection.collection(eventColName);
      const cleanDocForEvent = {
        _id: doc._id,
        registrationId: doc.registrationId,
        eventId: doc.eventId,
        eventSlug: doc.eventSlug,
        eventName: doc.eventName,
        teamName: doc.teamName,
        ...updateFields,
        status: doc.status || 'CONFIRMED',
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      };

      await eventCollection.updateOne(
        { registrationId: doc.registrationId },
        { $set: cleanDocForEvent },
        { upsert: true }
      );

      updatedCount++;
    }

    console.log(`\n✦ Successfully cleaned & optimized ${updatedCount} registrations in MongoDB Atlas!`);
    console.log('✦ Synced into dedicated event collections:');
    console.log('  • registrations_datathon');
    console.log('  • registrations_pixel_perfect');
    console.log('  • registrations_prompt_relay');
    console.log('  • registrations_brandathon');
    console.log('  • registrations_capture_the_flag');
    console.log('  • registrations_houdini_heist');
    console.log('  • registrations_among_us');
    console.log('  • registrations_hackmatrix');
    console.log('  • leadEmail');
    console.log('  • leadPhone');
    console.log('  • leadCollege');
    console.log('  • memberCount');
    console.log('  • isPccoe');
    console.log('  • amount');
    console.log('  • transactionId');
    console.log('  • screenshotUrl');
    console.log('  • status');
    console.log('  • members (clean array)');

    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
};

cleanRegistrations();
