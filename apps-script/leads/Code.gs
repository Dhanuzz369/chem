/**
 * Goodbiz Chem — website lead capture (Google Apps Script web app).
 *
 * Receives quote-form steps from www.goodbizchemicals.com and keeps ONE row per visitor
 * (matched by leadId) in the "Leads" sheet. Emails an alert when a new lead arrives
 * (stage "contact") and when the request is completed (stage "submitted").
 *
 * Setup (details in docs/leads-apps-script.md):
 *   1. Paste this file into Extensions → Apps Script of the leads Google Sheet.
 *   2. Run setup() once and approve the permissions.
 *   3. Deploy → New deployment → Web app → Execute as: Me, Who has access: Anyone.
 *   4. Send the /exec URL to the website (NEXT_PUBLIC_LEADS_ENDPOINT).
 */

// ── Settings you may change ────────────────────────────────────────────────
var ALERT_TO = 'chemicals@goodbizglobal.com';
var SITE_URL = 'https://www.goodbizchemicals.com';
var SHEET_NAME = 'Leads';
var SUMMARY_SHEET_NAME = 'Summary';

// Abuse caps. The web address is public, so these stop a flood of fake posts from filling the
// sheet or the inbox. Counts reset every clock hour (UTC). After changing a number, deploy a
// new version (Deploy → Manage deployments → Edit → Version: New version → Deploy).
var MAX_NEW_LEADS_PER_HOUR = 60;          // new rows; over this, the buyer sees the WhatsApp/email buttons
var MAX_UPDATES_PER_LEAD_PER_HOUR = 40;   // later steps for one buyer
var MAX_ALERT_EMAILS_PER_HOUR = 30;       // over this, rows are still saved but no email is sent
var MAX_BODY_BYTES = 20 * 1024;           // bigger posts are refused

// ── Do not change below unless you also change the website ────────────────
var HEADERS = [
  'leadId', 'stage', 'firstSeen', 'updated',
  'name', 'company', 'email', 'phone',
  'group', 'product', 'otherProduct',
  'quantity', 'quantityOther', 'packaging',
  'country', 'port', 'terms', 'notes',
  'sourcePage', 'userAgent'
];
var STAGES = ['contact', 'product', 'quantity', 'destination', 'terms', 'submitted'];
var CLEAR = '__clear__';
var MAX_LEN = 2000;
var SYSTEM_FIELDS = ['leadId', 'stage', 'firstSeen', 'updated'];
var LIMITS = {
  newLeadsPerHour: MAX_NEW_LEADS_PER_HOUR,
  updatesPerLeadPerHour: MAX_UPDATES_PER_LEAD_PER_HOUR,
  alertEmailsPerHour: MAX_ALERT_EMAILS_PER_HOUR,
  maxBodyBytes: MAX_BODY_BYTES
};
var CACHE_SECONDS = 2 * 60 * 60; // longer than an hour bucket, so a count never expires mid-hour

/** Run once from the editor: creates the Leads and Summary sheets with headers. */
function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
  sheet.setFrozenRows(1);
  // Plain-text format so nothing a buyer types is ever treated as a formula or number.
  sheet.getRange(2, 1, sheet.getMaxRows() - 1, HEADERS.length).setNumberFormat('@');

  var summary = ss.getSheetByName(SUMMARY_SHEET_NAME) || ss.insertSheet(SUMMARY_SHEET_NAME);
  summary.clear();
  summary.getRange(1, 1, 1, 2).setValues([['Furthest step reached', 'Leads']]).setFontWeight('bold');
  STAGES.forEach(function (stage, i) {
    summary.getRange(i + 2, 1).setValue(stage);
    summary.getRange(i + 2, 2).setFormula('=COUNTIF(' + SHEET_NAME + '!B:B,"' + stage + '")');
  });
  summary.getRange(STAGES.length + 2, 1, 1, 2)
    .setValues([['Total leads', '=COUNTA(' + SHEET_NAME + '!A:A)-1']]).setFontWeight('bold');
}

/** Health check: opening the /exec URL in a browser shows this. */
function doGet() {
  return ContentService.createTextOutput('Goodbiz Chem leads endpoint is running.');
}

