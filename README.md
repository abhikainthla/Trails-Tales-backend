# 🌍 Trails&Tales Backend

Backend service for **Trails&Tales** – a full-stack travel journal platform where users can share travel experiences, upload media, explore destinations, and interact with a global community.

---

## 🚀 Features

- 🔐 Authentication (JWT-based)
- 👤 User Profile Management
- 📝 Travel Journal CRUD
- 📍 Location-based entries (Map integration ready)
- 📸 Media Upload (Cloudinary)
- ❤️ Social Features (Likes, Comments, Follow)
- 🔎 Search & Filters
- 🔔 Real-time Notifications (Socket.io)
- 📊 Analytics (views, engagement - optional)
- 🧳 Trip Collections

---

## 🧱 Tech Stack

- **Node.js**
- **Express.js**
- **MongoDB (Mongoose)**
- **JWT Authentication**
- **Socket.io**
- **Cloudinary** (Media Storage)
- **Redis** (optional caching)

---

## 📁 Project Structure

```cs
backend/
│
├── controllers/ # Route logic
├── models/ # Mongoose schemas
├── routes/ # API routes
├── middleware/ # Auth & error handling
├── services/ # Business logic
├── sockets/ # Socket.io events
├── utils/ # Helper functions
├── config/ # DB & env configs
├── uploads/ # Temp storage 
├── .env
├── server.js
└── package.json

```


---

## ⚙️ Environment Variables

Create a `.env` file in the root:

```bash
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

CLIENT_URL=http://localhost:5173
```


---

## 📦 Installation

```bash
# Clone the repo
git clone https://github.com/abhikainthla/Trails-Tales-backend.git

# Install dependencies
npm install
```
# Development
```bash
npm run dev
```
# Production
```bash
npm start
```
# System Architecture Diagram
```js
                        ┌──────────────────────────────┐
                        │        Client (Browser)       │
                        │  React + Vite / Next.js       │
                        │  Tailwind / Chakra UI         │
                        └──────────────┬───────────────┘
                                       │
                                       │ HTTPS (REST + WebSockets)
                                       ▼
                        ┌──────────────────────────────┐
                        │        API Gateway Layer      │
                        │ (Express.js Server - Node.js) │
                        └──────────────┬───────────────┘
                                       │
        ┌──────────────────────────────┼──────────────────────────────┐
        │                              │                              │
        ▼                              ▼                              ▼
┌───────────────┐           ┌──────────────────┐           ┌──────────────────┐
│ Auth Service  │           │ Journal Service  │           │ Social Service   │
│ JWT / OAuth   │           │ CRUD Journals    │           │ Likes / Comments │
└──────┬────────┘           └────────┬─────────┘           └────────┬─────────┘
       │                              │                              │
       └──────────────┬───────────────┴──────────────┬───────────────┘
                      ▼                              ▼
              ┌───────────────┐              ┌────────────────┐
              │ MongoDB       │              │ Redis (Optional)│
              │ (Mongoose)    │              │ Caching / PubSub│
              └───────────────┘              └────────────────┘


        ┌──────────────────────────────┐
        │   Media Storage (Cloudinary) │
        │   Images / Videos Upload     │
        └──────────────┬───────────────┘
                       │
                       ▼
               CDN Delivery (Fast Media)


        ┌──────────────────────────────┐
        │   Real-Time Server           │
        │   Socket.io                  │
        │   Notifications / Chat       │
        └──────────────┬───────────────┘
                       │
                       ▼
                 Connected Clients


        ┌──────────────────────────────┐
        │ External APIs                │
        │ - Mapbox / Google Maps       │
        │ - OpenAI (AI Features)       │
        └──────────────────────────────┘
```
