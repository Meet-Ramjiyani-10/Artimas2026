const mongoose = require('mongoose');

/**
 * Returns a standardized collection name for an event.
 * e.g. "datathon" -> "registrations_datathon"
 * e.g. "pixel-perfect" -> "registrations_pixel_perfect"
 * e.g. "among-us" -> "registrations_among_us"
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
 * Cleans out redundant fields (eventSlug, eventName) since the collection
 * name already identifies the event.
 */
const syncToEventCollection = async (registrationDoc, slug) => {
  try {
    const eventSlug = slug || registrationDoc.eventSlug;
    if (!eventSlug) return;
    const colName = getEventCollectionName(eventSlug);
    const col = mongoose.connection.collection(colName);

    const data = typeof registrationDoc.toObject === 'function'
      ? registrationDoc.toObject()
      : { ...registrationDoc };

    delete data.__v;
    delete data.eventSlug; // Redundant: collection name is already the event!
    delete data.eventName; // Redundant: collection name is already the event!

    // Solo cleanup: no team fields on individual events
    if (!data.teamSummary) delete data.teamSummary;
    if (!data.teamName) delete data.teamName;
    if (data.members && data.members.length <= 1) delete data.members;

    await col.replaceOne(
      { registrationId: registrationDoc.registrationId },
      data,
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
