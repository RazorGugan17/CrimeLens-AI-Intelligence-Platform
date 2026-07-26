# 🛡️ CrimeLens AI - Intelligence Platform

An AI-powered crime intelligence and analytics platform designed to assist law enforcement agencies in analyzing crime data, identifying trends, predicting hotspots, and supporting data-driven policing decisions.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)
![React](https://img.shields.io/badge/React-19-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)

---

## 📌 Features

- 🔐 Secure Role-Based Authentication
- 📊 Interactive Crime Analytics Dashboard
- 🤖 AI-Powered Crime Insights
- 📍 Crime Hotspot Detection
- 📈 Monthly Crime Trend Analysis
- 👥 Offender Profiling & Ranking
- 🕸️ Criminal Network Visualization
- 💬 AI Crime Intelligence Chat Assistant
- 📱 Responsive Modern UI
- ⚡ Fast React + Vite Frontend
- 🚀 Express.js REST API Backend

---

## 🛠 Tech Stack

### Frontend
- React 19
- TypeScript
- Vite
- Tailwind CSS
- React Query
- React Router

### Backend
- Node.js
- Express.js
- TypeScript
- Zod Validation

### API
- OpenAPI Specification
- Generated API Client
- REST Architecture

---

# 📂 Project Structure

```
CrimeLens-AI-Intelligence-Platform
│
├── artifacts
│   ├── api-server
│   └── crime-intelligence
│
├── lib
│   ├── api-client-react
│   ├── api-spec
│   └── api-zod
│
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

---

# 🚀 Installation

## Clone Repository

```bash
git clone https://github.com/RazorGugan17/CrimeLens-AI-Intelligence-Platform.git

cd CrimeLens-AI-Intelligence-Platform
```

---

## Install Dependencies

```bash
pnpm install
```

---

## Approve Build Scripts

```bash
pnpm approve-builds
```

Approve **esbuild** if prompted.

---

## Run Development Server

```bash
pnpm dev
```

This starts

- Frontend → http://localhost:3000
- Backend → http://localhost:8080

---

# ⚙️ Configuration

The frontend communicates with the backend through the Vite development proxy.

Example configuration:

```ts
proxy: {
  "/api": {
    target: "http://localhost:8080",
    changeOrigin: true,
  },
}
```

---

# 📊 Modules

### Authentication
- Secure Login
- Session Management
- Role-Based Access

### Dashboard
- Crime Statistics
- Trend Analysis
- Progress Tracking
- Category Breakdown

### Crime Intelligence
- AI Chat
- Crime Predictions
- Pattern Recognition

### Network Analysis
- Criminal Relationship Graph
- Offender Rankings

### Hotspot Analysis
- Geographic Crime Distribution
- Risk Prediction

---

# 📡 API

Backend APIs are available at

```
http://localhost:8080/api
```

Example

```
POST /api/auth/login
GET  /api/dashboard
GET  /api/crime-intelligence
```

---

# 🧪 Development

Run

```bash
pnpm dev
```

Build

```bash
pnpm build
```

---

# 📸 Screenshots

> Add screenshots of your dashboard, login page, analytics, and AI chat here.

Example:

```
screenshots/
├── login.png
├── dashboard.png
├── analytics.png
└── hotspot.png
```

---

# 🎯 Future Enhancements

- Live Crime Mapping
- Real-Time Incident Feed
- ML-Based Crime Prediction
- Facial Recognition Integration
- GIS Integration
- Mobile Application
- Advanced Reporting
- Multi-Language Support

---

# 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch

```bash
git checkout -b feature-name
```

3. Commit your changes

```bash
git commit -m "Added new feature"
```

4. Push

```bash
git push origin feature-name
```

5. Create a Pull Request

---

# 👨‍💻 Author

**Anushaa MC
Gugan T
Dhanush B
Swathi**

Artificial Intelligence & Data Science Student

GitHub:
https://github.com/RazorGugan17

---

# ⭐ Support

If you found this project useful, consider giving it a ⭐ on GitHub!

---

## 📄 License

This project is licensed under the MIT License.
