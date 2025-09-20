# YuzuBot

A simple Chatwork bot built with Node.js and Express.

## Getting Started

### Prerequisites

* Node.js and npm installed
* A Chatwork account with API access
* A Supabase project for database storage

### Local Setup

1.  Clone this repository to your local machine.
2.  Navigate to the project directory in your terminal.
3.  Install the required dependencies:
    `npm install`
4.  Create a `.env` file in the root of your project and add your environment variables:
    ```
    CHATWORK_API_TOKEN=your_chatwork_token
    SUPABASE_URL=your_supabase_url
    SUPABASE_KEY=your_supabase_key
    ```
5.  Start the application:
    `npm start`

### Deployment on Render

This project is configured for easy deployment on Render as a Web Service.

1.  **Create a GitHub Repository:** Push your project, including the new `package.json` and `.gitignore` files, to a new repository on GitHub.
2.  **Create a New Web Service:** Log in to your Render account and create a new **Web Service**.
3.  **Connect to GitHub:** Connect your new repository. Render will automatically detect the Node.js project.
4.  **Configure Your Service:**
    * **Name:** Give your service a name (e.g., `yuzubot`).
    * **Root Directory:** Leave this blank.
    * **Runtime:** Node.
    * **Build Command:** `npm install`
    * **Start Command:** `npm start`
    * **Plan:** Choose a free or paid plan.
5.  **Add Environment Variables:** This is the most critical step. Navigate to the **Environment** tab and add the following variables exactly as they are named in your `index.js` file:
    * `CHATWORK_API_TOKEN`
    * `SUPABASE_URL`
    * `SUPABASE_KEY`
    
    Paste the corresponding values for each key.
6.  **Deploy:** Click **Create Web Service**. Render will now build and deploy your application. You can view the live logs to monitor the process.
7.  **Set Up the Chatwork Webhook:** Once your service is live, Render will provide a public URL. Copy this URL and configure your Chatwork webhook to send events to this URL's webhook endpoint (e.g., `https://your-service.onrender.com/webhook`).

> 💡 **Note on Cluster Module:** Your `index.js` file uses the `cluster` module to run on multiple CPU cores. Render's Web Service platform handles process management and scaling automatically, so this part of the code is largely redundant but will not cause any issues. The `app.listen` part of the code will run, and Render will manage the service's instances as needed.
