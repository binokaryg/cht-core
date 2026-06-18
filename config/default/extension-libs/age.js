/**
 * Extension-lib: calculate a whole-number age in years from a date of birth.
 *
 * Uploaded by cht-conf (`upload-extension-libs`) as an attachment named `age.js` on the
 * `extension-libs` doc. The file extension is stripped to form the helper name, so it can be used in
 * translations and outgoing messages as a Mustache section helper:
 *
 *   {{contact.name}} reported death of {{#age}}{{patient.date_of_birth}}{{/age}} yr old {{patient_name}}
 */
module.exports = function(dateOfBirth) {
  if (!dateOfBirth) {
    return '';
  }

  const dob = new Date(dateOfBirth);
  if (isNaN(dob.getTime())) {
    return '';
  }

  const now = new Date();
  let years = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    years--;
  }

  return String(years);
};