function doPost(e) {
  var isForm = !!(e && e.postData && /x-www-form-urlencoded|multipart/i.test(e.postData.type || ''));
  if (bodyTooLarge((e && e.postData && e.postData.contents) || '', MAX_BODY_BYTES)) {
    return reply_(isForm, false, 'bad_request');
  }
  var data;
  try {
    data = isForm ? formFields(e.parameters || {}) : JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (err) {
    return reply_(isForm, false, 'bad_request');
  }
  if (!data || typeof data !== 'object') return reply_(isForm, false, 'bad_request');

  // Honeypot: real visitors never tick it. Pretend success, save nothing.
  if (isTruthy_(data.website) || isTruthy_(data.honeypot)) return reply_(isForm, true);

  var leadId = String(data.leadId || '').trim();
  if (!/^[A-Za-z0-9-]{8,64}$/.test(leadId)) {
    if (!isForm) return reply_(isForm, false, 'bad_lead_id');
    leadId = Utilities.getUuid(); // no-JavaScript form: one post, one row
  }
  // The no-JavaScript form posts everything at once.
  if (isForm && !data.stage) data.stage = 'submitted';

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
  } catch (err) {
    return reply_(isForm, false, 'busy');
  }

  var result = null;
  var alert = null;
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) { setup(); sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME); }
    // Counted inside the lock, so two posts at once cannot both slip under a cap.
    var cache = CacheService.getScriptCache();
    var keys = rateKeys(hourBucket(new Date()), leadId);
    var rowIndex = findRow_(sheet, leadId);
    var capKey = rowIndex ? keys.update : keys.newLead;
    var cap = rowIndex ? MAX_UPDATES_PER_LEAD_PER_HOUR : MAX_NEW_LEADS_PER_HOUR;
    var count = Number(cache.get(capKey)) || 0;
    if (!overLimit(count, cap)) {
      cache.put(capKey, String(count + 1), CACHE_SECONDS);
      result = upsert_(sheet, leadId, data, new Date().toISOString(), rowIndex);
      alert = alertKind(result.previousStage, result.row.stage, result.isNew);
      if (alert) {
        var sent = Number(cache.get(keys.alert)) || 0;
        if (overLimit(sent, MAX_ALERT_EMAILS_PER_HOUR)) {
          console.warn('Alert email skipped: ' + MAX_ALERT_EMAILS_PER_HOUR + ' alerts already sent this hour. Lead ' +
            leadId + ' is saved in the sheet.');
          alert = null;
        } else {
          cache.put(keys.alert, String(sent + 1), CACHE_SECONDS);
        }
      }
    }
  } finally {
    lock.releaseLock();
  }

  if (!result) {
    console.warn('Rate limited: ' + (rowIndex ? 'updates for lead ' + leadId : 'new leads') + ' over the hourly cap.');
    return reply_(isForm, false, 'rate_limited');
  }
  try {
    if (alert) sendAlert_(alert, result.row);
  } catch (err) {
    console.error('Alert email failed: ' + err); // the row is saved; never fail the buyer over email
  }
  return reply_(isForm, true);
}

/**
 * The no-JavaScript form posts one value per field, except packaging, which can repeat
 * (one checkbox per option). Join repeats with ", ", as the website's JSON sends them.
 */
function formFields(parameters) {
  var out = {};
  Object.keys(parameters).forEach(function (k) {
    var v = parameters[k];
    out[k] = Array.isArray(v) ? v.join(', ') : String(v);
  });
  return out;
}

// ── Sheet writing ───────────────────────────────────────────────────────────

/** The sheet row holding this lead, or 0 when it is new. */
function findRow_(sheet, leadId) {
  var found = sheet.getRange('A:A').createTextFinder(leadId).matchEntireCell(true).findNext();
  return found ? found.getRow() : 0;
}

function upsert_(sheet, leadId, data, nowIso, foundRow) {
  var isNew = !foundRow;
  var rowIndex = isNew ? sheet.getLastRow() + 1 : foundRow;
  var existing = isNew
    ? HEADERS.map(function () { return ''; })
    : sheet.getRange(rowIndex, 1, 1, HEADERS.length).getValues()[0].map(String);

  var existingObj = toObject(existing);
  var merged = mergeRow(existingObj, data, nowIso, leadId);
  sheet.getRange(rowIndex, 1, 1, HEADERS.length)
    .setNumberFormat('@')
    .setValues([HEADERS.map(function (h) { return merged[h]; })]);
  return { isNew: isNew, previousStage: existingObj.stage, row: merged };
}

// ── Pure helpers (no Google services; unit-tested in Node) ──────────────────

/** Stops Sheets from treating buyer text as a formula. */
function safeCell(value) {
  var s = String(value);
  return /^[=+\-@\t\r]/.test(s) ? "'" + s : s;
}

function toObject(values) {
  var obj = {};
  HEADERS.forEach(function (h, i) { obj[h] = values[i] == null ? '' : String(values[i]); });
  return obj;
}

/** The furthest of two stages; unknown stages never move a lead backwards. */
function furthestStage(a, b) {
  var ia = STAGES.indexOf(a), ib = STAGES.indexOf(b);
  if (ib === -1) return a || '';
  if (ia === -1) return b;
  return ib > ia ? b : a;
}

/**
 * Merges incoming answers into an existing row.
 * - absent key or empty value → keep what is there (never blank a filled cell)
 * - "__clear__" → empty the cell (the buyer changed or removed that answer)
 * - anything else → written (trimmed, formula-safe, length-capped)
 */
function mergeRow(existing, data, nowIso, leadId) {
  var out = {};
  HEADERS.forEach(function (h) { out[h] = existing[h] == null ? '' : String(existing[h]); });
  HEADERS.forEach(function (h) {
    if (SYSTEM_FIELDS.indexOf(h) !== -1) return;
    if (!Object.prototype.hasOwnProperty.call(data, h)) return;
    var v = data[h];
    if (Array.isArray(v)) v = v.join(', ');
    if (v == null) return;
    v = String(v).trim();
    if (v === CLEAR) { out[h] = ''; return; }
    if (v === '') return;
    out[h] = safeCell(v.slice(0, MAX_LEN));
  });
  out.leadId = leadId;
  out.firstSeen = out.firstSeen || nowIso;
  out.updated = nowIso;
  out.stage = furthestStage(out.stage, String(data.stage || ''));
  return out;
}

