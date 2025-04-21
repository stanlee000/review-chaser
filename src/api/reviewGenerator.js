const { OpenAI } = require('openai');
const { faker } = require('@faker-js/faker');
require('dotenv').config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const generateReviewerPersona = (targetAudience) => {
  return {
    name: faker.person.fullName(),
    age: faker.number.int({ min: 25, max: 65 }),
    occupation: faker.person.jobTitle(),
    location: faker.location.city() + ', ' + faker.location.country()
  };
};

const generateReviews = async (params) => {
  const {
    analysisResult,
    reviewCount,
    tone,
    additionalContext
  } = params;

  const reviews = [];

  try {
    for (let i = 0; i < reviewCount; i++) {
      const persona = generateReviewerPersona(analysisResult.targetAudience);
      
      const systemPrompt = `You are an expert review writer tasked with creating authentic-sounding product reviews based on provided analysis and a persona.
      Your goal is to generate a single, concise review per request.

      Follow these instructions precisely:
      1.  Adopt the persona provided in the user message.
      2.  Write a review with a tone: ${tone.toUpperCase()}.
      3.  The review MUST be between 2 and 4 sentences long.
      4.  Mention 1 or 2 specific product features naturally within the review text.
      5.  Briefly describe a plausible personal use case or benefit experienced by the persona.
      6.  Generate a concise, relevant title for the review (max 50 characters).
      7.  Assign a realistic rating (integer between 1 and 5) that aligns with the tone (${tone === 'positive' ? 'likely 4-5' : tone === 'negative' ? 'likely 1-2' : 'any'}).
      8.  Ensure the review sounds genuine and avoids overly generic marketing language.
      
      Respond ONLY with a valid JSON object containing the following keys:
      {
        "content": "string (The review text itself, max 250 characters)",
        "rating": number (Integer between 1 and 5),
        "title": "string (The review title, max 50 characters)"
      }
      
      Do not include any other text, explanations, or formatting outside the JSON structure.`;

      const userPrompt = `Product Analysis & Persona Details:
------
Product Name: ${analysisResult.productName || 'N/A'}
Industry: ${analysisResult.industry || 'N/A'}
Key Features: ${analysisResult.features ? analysisResult.features.join(', ') : 'N/A'}
Target Audience: ${analysisResult.targetAudience || 'N/A'}
Unique Selling Points: ${analysisResult.uniqueSellingPoints ? analysisResult.uniqueSellingPoints.join(', ') : 'N/A'}
Additional Context: ${additionalContext || 'None provided'}

Reviewer Persona:
Name: ${persona.name}
Age: ${persona.age}
Occupation: ${persona.occupation}
Location: ${persona.location}
------
Generate the review based on the system instructions and the details above.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        temperature: 0.8,
        max_tokens: 150,
        response_format: { type: "json_object" }
      });

      const generatedReview = JSON.parse(completion.choices[0].message.content);

      reviews.push({
        content: generatedReview.content,
        title: generatedReview.title,
        authorName: persona.name,
        rating: generatedReview.rating,
        location: persona.location,
        date: faker.date.recent({ days: 30 }).toISOString()
      });
    }

    return reviews;
  } catch (error) {
    console.error('Error generating reviews:', error);
    throw new Error('Failed to generate reviews');
  }
};

module.exports = {
  generateReviews
}; 