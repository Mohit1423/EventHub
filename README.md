# EventHub

EventHub is a modern, real-time event and media management platform designed to help communities, clubs, and groups seamlessly organize events, share media, and interact with each other. 

With a stunning, high-performance "Aurora Borealis" user interface, EventHub provides a premium experience for managing both public and private events.

## 🚀 Features

- **Robust Authentication:** Secure user registration and login using JWT.
- **Event Management:** Create and manage events, set them as Public or Private, and manage membership join requests.
- **Media Galleries:** Upload, view, and organize high-quality event photos and videos.
- **Real-Time Interactions:** Like and comment on media instantly, powered by WebSockets.
- **Live Notifications:** Receive real-time toast notifications for join requests, approvals, likes, and comments.
- **Role-Based Access Control:** Differentiate between Event Creators (Admins) and regular Members (Viewers).
- **Secure Media Downloads:** Dynamically generated, server-side watermarks are automatically applied to downloaded images to protect content ownership.
- **Premium UI:** Designed with a vibrant, dynamic "Aurora Borealis" theme featuring glassmorphism, glowing accents, and smooth micro-animations.

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
- **JWT & bcryptjs** for authentication and security

## 🧠 Thought Process & Architecture

When designing EventHub, the primary goal was to create a highly engaging, real-time platform that feels alive.

1. **Visual Excellence:** I prioritized a striking aesthetic. By migrating to the unique "Aurora Borealis" color palette (deep space blues, electric violets, and vibrant cyans), the platform instantly distinguishes itself from generic dashboards.
2. **Real-Time First:** Because event interaction is inherently social, I integrated Socket.io from the ground up. This ensures that when a user comments on a photo or requests to join an event, the recipient is notified instantly without needing to refresh the page.
3. **Data Privacy & Security:** I implemented a strict access control layer. Private events require approval to view, and media downloads are dynamically intercepted by the backend (`sharp`) to permanently overlay an "EVENTHUB" watermark, ensuring that photos shared off-platform retain their branding and protection.

## ⚠️ Known Limitations

**Face Recognition:** 
Initially, we planned to implement automated face recognition to instantly tag users in event photos. However, **the Face Recognition Feature could not be added because of AWS billing issues, Microsoft Azure privacy issues, as well as local LLMs giving bad responses.** 

## 📦 Deployment Prep

The codebase has been fully stripped of development comments and hardcoded URLs have been replaced with dynamic `VITE_API_URL` variables, making it completely ready for production deployment on platforms like Vercel (Frontend) and Render (Backend).
