// Receives the contact form's enquiry and emails it via Resend.
// Requires the RESEND_API_KEY environment variable (set in the Netlify
// dashboard, never committed). RESEND_FROM can override the sender if
// needed; artofengineering.in is already verified in Resend, so this
// defaults to an address on that domain.
var TO = 'mail.aoepl@gmail.com'; // keep in sync with CONTACT.email in assets/site.js
var FROM = process.env.RESEND_FROM || 'Art of Engineering <enquiries@artofengineering.in>';

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return json(405, { ok: false, error: 'Method not allowed.' });
  }

  var data;
  try {
    data = JSON.parse(event.body || '{}');
  } catch (e) {
    return json(400, { ok: false, error: 'Invalid request body.' });
  }

  var name = (data.name || '').trim();
  var phone = (data.phone || '').trim();
  var scope = (data.scope || '').trim();
  var site = (data.site || '').trim();
  var email = (data.email || '').trim();
  var area = (data.area || '').trim();
  var notes = (data.notes || '').trim();

  var missing = [];
  if (!name) { missing.push('your name'); }
  if (!phone) { missing.push('your phone number'); }
  if (!scope) { missing.push('a project scope'); }
  if (!site) { missing.push('the site location'); }
  if (missing.length) {
    return json(400, { ok: false, error: 'Please add ' + missing.join(', ') + '.' });
  }

  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not set');
    return json(500, { ok: false, error: 'Email sending is not configured yet.' });
  }

  var lines = [
    'New site enquiry from artofengineering.in',
    '',
    'Name: ' + name,
    'Phone: ' + phone,
    'Email: ' + (email || '-'),
    'Scope: ' + scope,
    'Built-up area (sq ft): ' + (area || '-'),
    'Site location: ' + site,
    'Requirements: ' + (notes || '-'),
  ];

  try {
    var resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + process.env.RESEND_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM,
        to: [TO],
        reply_to: email || undefined,
        subject: 'Site enquiry: ' + name + ' (' + scope + ')',
        text: lines.join('\n'),
      }),
    });

    if (!resp.ok) {
      var errText = await resp.text();
      console.error('Resend error', resp.status, errText);
      return json(502, { ok: false, error: 'Could not send the email right now.' });
    }

    return json(200, { ok: true });
  } catch (err) {
    console.error('Send enquiry failed', err);
    return json(502, { ok: false, error: 'Could not send the email right now.' });
  }
};

function json(statusCode, body) {
  return {
    statusCode: statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}
