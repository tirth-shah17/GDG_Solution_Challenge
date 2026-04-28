# Athos

Athos is a robust digital asset protection system designed to combat unauthorized usage of digital media through intelligent fingerprinting and real-time scanning detection.

It features a high-performance backend mapped directly to Neon PostgreSQL using FastAPI, paired with a modern, cinematic React interface tailored specifically for identifying and preserving intellectual property rights.

---

## 🛠 Tech Stack

### Frontend
- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v3
- **Icons**: Lucide React
- **Typography**: Single-page cinematic styling using Instrument Serif & Inter

### Backend
- **Framework**: FastAPI (Python)
- **Database Model**: SQLAlchemy + psycopg2 
- **Database Provider**: Neon (Serverless PostgreSQL)
- **Security**: Local `.env` abstraction via Pydantic Settings
- **Digital Footprinting**: High-speed binary ingestion streaming

---

## 🛡️ Core Technology: Perceptual Content Hashing

Athos secures digital IP boundaries by moving beyond simple file-matching and leveraging **Perceptual Fingerprinting**. 

### How it Works:
1. **Media Ingestion**: When an image or video is uploaded to the system, Athos does not rely on easily altered metadata (like file names or EXIF tags).
2. **Digital Fingerprinting**: The media undergoes high-speed binary processing (currently extracting a secure SHA-256 baseline and transitioning to advanced `imagehash` pipelines). This generates a unique, mathematical "fingerprint" mapping the actual visual or binary traits of the file.
3. **Database Anchorage**: These fingerprints are anchored immutably inside the decentralized Neon PostgreSQL environment.
4. **Resilient Scanning**: When a suspicious media asset is scanned against the registry, Athos calculates its fingerprint and compares it against the database using **Hamming Distance thresholds**. 

Because perceptual hashing looks at the *visual structure* rather than raw bytes, the system can confidently detect unauthorized media usage—even if a pirate has maliciously resized, cropped, or slightly compressed the stolen asset!

### Advanced Web Scraping Engine
Athos includes an intelligent web scraper that allows users to scan external websites for potential copyright violations.
- **Dynamic Content Extraction**: Capable of pulling media assets directly from target URLs using multiple strategies (direct HTML parsing or headless browser rendering).
- **On-the-fly Comparison**: Extracted assets are instantly fingerprinted and compared against the user's uploaded reference asset, pinpointing exact matches in the wild.

### Coming Soon: AI-Powered Insights (Gemini)
We are integrating the **Google Gemini API** to elevate our violation detection. When a match is found, the AI will provide a brief, human-readable explanation ("AI Insight") detailing:
- Why the images are visually similar.
- Whether any specific modifications (cropping, blurring, brightness adjustments) appear to have been applied.
- The context behind the violation confidence score.
