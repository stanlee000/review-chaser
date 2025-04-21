const express = require('express');
const { analyzeWebsite } = require('./websiteAnalyzer');
const { generateReviews } = require('./reviewGenerator');
const { sendReviewRequest } = require('./reviewRequests');
const { rateLimit } = require('express-rate-limit');
const { OpenAI } = require('openai');
const reviewRequestsRouter = require('./routes/reviewRequests');

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Apply rate limiting to all routes
router.use(limiter);

// Middleware to check for valid URL
const validateUrl = (req, res, next) => {
  try {
    new URL(req.body.url);
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid URL provided' });
  }
};

// Middleware to validate review generation params
const validateReviewParams = (req, res, next) => {
  const { url, reviewCount, tone } = req.body;
  
  if (!url || !reviewCount || !tone) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }
  
  if (reviewCount < 1 || reviewCount > 10) {
    return res.status(400).json({ error: 'Review count must be between 1 and 10' });
  }
  
  try {
    new URL(url);
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid URL provided' });
  }
};

// Middleware to validate review request params
const validateReviewRequestParams = (req, res, next) => {
  const { reviewRequest, emailData } = req.body;
  
  if (!reviewRequest || !emailData) {
    return res.status(400).json({ error: 'Missing required fields: reviewRequest and emailData' });
  }
  
  // Removed fromName and fromEmail from required fields as they come from env vars now
  const requiredEmailFields = [
    'toEmail', 'toName', 
    'subject', 'content', 'platforms'
  ];
  
  const missingFields = requiredEmailFields.filter(field => !emailData[field]);
  if (missingFields.length > 0) {
    return res.status(400).json({ error: `Missing required email fields: ${missingFields.join(', ')}` });
  }
  
  if (!Array.isArray(emailData.platforms) || emailData.platforms.length === 0) {
    return res.status(400).json({ error: 'At least one review platform must be selected' });
  }
  
  next();
};

// Endpoint to analyze a website
router.post('/analyze-website', validateUrl, async (req, res) => {
  try {
    const { url } = req.body;
    const analysis = await analyzeWebsite(url);
    res.json(analysis);
  } catch (error) {
    console.error('Error in analyze-website route:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to build context
router.post('/build-context', async (req, res) => {
  try {
    const { analysisResult, additionalContext } = req.body;
    // Add your context building logic here
    res.json({ context: 'Context built successfully' });
  } catch (error) {
    console.error('Error in build-context route:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to generate reviews
router.post('/generate-reviews', async (req, res) => {
  try {
    const reviews = await generateReviews(req.body);
    res.json({ reviews });
  } catch (error) {
    console.error('Error in generate-reviews route:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to generate AI reviews (one-step process)
router.post('/ai-reviews', validateReviewParams, async (req, res) => {
  try {
    const { url, reviewCount, tone, additionalContext = '' } = req.body;
    
    // Step 1: Analyze website
    const analysisResult = await analyzeWebsite(url);
    
    // Step 2: Generate reviews using analysis result
    const reviews = await generateReviews({
      analysisResult,
      reviewCount,
      tone,
      additionalContext
    });
    
    res.json({
      analysis: analysisResult,
      reviews
    });
  } catch (error) {
    console.error('Error in /ai-reviews:', error);
    if (error.message === 'Failed to analyze website') {
      res.status(500).json({ error: 'Could not analyze the website. Please check the URL and try again.' });
    } else if (error.message === 'Failed to generate reviews') {
      res.status(500).json({ error: 'Could not generate reviews. Please try again later.' });
    } else {
      res.status(500).json({ error: 'An unexpected error occurred' });
    }
  }
});

// Endpoint to send review request
router.post('/send-review-request', validateReviewRequestParams, async (req, res) => {
  try {
    const { reviewRequest, emailData } = req.body;
    // fromName and fromEmail are handled inside sendReviewRequest via env vars
    const result = await sendReviewRequest(reviewRequest, emailData);
    res.json(result);
  } catch (error) {
    console.error('Error in /send-review-request:', error);
    res.status(500).json({ 
      error: 'Failed to send review request',
      details: error.message 
    });
  }
});

// Email content generation endpoint
router.post('/generate-email-content', async (req, res) => {
  try {
    const { type, productName, context } = req.body;

    let promptContent;
    if (type === 'incentive') {
      promptContent = `Generate a short (1-2 sentences), friendly, and compelling incentive message encouraging a customer to leave a review for the product: "${productName}".

Key requirements:
- Be appreciative of their business.
- Clearly state a specific incentive (e.g., discount code, early access, freebie).
- Briefly mention how/when they will receive the incentive after leaving the review.
- Maintain a positive and persuasive tone.

Product context (use this to tailor the message if relevant):
${context}

Output ONLY the incentive message text.`;
    } else { // Default to generating the full email template
      promptContent = `Generate a concise and professional email template for requesting a product review for "${productName}".

Key requirements:
- Address the customer warmly (use placeholder {customerName}).
- Express gratitude for their purchase/business.
- Briefly explain the value of their feedback (e.g., helps improve, helps others).
- Include placeholders for:
    - {customerName}
    - {productName}
    - {reviewContent} (This is where an AI-suggested review text might be inserted)
    - {incentive} (This is where the incentive message, if any, will be inserted)
    - {fromName} (Sender's name)
- Keep the overall tone friendly and professional.
- Ensure the email is concise and easy to read.
- DO NOT include a subject line.
- Output ONLY the email body content.

Product context (use this to make the request more specific):
${context}`;
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o', // Consider 'gpt-3.5-turbo' for faster/cheaper generation if quality is sufficient
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant specialized in writing clear, concise, and effective customer communication, specifically for requesting product reviews.'
        },
        {
          role: 'user',
          content: promptContent // Use the refined prompt content
        }
      ],
      temperature: 0.7,
      max_tokens: 300 // Increased slightly for potentially longer templates
    });

    res.json({ content: completion.choices[0].message.content.trim() });
  } catch (error) {
    console.error('Error generating email content:', error);
    res.status(500).json({ error: 'Failed to generate email content' });
  }
});

// Review requests routes
router.use('/review-requests', reviewRequestsRouter);

module.exports = router; 