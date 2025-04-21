const { Resend } = require('resend');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Validate required environment variables
if (!process.env.REACT_APP_SUPABASE_URL) {
  throw new Error('REACT_APP_SUPABASE_URL is not configured');
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
}
if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not configured');
}
// Added validation for new env vars
if (!process.env.FROM_NAME) {
  throw new Error('FROM_NAME environment variable is not configured');
}
if (!process.env.FROM_EMAIL) {
  throw new Error('FROM_EMAIL environment variable is not configured');
}

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const REVIEW_URL_PATTERNS = {
  trustpilot: 'https://www.trustpilot.com/evaluate/{companyId}',
  capterra: 'https://www.capterra.com/reviews/new/{productId}',
  google: 'https://g.page/r/{businessId}',
  g2: 'https://www.g2.com/products/{productId}/reviews/new',
  yelp: 'https://www.yelp.com/writeareview/biz/{businessId}'
};

const PROFILE_URL_PATTERNS = {
  trustpilot: /trustpilot\.com\/review\/([^\/\s]+)/i,
  capterra: /capterra\.com\/p\/(\d+)\/([^\/\s]+)/i,
  google: /business\.google\.com\/([^\/\s]+)/i,
  g2: /g2\.com\/products\/([^\/\s]+)/i,
  yelp: /yelp\.com\/biz\/([^\/\s]+)/i
};

function getReviewUrl(platform, profileUrl) {
  try {
    const pattern = PROFILE_URL_PATTERNS[platform];
    const match = profileUrl.match(pattern);
    
    if (!match) {
      console.error(`Could not extract ID from ${platform} profile URL:`, profileUrl);
      return null;
    }

    switch (platform) {
      case 'trustpilot': return REVIEW_URL_PATTERNS[platform].replace('{companyId}', match[1]);
      case 'capterra': return REVIEW_URL_PATTERNS[platform].replace('{productId}', match[1]);
      case 'google': return REVIEW_URL_PATTERNS[platform].replace('{businessId}', match[1]);
      case 'g2': return REVIEW_URL_PATTERNS[platform].replace('{productId}', match[1]);
      case 'yelp': return REVIEW_URL_PATTERNS[platform].replace('{businessId}', match[1]);
      default: return null;
    }
  } catch (error) {
    console.error(`Error generating review URL for ${platform}:`, error);
    return null;
  }
}

