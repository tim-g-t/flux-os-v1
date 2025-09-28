# FLUX-OS Medical Monitoring System

## Project Overview
This is a medical patient monitoring system that displays real-time vital signs, clinical risk scores, and patient data from either a local cached file (instant loading) or remote API (30+ seconds).

## 🚀 Deployment Options

### 🌐 Production/Internet Deployment
When deployed to a production server:
- Build the app: `npm run build`
- Deploy the `dist` folder to any static hosting service (Vercel, Netlify, AWS S3, etc.)
- The app will automatically use the remote API endpoint
- Data loads from: `http://a0g88w80ssoos8gkgcs408gs.157.90.23.234.sslip.io/data`
- Loading time: ~30-60 seconds (85MB+ dataset)
- Users can access from anywhere via the internet

### 💻 Local Device Deployment
When running locally on your machine:
```bash
# Terminal 1: Start the main application
npm run dev

# Terminal 2: Start the local data server (optional for fast loading)
npm run dev:local
```

- If local file exists at `/Users/timtoepper/Downloads/code-of-website/patient-data.json`:
  - Data loads instantly (< 1 second)
  - Can work completely offline
- If local file doesn't exist:
  - Automatically falls back to remote API
  - Same behavior as production

### 🔄 Hybrid Loading System

The application uses a smart three-tier loading priority:

1. **Browser Cache (localStorage)** - If data was loaded in the last 5 minutes
2. **Local File** - `/Users/timtoepper/Downloads/code-of-website/patient-data.json` (instant)
3. **Remote API** - Falls back if local file doesn't exist (30+ seconds)

This is completely transparent to users - they never know which source is being used!

## 📊 Key Features

### Clinical Risk Scores
- **NEWS2** - National Early Warning Score 2
- **Modified Shock Index** - ICU patient monitoring
- **Respiratory Index** - Respiratory deterioration detection
- **Shock Index** - Hemodynamic assessment
- **qSOFA** - Quick sepsis assessment
- **MAP** - Mean Arterial Pressure
- **Pulse Pressure** - Cardiovascular monitoring
- **System Stability** - Vital sign variability analysis

### Interactive Dashboard
- Clickable score cards with sparkline trends
- Expandable detail modals with 24-hour history
- Real-time vital sign monitoring
- Patient overview with risk categorization

## 🛠 Technical Architecture

### Data Flow
```
User Opens App
    ↓
Check localStorage Cache (5 min validity)
    ↓ (if expired/missing)
Try Local File Server (port 5174)
    ↓ (if unavailable)
Fetch from Remote API
    ↓
Cache in localStorage
    ↓
Display Data
```

### File Structure
- `/src/services/patientApiService.ts` - Handles data fetching with fallback logic
- `/src/components/dashboard/ClinicalRiskDashboard.tsx` - Main risk score display
- `/src/utils/clinicalScores.ts` - Clinical score calculations
- `/local-data-server.cjs` - Simple Node server for local file serving
- `/vite.config.ts` - Proxy configuration for API endpoints

## 🔧 Development Commands

```bash
# Install dependencies
npm install

# Start development server only
npm run dev

# Start local data server (for fast loading)
npm run dev:local

# Build for production
npm run build

# Run linting
npm run lint
```

## 📝 Important Notes

1. **No Medical Claims**: The system displays only data and scores without medical recommendations
2. **API Dataset**: The remote API contains 85MB+ of patient data (100+ patients with full vital history)
3. **Local Caching**: First load will be slow, subsequent loads use browser cache (5 min validity)
4. **Offline Capability**: With local file present, the system works completely offline

## 🎯 Deployment Benefits

| Deployment Type | Loading Speed | Internet Required | Best For |
|----------------|---------------|-------------------|----------|
| Production (API) | 30-60 seconds | Yes | Public access, multi-user |
| Local (with file) | < 1 second | No | Development, demos |
| Local (no file) | 30-60 seconds | Yes | Testing API fallback |

## 🔒 Security Considerations

- Patient data is anonymized in the demo dataset
- Local file storage path is hardcoded (can be configured)
- API endpoint is public for demo purposes
- No authentication required for demo deployment

## 📈 Performance Optimization

The hybrid loading system provides:
- **99% faster loading** with local file cache
- **Zero configuration** switching between local/remote
- **Automatic fallback** for reliability
- **Transparent operation** for end users

## 🚦 Status Indicators

The clinical risk dashboard uses color coding:
- 🟢 **Green**: Normal/Low risk
- 🟡 **Yellow**: Warning/Medium risk
- 🔴 **Red**: Critical/High risk

Each score card shows:
- Current value
- Sparkline trend (last 20 data points)
- Click for detailed 24-hour history

---

*This system is designed for demonstration and educational purposes. Always consult healthcare professionals for medical decisions.*