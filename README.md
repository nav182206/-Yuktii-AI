<img width="1917" height="1074" alt="image" src="https://github.com/user-attachments/assets/9212c916-683f-450d-bd7e-abb7aef7b37e" />


<img width="1919" height="1087" alt="image" src="https://github.com/user-attachments/assets/7f75db5c-2ada-4135-9d47-ac8edfc588e3" />

# Yukti AI

An AI-powered digital marketing campaign agent designed for SuperBFSI to plan, launch, monitor, and optimize email campaigns for financial products.

## Features

- **AI Campaign Planner**: Automatically generates campaign strategies and A/B test variants from natural language briefs using Gemini 3.1 Pro.
- **Smart Segmentation**: Identifies optimal customer cohorts based on demographic and behavioral data.
- **Advanced Analytics Dashboard**: Real-time visualization of campaign performance, historical trends, and segment engagement using Recharts.
- **Human-in-the-Loop**: Approval workflow to ensure marketing strategies are reviewed before execution.
- **Autonomous Optimization**: AI-driven analysis of performance metrics to provide strategic recommendations for future campaigns.

## Tech Stack

- **Frontend**: React 19, Tailwind CSS 4, Motion, Recharts, Lucide Icons
- **Backend**: Node.js, Express, SQLite (better-sqlite3)
- **AI**: Google Gemini API (@google/genai)
- **Build Tool**: Vite

## Getting Started

### Prerequisites

- Node.js (v18+)
- Gemini API Key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/nav182206/Yukti-AI.git
   cd Yukti-AI
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure

- `server.ts`: Express backend and database initialization.
- `src/App.tsx`: Main React application and dashboard UI.
- `src/services/gemini.ts`: Integration with Google Gemini API.
- `src/services/api.ts`: Mocked marketing and reporting APIs.

## License

Apache-2.0
