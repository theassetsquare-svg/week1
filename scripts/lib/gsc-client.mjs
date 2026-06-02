// Minimal Google Search Console API client — no external deps.
// Uses a service-account JWT (RS256, signed with Node crypto) to mint an
// access token, then calls the Webmasters v3 + Search Console v1 REST APIs.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function loadKey() {
  const envPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const candidates = [
    envPath,
    path.join(__dirname, '..', '.secrets', 'theasset-gsc.json'),
  ].filter(Boolean);
  for (const p of candidates) {
    if (p && fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
  }
  throw new Error('GSC service-account key not found. Set GOOGLE_APPLICATION_CREDENTIALS or place scripts/.secrets/theasset-gsc.json');
}

function b64url(input) {
  return Buffer.from(input).toString('base64')
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

export async function getAccessToken(key, scope = 'https://www.googleapis.com/auth/webmasters.readonly') {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = b64url(JSON.stringify({
    iss: key.client_email,
    scope,
    aud: key.token_uri,
    iat: now,
    exp: now + 3600,
  }));
  const signingInput = `${header}.${claim}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signingInput);
  const signature = signer.sign(key.private_key)
    .toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const assertion = `${signingInput}.${signature}`;

  const res = await fetch(key.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`token error ${res.status}: ${JSON.stringify(data)}`);
  return data.access_token;
}

export async function listSites(token) {
  const res = await fetch('https://www.googleapis.com/webmasters/v3/sites', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`listSites ${res.status}: ${JSON.stringify(data)}`);
  return data.siteEntry || [];
}

export async function searchAnalytics(token, siteUrl, body) {
  const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`searchAnalytics ${res.status}: ${JSON.stringify(data)}`);
  return data.rows || [];
}

export async function inspectUrl(token, siteUrl, inspectionUrl) {
  const res = await fetch('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ siteUrl, inspectionUrl, languageCode: 'ko' }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`inspect ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

export async function submitSitemap(token, siteUrl, sitemapUrl) {
  const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/sitemaps/${encodeURIComponent(sitemapUrl)}`;
  const res = await fetch(url, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok && res.status !== 204) {
    const t = await res.text();
    throw new Error(`submitSitemap ${res.status}: ${t}`);
  }
  return true;
}

export async function listSitemaps(token, siteUrl) {
  const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/sitemaps`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();
  if (!res.ok) throw new Error(`listSitemaps ${res.status}: ${JSON.stringify(data)}`);
  return data.sitemap || [];
}

// last-N-days date range helper (GSC data lags ~2-3 days)
export function dateRange(days = 28) {
  const end = new Date(Date.now() - 2 * 86400000);
  const start = new Date(end.getTime() - days * 86400000);
  const fmt = (d) => d.toISOString().slice(0, 10);
  return { startDate: fmt(start), endDate: fmt(end) };
}
