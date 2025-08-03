# Portfolio Backend API

Backend API for Om Prakash's portfolio contact form.

## 🚀 Quick Deploy to Vercel

1. **Fork/Clone this repository**
2. **Go to [Vercel.com](https://vercel.com)**
3. **Click "New Project" → "Import Git Repository"**
4. **Select your backend repository**
5. **Add Environment Variables:**

### Environment Variables to Set:

```
MONGODB_URI=mongodb+srv://om:P7kWKXBeeb9fFkXM@cluster0.1wtv5so.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
NODE_ENV=production
ALLOWED_ORIGINS=https://portfolio-9lgiozojm-om-prakash-paridas-projects-3a26066e.vercel.app
JWT_SECRET=your_jwt_secret_here
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=5
```

6. **Deploy!** Vercel will automatically build and deploy your app
7. **Copy the generated URL** (e.g., `https://your-backend-app.vercel.app`)

## 🔧 Local Development

```bash
npm install
npm run dev
```

## 📡 API Endpoints

- `POST /api/contact/submit` - Submit contact form
- `GET /api/contact/stats` - Get contact statistics
- `GET /api/contact/all` - Get all contacts (admin)

## 🛠️ Tech Stack

- Node.js
- Express.js
- MongoDB (Mongoose)
- Nodemailer
- CORS
- Helmet (Security)
- Rate Limiting 