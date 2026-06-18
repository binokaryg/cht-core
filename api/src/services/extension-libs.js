const db = require('../db');
const messageUtils = require('@medic/message-utils');

const { DOC_IDS } = require('@medic/constants');
const DOC_ID = DOC_IDS.EXTENSION_LIBS;

let evaluatedCache;

const getLibsDoc = () => {
  return db.medic.get(DOC_ID, { attachments: true })
    .catch(err => {
      if (err.status === 404) {
        // no doc means no configured libs
        return;
      }
      throw err;
    });
};

const formatResult = (name, attachment) => {
  return {
    name,
    data: attachment.data,
    contentType: attachment.content_type
  };
};

module.exports = {
  isLibChange: (change) => (change && change.id) === DOC_ID,
  getAll: async () => {
    const doc = await getLibsDoc();
    if (!doc || !doc._attachments) {
      return [];
    }
    return Object.entries(doc._attachments).map(([ name, attachment ]) => formatResult(name, attachment));
  },
  get: async (name) => {
    const doc = await getLibsDoc();
    const attachment = doc && doc._attachments && doc._attachments[name];
    if (attachment) {
      return formatResult(name, attachment);
    }
  },
  // Returns the extension-libs compiled into a `{ libId: export }` map for use as custom message
  // helpers. Cached until `clearCache()` is called (on a change to the extension-libs doc).
  getAllEvaluated: async () => {
    if (!evaluatedCache) {
      const libs = await module.exports.getAll();
      const decoded = libs.map(({ name, data }) => ({ name, code: Buffer.from(data, 'base64').toString('utf8') }));
      evaluatedCache = messageUtils.compileExtensionLibs(decoded);
    }
    return evaluatedCache;
  },
  clearCache: () => {
    evaluatedCache = undefined;
  }
};
