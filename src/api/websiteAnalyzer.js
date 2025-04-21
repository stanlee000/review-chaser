const axios = require('axios');
const cheerio = require('cheerio');
const OpenAI = require('openai');
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const REVIEW_PLATFORMS = {
  trustpilot: {
    pattern: /trustpilot\.com\/review\/([^\/\s]+)/i,
    urlFormat: 'https://www.trustpilot.com/review/{companyId}'
  },
  capterra: {
    pattern: /capterra\.com\/p\/(\d+)\/([^\/\s]+)/i,
    urlFormat: 'https://www.capterra.com/p/{productId}/{productSlug}'
  },
  google: {
    pattern: /business\.google\.com\/([^\/\s]+)/i,
    urlFormat: 'https://business.google.com/{businessId}'
  },
  g2: {
    pattern: /g2\.com\/products\/([^\/\s]+)/i,
    urlFormat: 'https://www.g2.com/products/{productSlug}'
  },
  yelp: {
    pattern: /yelp\.com\/biz\/([^\/\s]+)/i,
    urlFormat: 'https://www.yelp.com/biz/{businessId}'
  }
};

const extractReviewPlatformLinks = ($) => {
  const links = {};
  
  // Extract links from anchor tags
  $('a').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;

    Object.entries(REVIEW_PLATFORMS).forEach(([platform, { pattern }]) => {
      const match = href.match(pattern);
      if (match) {
        links[platform] = href;
      }
    });
  });

  // Also search in meta tags and text content for review platform URLs
  const fullText = $('body').text();
  Object.entries(REVIEW_PLATFORMS).forEach(([platform, { pattern }]) => {
    if (!links[platform]) {
      const match = fullText.match(pattern);
      if (match) {
        links[platform] = match[0];
      }
    }
  });

  return links;
};

const extractRelevantContent = ($) => {
  // Extract key information
  const title = $('title').text().trim();
  const description = $('meta[name="description"]').attr('content')?.trim() || '';
  
  // Extract pricing information
  const pricingText = $('*:contains("$"), *:contains("€"), *:contains("pricing"), *:contains("price")')
    .map((_, el) => $(el).text().trim())
    .get()
    .join(' ')
    .slice(0, 1000);

  // Extract features from lists and key sections
  const features = $('ul li, ol li, [class*="feature"], [class*="benefit"]')
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(text => text.length > 10 && text.length < 200)
    .slice(0, 10);

  // Extract main content sections
  const mainContent = $('main, article, #content, .content, section')
    .map((_, el) => $(el).text().trim())
    .get()
    .join('\n')
    .slice(0, 3000);

  // Extract review platform links
  const reviewPlatformLinks = extractReviewPlatformLinks($);

  return {
    title,
    description,
    features,
    pricing: pricingText,
    mainContent,
    reviewPlatformLinks
  };
};

async function analyzeWebsite(url) {
  try {
    // Add user agent and headers to mimic a browser
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      timeout: 10000,
      maxRedirects: 5,
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // Extract content
    const extractedContent = extractRelevantContent($);

    // Prepare content for GPT analysis
    const contentForAnalysis = {
      url,
      ...extractedContent
    };

    // Use GPT to analyze the content
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Analyze the website content and extract key information.
           Pay special attention to identifying review platform profiles and links, it might be just domain name with or like .com or any other extension, but also just a brand name. 
           You can use the search tool to find the profile url. It's important to get the profile url right. For example for Resend.com on Trustpilot it's www.trustpilot.com/review/resend.com and for norman.finance on Trustpilot it's https://www.trustpilot.com/review/norman.finance
           Return a JSON object with the following structure:
{
  "productName": "string (max 50 chars)",
  "description": "string (max 200 chars)",
  "features": ["string (max 100 chars each)", maximum 5 items],
  "pricing": ["string (max 50 chars each)", maximum 2 items],
  "targetAudience": "string (max 100 chars)",
  "uniqueSellingPoints": ["string (max 100 chars each)", maximum 3 items],
  "industry": "string (max 100 chars)",
  "reviewPlatforms": {
    "trustpilot": {"detected": boolean, "profileUrl": "string or null"},
    "capterra": {"detected": boolean, "profileUrl": "string or null"},
    "google": {"detected": boolean, "profileUrl": "string or null"},
    "g2": {"detected": boolean, "profileUrl": "string or null"},
    "yelp": {"detected": boolean, "profileUrl": "string or null"}
  }
}`
        },
        {
          role: 'user',
          content: JSON.stringify(contentForAnalysis)
        }
      ],
      temperature: 0.3,
      max_tokens: 500
    });

    // Parse the response - extract JSON from the text response
    let analysis;
    try {
      // Try to extract JSON from the response
      const responseText = completion.choices[0].message.content;
      console.log('responseText', responseText);
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      throw new Error('Failed to parse AI analysis response');
    }
    
    // Combine detected links with AI analysis
    analysis.reviewPlatforms = Object.entries(analysis.reviewPlatforms).reduce((acc, [platform, info]) => {
      acc[platform] = {
        ...info,
        profileUrl: info.profileUrl || extractedContent.reviewPlatformLinks[platform] || null
      };
      return acc;
    }, {});

    return analysis;

  } catch (error) {
    console.error('Error analyzing website:', error.message);
    
    if (error.response) {
      if (error.response.status === 403) {
        throw new Error('Website access restricted. Please try a different URL.');
      } else if (error.response.status === 429) {
        throw new Error('Too many requests. Please try again later.');
      } else if (error.response.status === 404) {
        throw new Error('Website not found. Please check the URL and try again.');
      }
    }

    if (error.code === 'ECONNABORTED') {
      throw new Error('Website took too long to respond. Please try again later.');
    }

    if (error.code === 'ENOTFOUND') {
      throw new Error('Website not found. Please check the URL and try again.');
    }

    throw new Error('Failed to analyze website. Please try again later.');
  }
}

module.exports = {
  analyzeWebsite
}; 