async function sendReviewRequest(reviewRequest, emailData) {
  try {
    const reviewToken = generateReviewToken();
    const fromName = process.env.FROM_NAME; // Use env var
    const fromEmail = process.env.FROM_EMAIL; // Use env var

    console.log('Sending review request:', {
      productName: reviewRequest.productName,
      rating: reviewRequest.rating,
      platforms: emailData.platforms.map(p => p.id),
      recipientEmail: emailData.toEmail ? '***@***.***' : undefined,
    });

    const reviewRequestRecord = {
      token: reviewToken,
      review_content: reviewRequest.reviewContent,
      recipient_email: emailData.toEmail,
      recipient_name: emailData.toName,
      sender_email: fromEmail, // Use env var value
      sender_name: fromName, // Use env var value
      platforms: emailData.platforms,
      status: 'pending',
      created_at: new Date().toISOString(),
      product_name: reviewRequest.productName,
      rating: reviewRequest.rating,
      title: reviewRequest.title,
    };

    console.log('Saving review request to database...');

    const { data: savedRequest, error: dbError } = await supabase
      .from('review_requests')
      .insert([reviewRequestRecord])
      .select()
      .single();

    if (dbError) {
      console.error('Database error details:', dbError);
      throw new Error(`Failed to save review request to database: ${dbError.message}`);
    }

    console.log('Review request saved successfully:', savedRequest.id);

    try {
      console.log('Sending email via Resend...');

      // 1. Prepare base email body (replace standard placeholders, leave {reviewContent})
      const mainContentTemplate = emailData.content;
      let processedMainContent = mainContentTemplate
        .replace('{customerName}', emailData.toName)
        .replace('{productName}', reviewRequest.productName)
        // .replace('{reviewContent}', ...) // Skip this one for now
        .replace('{incentive}', emailData.incentive)
        .replace('{fromName}', fromName);

      // 2. Prepare styled review content block HTML
      const styledReviewContentHtml = `
        <div style="margin: 24px 0; padding: 16px 20px; background-color: #f9f9f9; border-left: 5px solid #4a90e2; border-radius: 5px; font-style: italic; color: #555555; line-height: 1.6; font-size: 15px;">
          ${reviewRequest.reviewContent}
        </div>
      `;

      // 3. Insert the styled block into the main content, replacing the placeholder
      processedMainContent = processedMainContent.replace('{reviewContent}', styledReviewContentHtml);

      // 4. Format the final main content into paragraphs
      const finalEmailBody = processedMainContent
          .split('\n').map(line => `<p style="margin: 0 0 1em 0; font-size: 16px; line-height: 1.5; color: #333333;">${line}</p>`).join('');

      // Prepare styled platform buttons
      const styledPlatformButtons = emailData.platforms
        .map(platform => {
          const reviewUrl = getReviewUrl(platform.id, platform.profileUrl);
          if (!reviewUrl) return null;
          const platformName = platform.id.charAt(0).toUpperCase() + platform.id.slice(1);
          return `
            <a href="${reviewUrl}?token=${reviewToken}" 
               target="_blank" 
               style="display: inline-block; margin: 8px 8px 8px 0; padding: 12px 24px; 
                      background-color: #4a90e2; color: #ffffff !important; text-decoration: none !important; 
                      border-radius: 25px; font-weight: bold; font-size: 14px; border: none; cursor: pointer;">
              Leave a review on ${platformName}
            </a>
          `;
        })
        .filter(button => button !== null)
        .join('');

      // Prepare subject
      const emailSubject = emailData.subject.replace('{customerName}', emailData.toName)
        .replace('{productName}', reviewRequest.productName)
        .replace('{incentive}', emailData.incentive)
        .replace('{fromName}', fromName);

      // Assemble the final HTML structure
      const finalHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${emailSubject}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f0f0f0;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f0f0f0;">
            <tr>
              <td align="center">
                <table width="600" border="0" cellspacing="0" cellpadding="40" style="max-width: 600px; width: 100%; background-color: #ffffff; margin: 20px auto; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <tr>
                    <td>
                      <!-- Main Email Content -->
                      ${finalEmailBody} 
                      
                      <!-- Review Button Section -->
                      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eeeeee;">
                        <p style="margin: 0 0 15px 0; font-weight: bold; font-size: 16px; color: #333333;">Leave your review:</p>
                        ${styledPlatformButtons}
                      </div>
                      
                      <!-- Footer -->
                      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eeeeee; font-size: 12px; color: #888888; text-align: center;">
                        <p style="margin: 0 0 5px 0;">This email was sent by ${fromName}.</p>
                        <p style="margin: 0;">If you have any questions, please contact us.</p>
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      // Send email using Resend
      const emailResponse = await resend.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to: [emailData.toEmail],
        subject: emailSubject,
        html: finalHtml,
      });

      console.log('Email sent successfully');
      return { success: true, data: savedRequest };
    } catch (emailError) {
      console.error('Resend API error:', emailError);
      
      const { error: updateError } = await supabase
        .from('review_requests')
        .update({ status: 'failed' })
        .eq('token', reviewToken);

      if (updateError) {
        console.error('Error updating request status:', updateError);
      }

      throw new Error(`Failed to send review request email: ${emailError.message}`);
    }
  } catch (error) {
    console.error('Error in sendReviewRequest:', error);
    throw error;
  }
}

function generateReviewToken() {
  return Buffer.from(Math.random().toString(36) + Date.now().toString()).toString('base64')
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, 32);
}

module.exports = {
  sendReviewRequest
}; 