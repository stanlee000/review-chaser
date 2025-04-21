const express = require('express');
const router = express.Router();
const { sendReviewRequest } = require('../reviewRequests'); // Adjusted path relative to routes directory

router.post('/send', async (req, res) => {
  try {
    const { reviewRequest, emailData } = req.body;
    
    // Validate required fields
    if (!reviewRequest || !emailData) {
      return res.status(400).json({ 
        error: 'Missing required fields: reviewRequest and emailData' 
      });
    }

    const requiredEmailFields = [
      'toEmail', 'toName', // fromEmail, fromName are now env vars
      'subject', 'content', 'platforms'
    ];
    
    const missingFields = requiredEmailFields.filter(field => !emailData[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: `Missing required email fields: ${missingFields.join(', ')}` 
      });
    }

    // fromName and fromEmail will be read from process.env inside sendReviewRequest
    const result = await sendReviewRequest(reviewRequest, emailData); 
    res.json(result);
  } catch (error) {
    console.error('Error in review request route:', error);
    res.status(500).json({ 
      error: 'Failed to send review request',
      details: error.message 
    });
  }
});

module.exports = router; 