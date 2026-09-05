/**
 * Data Migration & Optimization Script — Compact Event-Tailored Schema
 *
 * 1. Solo events (Among Us, Pixel Perfect, or single-member entries):
 *    - Removes teamName, teamSummary, members array, and eventSlug!
 *    - Only keeps: registrationId, leadName, leadEmail, leadPhone, leadCollege, amount, transactionId, screenshotUrl, status, createdAt
 *
 * 2. Team events (Datathon, Prompt Relay, Brandathon, CTF, Houdini Heist, HackMatrix):
 *    - Keeps teamName, leadName, leadEmail, leadPhone, leadCollege, teamSummary, members array
 *    - Removes memberCount (strict events like Houdini Heist don't need redundant counts)
 *    - Removes eventSlug
 *
 * 3. Inside event-specific collections:
 *    - Also removes eventName (the collection name already defines the event!)
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const SOLO_EVENT_SLUGS = ['among-us', 'pixel-perfect'];

const extractPccoeBatch = (email) => {
  if (!email || typeof email !== 'string') return null;
  const trimmed = email.trim().toLowerCase();
  const match = trimmed.match(/^[a-z]+(?:[-.][a-z]+)*\.([a-z-]+)(\d{1,4})@pccoepune\.org$/i);
  return match ? match[2] : null;
};

const cleanRegistrations = async () => {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await connectDB();

    const masterCollection = mongoose.connection.collection('registrations');
    const totalCount = await masterCollection.countDocuments();
    console.log(`Found ${totalCount} registrations in master collection.`);

    if (totalCount === 0) {
      console.log('No registrations found.');
      process.exit(0);
    }

    const cursor = masterCollection.find({});
    let updatedCount = 0;

    // Common fields to delete from all documents
    const baseFieldsToUnset = {
      eventSlug: '',
      memberCount: '',
      participantData: '',
      eventId: '',
      submissionToken: '',
      payment: '',
      eligibility: '',
      emailStatus: '',
      emailError: '',
      emailSentAt: '',
      verification: '',
      __v: '',
      member2Name: '',
      member2Email: '',
      member2Phone: '',
      member2College: '',
      member2Year: '',
      member2Branch: '',
      member3Name: '',
      member3Email: '',
      member3Phone: '',
      member3College: '',
      member3Year: '',
      member3Branch: '',
      member4Name: '',
      member4Email: '',
      member4Phone: '',
      member4College: '',
      member4Year: '',
      member4Branch: '',
      leadYear: '',
      leadBranch: '',
      teamMembersSummary: '',
    };

    while (await cursor.hasNext()) {
      const doc = await cursor.next();

      const rawList = Array.isArray(doc.members) && doc.members.length > 0
        ? doc.members
        : Array.isArray(doc.participantData) && doc.participantData.length > 0
        ? doc.participantData
        : [];

      const isSolo = SOLO_EVENT_SLUGS.includes(doc.eventSlug) || rawList.length <= 1;

      const lead = rawList[0] || {};
      const leadName = doc.leadName || lead.name || doc.teamName || 'Participant';
      const leadEmail = (doc.leadEmail || lead.email || '').toLowerCase().trim();
      const leadPhone = (doc.leadPhone || lead.phone || '').trim();
      const leadCollege = (doc.leadCollege || lead.college || '').trim();

      const amount = typeof doc.amount === 'number'
        ? doc.amount
        : (doc.payment && typeof doc.payment.amount === 'number')
        ? doc.payment.amount
        : 0;

      const isFree = amount === 0;
      const isPccoe = Boolean(isFree || extractPccoeBatch(leadEmail) !== null);
      const finalLeadCollege = isPccoe ? 'PCCOE' : (leadCollege || '');

      const transactionId = (doc.transactionId || doc.payment?.transactionId || '').trim() || undefined;
      const screenshotUrl = (doc.screenshotUrl || doc.payment?.screenshotUrl || '').trim() || undefined;

      const updateFields = {
        eventName: doc.eventName,
        leadName,
        leadEmail,
        leadPhone,
        leadCollege: finalLeadCollege,
        amount,
        isPccoe,
        status: doc.status || 'CONFIRMED',
      };

      const currentUnset = { ...baseFieldsToUnset };

      if (isSolo) {
        // Solo event: completely unset team fields
        currentUnset.teamName = '';
        currentUnset.teamSummary = '';
        currentUnset.members = '';
      } else {
        // Team event: populate team fields
        updateFields.teamName = doc.teamName || leadName;
        updateFields.teamSummary = rawList
          .map((m, i) => `${i + 1}. ${m.name} (${m.phone || 'No phone'})`)
          .join(' | ');

        updateFields.members = rawList.map((m) => {
          const mEmail = (m.email || '').toLowerCase().trim();
          const mIsPccoe = isPccoe || Boolean(extractPccoeBatch(mEmail) !== null);
          return {
            name: (m.name || '').trim(),
            email: mEmail,
            phone: (m.phone || '').trim(),
            college: mIsPccoe ? 'PCCOE' : ((m.college || '').trim() || ''),
            year: (m.year || '').trim(),
            branch: (m.branch || '').trim(),
          };
        });
      }

      if (transactionId) updateFields.transactionId = transactionId;
      else currentUnset.transactionId = '';

      if (screenshotUrl) updateFields.screenshotUrl = screenshotUrl;
      else currentUnset.screenshotUrl = '';

      // 1. Update master collection document
      await masterCollection.updateOne(
        { _id: doc._id },
        {
          $set: updateFields,
          $unset: currentUnset,
        }
      );

      // 2. Update event-specific collection document (also omit eventName & eventSlug)
      const getEventColName = (slug, name) => {
        if (slug) {
          return `registrations_${String(slug).toLowerCase().trim().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_')}`;
        }
        const nameMap = {
          'datathon': 'registrations_datathon',
          'pixel perfect': 'registrations_pixel_perfect',
          'among us': 'registrations_among_us',
          'capture the flag (ctf)': 'registrations_capture_the_flag',
          'capture the flag': 'registrations_capture_the_flag',
          'prompt relay': 'registrations_prompt_relay',
          'brandathon': 'registrations_brandathon',
          'houdini heist': 'registrations_houdini_heist',
          'hackmatrix': 'registrations_hackmatrix',
        };
        const lowerName = String(name || '').toLowerCase().trim();
        return nameMap[lowerName] || `registrations_${lowerName.replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_')}`;
      };

      const eventColName = getEventColName(doc.eventSlug, doc.eventName);
      const eventCol = mongoose.connection.collection(eventColName);

      const cleanEventDoc = {
        _id: doc._id,
        registrationId: doc.registrationId,
        ...updateFields,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      };

      // In the event collection, eventName is redundant
      delete cleanEventDoc.eventName;

      await eventCol.replaceOne(
        { registrationId: doc.registrationId },
        cleanEventDoc,
        { upsert: true }
      );

      updatedCount++;
    }

    console.log(`\n✦ Streamlined ${updatedCount} registrations in master & event collections!`);
    console.log('✦ Solo events (Among Us, Pixel Perfect):');
    console.log('   -> Omitted: teamName, teamSummary, members, eventSlug, memberCount');
    console.log('✦ Team events:');
    console.log('   -> Omitted: eventSlug, memberCount (Houdini Heist 3 compulsory count skipped)');
    console.log('✦ Inside Event Collections:');
    console.log('   -> Omitted: eventName & eventSlug (collection name is self-describing)');

    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
};

cleanRegistrations();
