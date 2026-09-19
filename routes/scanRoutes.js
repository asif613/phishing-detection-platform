const express = require('express');
const router = express.Router();
const pool = require('../db');

// Scan Route
router.post('/scan', async (req, res) => {
  try {
    const { url, emailContent, userId } = req.body;

    let riskScore = 0;
    let reasons = [];

    if (url) {
      if (!url.startsWith('https://')) {
        riskScore += 40;
        reasons.push("URL does not use secure HTTPS protocol");
      }
      if (url.includes('@') || url.includes('-login') || url.includes('verify')) {
        riskScore += 50;
        reasons.push("Suspicious characters or phishing keywords detected in URL");
      }
    }

    if (emailContent) {
      const lowerEmail = emailContent.toLowerCase();
      if (lowerEmail.includes('urgent') || lowerEmail.includes('verify') || lowerEmail.includes('password')) {
        riskScore += 40;
        reasons.push("Suspicious keywords detected in email content");
      }
    }

    let status = 'Safe';
    if (riskScore >= 70) {
      status = 'High Risk';
    } else if (riskScore > 0) {
      status = 'Medium Risk';
    }

    const targetValue = url || emailContent;

    // Insert scan result into PostgreSQL database using pool query
    const insertQuery = `
      INSERT INTO scans (user_id, target_url, threat_level) 
      VALUES ($1, $2, $3) 
      RETURNING *;
    `;
    const dbResult = await pool.query(insertQuery, [userId || null, targetValue, status]);

    res.json({
      success: true,
      riskScore,
      status,
      reasons,
      data: dbResult.rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server error during scan" });
  }
});

// History Route
router.get('/history/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const historyQuery = `
      SELECT * FROM scans 
      WHERE user_id = $1 
      ORDER BY created_at DESC;
    `;
    const userScans = await pool.query(historyQuery, [userId]);

    res.json({ success: true, scans: userScans.rows });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
});

module.exports = router;