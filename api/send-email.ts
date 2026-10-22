/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const SENDGRID_API_KEY =
  process.env.SENDGRID_API_KEY || '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';
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'sportfitness112@gmail.com';
const SENDGRID_FROM_NAME = process.env.SENDGRID_FROM_NAME || 'Sportfitness';
const SENDGRID_REPLY_TO = process.env.SENDGRID_REPLY_TO || 'mateobedoy20@gmail.com';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  // Security Policy: Reject arbitrary client email relaying (to/subject/html)
  return res.status(403).json({
    success: false,
    error: 'Security Policy Violation',
    message: 'Direct client email relaying (to/subject/html) is prohibited. All emails must be dispatched through dedicated server endpoints with server-generated codes.',
  });
}
