<div align="center">
  <img src="public/favicon.svg" alt="CodeSense AI Logo" width="120" />
  
  # CodeSense AI 🔍
  
  **AI-Powered Code Review Platform**
  
  <p>
    <a href="https://github.com/rushikesh-bobade/codesense-ai/issues"><img src="https://img.shields.io/github/issues/rushikesh-bobade/codesense-ai" alt="Issues" /></a>
    <a href="https://github.com/rushikesh-bobade/codesense-ai/pulls"><img src="https://img.shields.io/github/issues-pr/rushikesh-bobade/codesense-ai" alt="Pull Requests" /></a>
    <a href="https://github.com/rushikesh-bobade/codesense-ai/blob/main/LICENSE"><img src="https://img.shields.io/github/license/rushikesh-bobade/codesense-ai" alt="License" /></a>
  </p>

  <p>
    Catch security flaws, performance issues, and subtle bugs before they reach production. CodeSense AI integrates seamlessly with your workflow to provide automated, deep code analysis using state-of-the-art LLMs.
  </p>
</div>

---

## ✨ Features

- 🔍 **Deep Code Analysis** — Goes beyond simple linting. Detects security vulnerabilities, performance bottlenecks, and logical errors through semantic understanding.
- ⚡ **Ultra-Fast Inference** — Powered by Groq's LPU architecture, delivering instantaneous AI review feedback.
- 📊 **Comprehensive Dashboards** — Track review histories, repository health scores, and issue resolution metrics over time.
- 🎨 **Polished UI/UX** — A fully responsive, dark-themed, and accessible interface designed for developer ergonomics.
- 🔄 **GitHub Integration** — Analyze pull requests directly via Octokit integration.

## 🛠 Tech Stack

Our stack is carefully chosen for type safety, performance, and developer experience:

### Frontend & Core
- **Framework:** [React Router v7](https://reactrouter.com/) (Full-stack capabilities)
- **Language:** TypeScript
- **Styling:** CSS Modules with custom Design System
- **Components:** [Radix UI](https://www.radix-ui.com/) (Headless accessible primitives)
- **Icons:** [Tabler Icons](https://tabler.io/icons)

### AI & API
- **AI Model:** [Llama 3.3 70B](https://llama.meta.com/)
- **Inference Provider:** [Groq SDK](https://wow.groq.com/)
- **Version Control:** [@octokit/rest](https://github.com/octokit/rest.js/)

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your local machine:
- **Node.js** (v20 or higher recommended)
- **npm** (v10 or higher)
- **Git**

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/rushikesh-bobade/codesense-ai.git
   cd codesense-ai
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Create a `.env` file in the root directory and add your required API keys:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   GITHUB_TOKEN=your_github_personal_access_token # Optional: For higher rate limits
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to `http://localhost:5173` to see the application running.

## 📁 Project Structure

```
codesense-ai/
├── app/
│   ├── blocks/          # Complex UI compositions (e.g., Dashboards, Hero sections)
│   ├── components/      # Reusable foundational UI elements
│   ├── data/            # Data models, stores, and API wrappers
│   ├── hooks/           # Custom React hooks
│   ├── routes/          # React Router file-based routing and pages
│   └── styles/          # Global CSS, resets, and theme tokens
├── public/              # Static assets (Favicon, images)
├── package.json         # Project dependencies and scripts
└── vite.config.ts       # Vite and React Router configuration
```

## 📜 Available Scripts

- `npm run dev` - Starts the development server with Hot Module Replacement (HMR).
- `npm run build` - Builds the application for production.
- `npm run start` - Serves the built production application.
- `npm run typecheck` - Runs TypeScript type checking across the project.

## 🤝 Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">
  <b>Built for developers, by developers.</b>
</div>
