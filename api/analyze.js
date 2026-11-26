const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS_PER_IP = 25;
const ipHits = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const record = ipHits.get(ip);

  if (!record || now - record.start > RATE_WINDOW_MS) {
    ipHits.set(ip, { count: 1, start: now });
    return false;
  }

  record.count += 1;
  return record.count > MAX_REQUESTS_PER_IP;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clientIp =
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'unknown';

  if (isRateLimited(clientIp)) {
    return res.status(429).json({
      error: 'Too many checks from this device. Please try again in a little while.'
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'AI service is not configured yet.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { imageBase64, mimeType, smsText } = body;

    if (!imageBase64 && !smsText) {
      return res.status(400).json({ error: 'Please upload a screenshot or paste the text.' });
    }

    if (imageBase64 && imageBase64.length > 6_000_000) {
      return res.status(413).json({ error: 'Image is too large. Please upload a smaller screenshot.' });
    }

    const prompt = `You are a US consumer protection AI specialist for CarDesk US. You verify US Toll Smishing texts (SunPass, E-ZPass, FasTrak, TxTag, NTTA, Peach Pass, I-PASS, RiverLink, Good To Go, ExpressToll, PikePass) and US DMV, parking, red-light, or speed camera notices.

Carefully inspect the uploaded image and/or pasted text.

Strong US SCAM signals:
- Non-official or suspicious domains (.xin, .top, .vip, .club, .xyz, .cc, .info, .icu, lookalike domains like ezpass-pay.com, sunpass-toll-us.com, dmv-violation-notice.org).
- Foreign country code senders (+63, +44, etc.), random Gmail/iCloud/Outlook iMessage senders, or group chats.
- Instructions like "Reply Y, then exit and reopen this text to click the link" (classic iMessage smishing trick).
- Urgent threats of immediate driver's license suspension, vehicle registration revocation, or arrest within 12-24 hours via SMS.
- Official US toll authorities and state DMVs do not collect urgent fines via random text links.

Strong REAL notice signals:
- Official mailed paper citation, windshield parking ticket, or verified government portal notice containing a real citation number, license plate, exact date/time/street location, agency mailing address, and verified .gov or official state toll agency domain.
- No phishing or urgency manipulation signals.

Return ONLY strict JSON matching this schema:
{
  "verdict": "SCAM" or "REAL" or "SUSPICIOUS",
  "confidence": integer between 70 and 99,
  "detectedType": "Short 2-4 word type e.g. 'US Toll SMS', 'DMV Text', 'Parking Citation'",
  "headline": "Clear 4-6 word headline",
  "summary": "One crisp plain-English sentence explaining the verdict.",
  "reasons": [
    "Specific reason 1 based on the screenshot or text",
    "Specific reason 2",
    "Specific reason 3"
  ],
  "nextSteps": [
    "Clear safe action 1",
    "Clear safe action 2"
  ]
}`;

    const parts = [{ text: prompt }];

    if (smsText) {
      parts.push({ text: `User pasted message:\n${String(smsText).slice(0, 3000)}` });
    }

    if (imageBase64) {
      parts.push({
        inline_data: {
          mime_type: mimeType || 'image/jpeg',
          data: imageBase64
        }
      });
    }

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json'
          }
        })
      }
    );

    const geminiData = await geminiRes.json();

    if (!geminiRes.ok) {
      return res.status(502).json({
        error: geminiData?.error?.message || 'AI analysis failed. Please try again.'
      });
    }

    let rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    rawText = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();

    if (!rawText) {
      return res.status(502).json({ error: 'Empty AI response. Please try again.' });
    }

    const parsed = JSON.parse(rawText);
    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: 'Unable to analyze right now. Please try again.' });
  }
};
