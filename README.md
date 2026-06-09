# EventHub

**Live Demo:** [https://event-hub-beryl.vercel.app/](https://event-hub-beryl.vercel.app/)

EventHub is a modern, real-time event and media management platform designed to help communities, clubs, and groups seamlessly organize events, share media, and interact with each other. 

With a stunning, high-performance user interface, EventHub provides a premium experience for managing both public and private events.

## 🚀 Features

- **Robust Authentication:** Secure user registration and login using JWT.
- **Event Management:** Create and manage events, set them as Public or Private, and manage membership join requests.
- **Media Galleries:** Upload, view, and organize high-quality event photos and videos.
- **Real-Time Interactions:** Like and comment on media instantly, powered by WebSockets.
- **Live Notifications:** Receive real-time toast notifications for join requests, approvals, likes, and comments.
- **Role-Based Access Control:** Differentiate between Event Creators (Admins) and regular Members (Viewers).
- **AI-Based Image Tagging:** Utilizes Microsoft Azure cognitive services to automatically analyze and tag uploaded media.
- **Secure Media Downloads:** Dynamically generated, server-side watermarks are automatically applied to downloaded images to protect content ownership.
- **Premium UI:** Designed with a vibrant, dynamic theme featuring glassmorphism, glowing accents, and smooth micro-animations.

## 🛠 Tech Stack

**Frontend:**
- **React.js** (Vite) for blazing fast performance
- **Tailwind CSS** for rapid, responsive styling
- **React Router** for seamless single-page navigation
- **Lucide React** for beautiful, consistent iconography
- **Context API** for global state management (Auth, Notifications)

**Backend:**
- **Node.js & Express.js** for a scalable API architecture
- **MongoDB & Mongoose** for flexible NoSQL data modeling
- **Socket.io** for real-time, bi-directional communication
- **Sharp** for high-performance image processing and watermarking
- **Microsoft Azure** for scalable cloud-based image and media storing
- **JWT & bcryptjs** for authentication and security

## 🧠 Thought Process & Architecture

When designing EventHub, the primary goal was to create a highly engaging, real-time platform that feels alive.

1. **Visual Excellence:** I prioritized a striking aesthetic. By migrating to a unique, modern color palette (deep space blues, electric violets, and vibrant cyans), the platform instantly distinguishes itself from generic dashboards.
2. **Real-Time First:** Because event interaction is inherently social, I integrated Socket.io from the ground up. This ensures that when a user comments on a photo or requests to join an event, the recipient is notified instantly without needing to refresh the page.
3. **Data Privacy & Security:** I implemented a strict access control layer. Private events require approval to view, and media downloads are dynamically intercepted by the backend (`sharp`) to permanently overlay an "EVENTHUB" watermark, ensuring that photos shared off-platform retain their branding and protection.
4. **Cloud Infrastructure & AI Integration:** To handle high-volume media uploads reliably, the system utilizes **Microsoft Azure** for robust cloud-based image and media storing. The architecture is also deeply integrated with Azure's cognitive services for AI-based image tagging and analysis, ensuring the platform remains highly scalable and intelligent.

## ⚠️ Known Limitations

**Face Recognition:** 
Initially, we planned to implement automated face recognition to instantly tag users in event photos. However, **the Face Recognition Feature could not be added because of AWS billing issues, Microsoft Azure privacy issues, as well as local LLMs giving bad responses.** 

## 📦 Deployment Prep

The codebase has been stripped from hardcoded URLs which have been replaced with dynamic `VITE_API_URL` variables, making it completely ready for production deployment on platforms like Vercel (Frontend) and Render (Backend).

## 💻 How to Run Locally

### Prerequisites
- Node.js (v16+)
- MongoDB (Local or Atlas URI)
- Microsoft Azure Account (For Storage & Cognitive Services)

### 1. Clone the Repository
```bash
git clone https://github.com/Mohit1423/EventHub.git
cd EventHub
```

### 2. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` directory using `.env.example` as a template:
```env
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
STORAGE_PROVIDER=azure
AZURE_STORAGE_CONNECTION_STRING=your_azure_connection_string
AZURE_STORAGE_CONTAINER_NAME=event-media
AZURE_FACE_KEY=your_azure_face_key
AZURE_FACE_ENDPOINT=your_azure_face_endpoint
AZURE_VISION_KEY=your_azure_vision_key
AZURE_VISION_ENDPOINT=your_azure_vision_endpoint
```
Start the backend server:
```bash
npm run dev
```

### 3. Frontend Setup
Open a new terminal window:
```bash
cd frontend
npm install
```
Start the Vite development server:
```bash
npm run dev
```

The app will now be running on `http://localhost:5173`!
