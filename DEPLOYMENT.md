# Deployment Guide for X Bon - Luxury Commodities Exchange

## Quick Deploy Options

### Option 1: Vercel (Recommended for Frontend)

1. **Fork/Clone the Repository**
   ```bash
   git clone https://github.com/KingEndubis/Xbon.git

**Live Website:** https://xbon-gold-exchange.vercel.app
   cd Xbon
   ```
   
   **Live Website:** [https://xbon-gold-exchange.vercel.app](https://xbon-gold-exchange.vercel.app)

2. **Deploy Frontend to Vercel**
   - Visit [vercel.com](https://vercel.com)
   - Connect your GitHub account
   - Import the `Xbon` repository
   - Set the **Root Directory** to `apps/web`
   - Add environment variables:
     ```
     NEXT_PUBLIC_API_URL=https://your-api-domain.com
     NEXT_PUBLIC_WEB_URL=https://your-app-domain.vercel.app
     ```
   - Deploy!

### Option 2: Railway (Recommended for Backend API)

1. **Deploy API to Railway**
   - Visit [railway.app](https://railway.app)
   - Connect your GitHub account
   - Create new project from `Xbon` repository
   - Set **Root Directory** to `apps/api`
   - Add environment variable:
     ```
     ENCRYPTION_KEY=your-32-byte-encryption-key-here-must-be-exactly-32-chars
     ```
   - Railway will auto-detect Node.js and deploy

### Option 3: Netlify (Alternative for Frontend)

1. **Deploy to Netlify**
   - Visit [netlify.com](https://netlify.com)
   - Connect GitHub and select `Xbon` repository
   - Set **Base directory** to `apps/web`
   - Set **Build command** to `npm run build`
   - Set **Publish directory** to `apps/web/.next`
   - Add environment variables in Netlify dashboard

## Full Stack Deployment

### Prerequisites
- Node.js 20.11.0+
- npm 10.2.4+
- Domain names (optional but recommended)

### Step 1: Deploy Backend API

**Using Railway:**
1. Create Railway account
2. Connect GitHub repository
3. Create new service from `apps/api`
4. Set environment variables:
   ```
   ENCRYPTION_KEY=generate-a-secure-32-character-key
   PORT=3001
   ```
5. Note the generated API URL (e.g., `https://xbon-api-production.up.railway.app`)

**Using Heroku:**
```bash
# Install Heroku CLI
npm install -g heroku

# Login and create app
heroku login
heroku create xbon-api

# Set buildpack and environment
heroku buildpacks:set heroku/nodejs
heroku config:set ENCRYPTION_KEY="your-32-char-key-here"

# Deploy
git subtree push --prefix apps/api heroku master
```

### Step 2: Deploy Frontend

**Using Vercel:**
1. Install Vercel CLI: `npm i -g vercel`
2. Navigate to web app: `cd apps/web`
3. Deploy: `vercel --prod`
4. Set environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://your-api-url.com
   NEXT_PUBLIC_WEB_URL=https://your-frontend-url.com
   ```

## Environment Variables

### Backend (apps/api/.env)
```env
ENCRYPTION_KEY=your-32-byte-encryption-key-here
PORT=3001
```

### Frontend (apps/web/.env.local)
```env
NEXT_PUBLIC_API_URL=https://your-api-domain.com
NEXT_PUBLIC_WEB_URL=https://your-frontend-domain.com
```

## Security Notes

1. **Generate Secure Encryption Key**
   ```javascript
   // Use this in Node.js to generate a secure key
   const crypto = require('crypto');
   console.log(crypto.randomBytes(32).toString('hex'));
   ```

2. **HTTPS Only**: Ensure both frontend and backend use HTTPS in production

3. **CORS Configuration**: The API is configured to accept requests from your frontend domain

## Testing Your Deployment

1. **Visit your frontend URL**
2. **Test Registration**: Use the invite system to create accounts
3. **Create Agents**: Test the agent hierarchy system
4. **Create Deals**: Test deal creation and encryption
5. **Check Dashboard**: Verify real-time statistics

## Troubleshooting

### Common Issues:

1. **API Connection Failed**
   - Check `NEXT_PUBLIC_API_URL` environment variable
   - Ensure API is deployed and accessible
   - Check CORS settings

2. **Encryption Errors**
   - Verify `ENCRYPTION_KEY` is exactly 32 characters
   - Ensure key is set in backend environment

3. **Build Failures**
   - Check Node.js version compatibility
   - Ensure all dependencies are installed
   - Check build logs for specific errors

## Custom Domain Setup

1. **Frontend Domain**
   - Add custom domain in Vercel/Netlify dashboard
   - Update DNS records as instructed
   - Update `NEXT_PUBLIC_WEB_URL` environment variable

2. **API Domain**
   - Add custom domain in Railway/Heroku dashboard
   - Update DNS records
   - Update `NEXT_PUBLIC_API_URL` in frontend

## Monitoring

- **Vercel**: Built-in analytics and monitoring
- **Railway**: Application metrics and logs
- **Custom**: Consider adding services like Sentry for error tracking

---

**Need Help?** Check the logs in your deployment platform's dashboard for detailed error messages.