/** Which alert to send, if any: once when the lead first appears, once when completed. */
function alertKind(previousStage, newStage, isNew) {
  if (newStage === 'submitted' && previousStage !== 'submitted') return 'submitted';
  if (isNew) return 'contact';
  return null;
}

/** The UTC clock hour as yyyyMMddHH: the bucket every hourly count lives in. */
function hourBucket(date) {
  function two(n) { return (n < 10 ? '0' : '') + n; }
  return String(date.getUTCFullYear()) + two(date.getUTCMonth() + 1) + two(date.getUTCDate()) + two(date.getUTCHours());
}

/** True when `count` posts already used up a cap of `max`. A missing or garbled count is 0. */
function overLimit(count, max) {
  var n = Number(count);
  if (!(n >= 0)) n = 0;
  return n >= max;
}

/** Cache keys for this hour: all new leads, this lead's updates, and alert emails. */
function rateKeys(bucket, leadId) {
  return { newLead: 'new:' + bucket, update: 'upd:' + leadId + ':' + bucket, alert: 'mail:' + bucket };
}

/** True when the post is bigger than `maxBytes` in UTF-8. Text that cannot be encoded counts as too big. */
function bodyTooLarge(contents, maxBytes) {
  try {
    return encodeURIComponent(String(contents)).replace(/%[0-9A-F]{2}/gi, 'x').length > maxBytes;
  } catch (err) {
    return true;
  }
}

function isTruthy_(v) {
  return v === true || v === 'true' || v === 'on' || v === '1' || v === 1;
}

function stripLeadingQuote_(s) {
  return String(s || '').replace(/^'/, '');
}

function alertSubject(kind, row) {
  var who = stripLeadingQuote_(row.name) || 'Unknown';
  var company = stripLeadingQuote_(row.company);
  var what = stripLeadingQuote_(row.product || row.otherProduct || row.group);
  var head = kind === 'submitted' ? 'Quote request completed' : 'New lead';
  return head + ': ' + who + (company ? ' (' + company + ')' : '') + (what ? ' — ' + what : '');
}

function alertBody(kind, row, sheetUrl) {
  var lines = [
    kind === 'submitted'
      ? 'A buyer completed a quote request on the website.'
      : 'A new buyer started a quote request. Their contact details are in. They may still be filling in the rest.',
    ''
  ];
  HEADERS.forEach(function (h) {
    if (h === 'userAgent') return;
    var v = stripLeadingQuote_(row[h]);
    if (v) lines.push(h + ': ' + v);
  });
  if (sheetUrl) lines.push('', 'Open the leads sheet: ' + sheetUrl);
  return lines.join('\n');
}

// ── Email and responses ─────────────────────────────────────────────────────

function sendAlert_(kind, row) {
  var email = stripLeadingQuote_(row.email);
  var options = { name: 'Goodbiz Chem website' };
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) options.replyTo = email;
  MailApp.sendEmail(
    ALERT_TO,
    alertSubject(kind, row),
    alertBody(kind, row, SpreadsheetApp.getActiveSpreadsheet().getUrl()),
    options
  );
}

function reply_(isForm, ok, error) {
  if (isForm) {
    var title = ok ? 'Thank you, your request was sent' : 'Sorry, your request was not sent';
    var text = ok
      ? 'We will reply soon with a quote. SDS available on request.'
      : 'Please go back and try again, or email ' + ALERT_TO + '.';
    var html = '<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<title>' + title + '</title>' +
      '<body style="font-family:system-ui,sans-serif;max-width:32rem;margin:4rem auto;padding:0 1rem;color:#0E2A1E">' +
      '<h1 style="font-size:1.5rem">' + title + '</h1><p>' + text + '</p>' +
      '<p><a href="' + SITE_URL + '" style="color:#1F6B47">Back to Goodbiz Chem</a></p></body>';
    return HtmlService.createHtmlOutput(html).setTitle(title);
  }
  var body = ok ? { ok: true } : { ok: false, error: error || 'error' };
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);
}

// Lets the website's test suite load the pure helpers in Node. Ignored by Apps Script.
if (typeof module !== 'undefined') {
  module.exports = {
    HEADERS: HEADERS, STAGES: STAGES, CLEAR: CLEAR,
    safeCell: safeCell, mergeRow: mergeRow, furthestStage: furthestStage,
    alertKind: alertKind, alertSubject: alertSubject, alertBody: alertBody, toObject: toObject,
    formFields: formFields, LIMITS: LIMITS, hourBucket: hourBucket, overLimit: overLimit,
    rateKeys: rateKeys, bodyTooLarge: bodyTooLarge, doPost: doPost
  };
}
