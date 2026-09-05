const mongoose = require('mongoose');

/**
 * Returns a standardized collection name for an event.
 * e.g. "datathon" -> "registrations_datathon"
 * e.g. "pixel-perfect" -> "registrations_pixel_perfect"
 * e.g. "capture-the-flag" -> "registrations_capture_the_flag"
 */
const getEventCollectionName = (eventSlug) => {
  const safeSlug = String(eventSlug || 'general')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_');
  return `registrations_${safeSlug}`;
};

/**
 * Syncs a registration document into its dedicated event collection.
 * Uses upsert so creates and updates both stay in sync.
 */
const syncToEventCollection = async (registrationDoc) => {
  try {
    if (!registrationDoc || !registrationDoc.eventSlug) return;
    const colName = getEventCollectionName(registrationDoc.eventSlug);
    const col = mongoose.connection.collection(colName);

    const data = typeof registrationDoc.toObject === 'function'
      ? registrationDoc.toObject()
      : { ...registrationDoc };

    delete data.__v;

    await col.updateOne(
      { registrationId: registrationDoc.registrationId },
      { $set: data },
      { upsert: true }
    );
  } catch (err) {
    console.error(`✖ Error syncing to event collection for ${registrationDoc?.registrationId}:`, err.message);
  }
};

module.exports = {
  getEventCollectionName,
  syncToEventCollection,
};
