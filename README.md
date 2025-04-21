# Review Chaser

An AI-powered tool designed to help businesses analyze their website presence, generate authentic-sounding customer reviews, and manage review request campaigns via email.

## Features

-   **Onboarding Flow:**
    -   Guides users through initial setup: business name, website URL.
    -   Performs website analysis to extract key information (product name, description, features, target audience, industry, unique selling points).
    -   Detects presence and profile URLs for major review platforms (Trustpilot, Capterra, Google, G2, Yelp) found on the site.
    -   Allows refining context and configuring review generation parameters (tone, count).
    -   Generates initial review suggestions.
    -   Optionally allows sending a first review request.
-   **Dashboard:**
    -   Central hub for managing review generation and requests.
    -   Displays website preview using Screenshot Machine.
    -   Shows overview of website analysis data (product name, industry, features, USPs, detected platforms).
    -   Allows editing and saving core business profile details (analysis data, platform URLs, additional AI context).
    -   Provides controls to generate new review suggestions based on tone and desired count.
    -   Lists generated review suggestions with details (rating, content, author, date).
    -   Allows sending individual review requests via a dialog.
    -   Provides options to manually update the status of a review request (e.g., New, Received).
-   **AI Review Generation:**
    -   Uses website analysis results and configurable parameters (tone, count, additional context).
    -   Leverages AI to generate realistic customer reviews based on specified tone and website data.
    -   Can incorporate synthetic reviewer personas for added authenticity.
    -   Returns reviews with content, title, rating, author name, location, and date.
-   **Email Review Request Sending:**
    -   Sends formatted review request emails to customers via a dialog initiated from the Dashboard or Onboarding.
    -   Allows selection of specific generated reviews to include.
    -   Allows selection of target review platforms (with configured URLs) to include as links.
    -   Provides options to customize the email template (From Name, Subject, Content, Incentive) before sending.
    -   Includes variable insertion helpers (`{customerName}`, `{productName}`, etc.) for personalization.
    -   Integrates with Resend for email delivery.
    -   Updates review suggestion status to "Requested" upon successful sending.
    -   Logs request details to a Supabase database (optional).
-   **AI Email Content Generation:**
    -   Generates email templates (subject, content, incentive) using AI.
    -   Accessible within the email sending dialog for quick regeneration.
    -   Takes product name and context as input.
-   **Frontend Interface:**
    -   React-based single-page application built with Material UI.
    -   Includes user authentication (via Supabase Auth).
    -   Provides dedicated routes for Dashboard, Settings, and Onboarding.

## Usage Example
[![Watch the video](https://github.com/user-attachments/assets/e1cd09df-29a9-41ab-bd8f-f3c4f106a1be)](https://www.loom.com/share/a6015c4e552a453c864f81fefcfbfb92?sid=b855227a-3586-465e-952a-1d469b2f7541)
<img width="400" alt="review_chaser_1" src="https://github.com/user-attachments/assets/4b5a732e-3250-4905-b205-7d6347346c49" />

## Tech Stack

-   **Frontend:** React.js, Material UI, React Router
-   **Backend:** Node.js, Express.js
-   **Core Logic:**
    -   Website Fetching/Parsing: `axios`, `cheerio`
    -   AI Analysis/Generation: OpenAI API (`openai` library, e.g., GPT-4o)
    -   Website Screenshot: Screenshot Machine API
    -   Email Sending: Resend (`resend` library)
    -   Data Storage & Auth: Supabase (`@supabase/supabase-js`)
    -   Fake Data Generation: `@faker-js/faker` (optional, for review generation)
-   **Development:** `concurrently`, `react-scripts`

## Getting Started

### Prerequisites

-   Node.js (v18 or later recommended)
-   npm or yarn
-   Access keys for OpenAI, Resend, Screenshot Machine, and Supabase.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository_url>
    cd review-chaser
    ```

2.  **Install dependencies:**
    ```bash
    # Install root, backend, and frontend dependencies
    npm install
    cd backend && npm install && cd ..
    ```
    (Or use `yarn install` in each directory)

3.  **Set up environment variables:**
    Create a `.env` file in the root directory. Add the following variables, replacing placeholders with your actual keys:
    ```env
    # OpenAI API Key (Required for analysis, review generation, email content generation)
    OPENAI_API_KEY=your_openai_api_key

    # Resend API Key (Required for sending review request emails)
    RESEND_API_KEY=your_resend_api_key

    # Email Sender Details (Required for sending review request emails)
    FROM_NAME="Your Company Name"
    FROM_EMAIL=noreply@yourdomain.com

    # Supabase Credentials (Required for storing profile data, reviews, auth)
    REACT_APP_SUPABASE_URL=your_supabase_project_url
    SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key # Ensure this key has appropriate table permissions
    REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key

    # Screenshot Machine API Key (Required for website previews in Dashboard/Onboarding)
    REACT_APP_SCREENSHOT_MACHINE_API_KEY=your_screenshot_machine_api_key
    ```
    *Note: Ensure your Supabase database has the `business_profiles` table (and potentially `review_requests` if logging separately) set up according to the application's needs.*

### Running the Application

1.  **Ensure Ports 3000 & 3001 are free:** Stop any previous instances if necessary.
2.  **Start both backend and frontend:**
    ```bash
    # From the root directory
    npm run dev
    ```
3.  Open your browser and navigate to `http://localhost:3000`. You should be redirected to the login/signup page or the dashboard if already logged in.

## API Endpoints (Backend - localhost:3001)

-   `POST /api/analyze-website`: Analyzes a website URL.
    -   Body: `{ "url": "string" }`
-   `POST /api/build-context`: (Potentially deprecated if analysis handles full context) Refines context based on analysis.
    -   Body: `{ "analysisResult": object, "additionalContext": "string" }`
-   `POST /api/generate-reviews`: Generates AI reviews based on website data and parameters.
    -   Body: `{ "websiteUrl": "string", "reviewCount": number, "tone": "string", "additionalContext": "string", "analysisResult": object, "productName": "string" }` (Structure might vary slightly)
-   `POST /api/generate-email-content`: Generates specific email parts (subject, content, incentive).
    -   Body: `{ "type": "subject"|"content"|"incentive", "productName": "string", "context": "string", "reviewContent"?: string, "reviewRating"?: number }`
-   `POST /api/send-review-request`: Sends a formatted review request email.
    -   Body: `{ "reviewRequest": object, "emailData": object }` (See `src/api/reviewRequests.js` or backend route for detailed structure)

## Contributing

1.  Fork the repository
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## License

Distributed under the MIT License
