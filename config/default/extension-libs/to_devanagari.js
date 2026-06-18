/**
 * Extension-lib: convert ASCII digits in a string to Devanagari numerals.
 *
 * Uploaded by cht-conf (`upload-extension-libs`) as an attachment named `to_devanagari.js` on the
 * `extension-libs` doc. The file extension is stripped to form the helper name, so it can be used in
 * translations and outgoing messages as a Mustache section helper:
 *
 *   {{#to_devanagari}}{{patient_id}}{{/to_devanagari}}
 */
const DEVANAGARI_DIGITS = '०१२३४५६७८९';

module.exports = function(value) {
  return String(value === undefined || value === null ? '' : value)
    .replace(/[0-9]/g, digit => DEVANAGARI_DIGITS[digit]);
};
