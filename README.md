# Social Media Feed API

A serverless API built with Vercel that aggregates YouTube and Instagram posts into a unified feed for display on your WordPress website.

## Features

- ✅ Fetches latest posts from YouTube and Instagram
- ✅ Unified JSON API endpoint
- ✅ Built-in caching (15-minute default)
- ✅ Filter by platform (all, YouTube, or Instagram)
- ✅ Engagement metrics (views, likes, comments)
- ✅ CORS-enabled for WordPress integration
- ✅ Serverless architecture (no server management)
- ✅ Free tier compatible

## Quick Start

1. **Clone this repository**
2. **Set up API credentials** (see SETUP_GUIDE.md)
3. **Deploy to Vercel**
4. **Add to WordPress** using provided widget code

## API Endpoints

### Get All Posts
```
GET https://your-project.vercel.app/api/feed
```

### Get YouTube Posts Only
```
GET https://your-project.vercel.app/api/feed?platform=youtube
```

### Get Instagram Posts Only
```
GET https://your-project.vercel.app/api/feed?platform=instagram
```

## Response Format

```json
{
  "posts": [
    {
      "id": "youtube_abc123",
      "platform": "youtube",
      "title": "My Video Title",
      "description": "Video description...",
      "thumbnail": "https://...",
      "url": "https://youtube.com/watch?v=...",
      "timestamp": "2025-02-10T12:00:00Z",
      "metrics": {
        "views": 1500,
        "likes": 120,
        "comments": 15
      }
    }
  ],
  "count": 20,
  "lastUpdated": "2025-02-10T12:30:00Z",
  "cached": true,
  "cacheAge": 450
}
```

## Environment Variables

Required environment variables for Vercel:

- `YOUTUBE_API_KEY` - Your YouTube Data API v3 key
- `YOUTUBE_CHANNEL_ID` - Your YouTube channel ID
- `INSTAGRAM_ACCESS_TOKEN` - Instagram Basic Display API token
- `INSTAGRAM_USER_ID` - Your Instagram user ID

## Documentation

See **SETUP_GUIDE.md** for complete setup instructions including:
- API credential setup (YouTube & Instagram)
- Local development with VS Code
- Deployment to Vercel
- WordPress integration
- Customization options
- Troubleshooting

## Tech Stack

- **Runtime**: Node.js (Vercel Serverless Functions)
- **APIs**: YouTube Data API v3, Instagram Basic Display API
- **Frontend**: Vanilla JavaScript (WordPress widget)
- **Hosting**: Vercel
- **Caching**: In-memory cache

## Files

- `api/feed.js` - Main API endpoint
- `wordpress-widget.html` - Ready-to-use WordPress widget
- `vercel.json` - Vercel configuration
- `SETUP_GUIDE.md` - Complete setup instructions
- `.env.example` - Environment variables template

## Local Development

```bash
# Install Vercel CLI
npm install -g vercel

# Create .env file with your credentials
cp .env.example .env

# Start development server
vercel dev

# Visit http://localhost:3000/api/feed
```

## Deployment

```bash
# Deploy to production
vercel --prod

# Or connect GitHub repo to Vercel for automatic deployments
```

## Customization

### Change Post Limit
Edit `maxResults` in `api/feed.js` (default: 10 per platform)

### Adjust Cache Duration
Modify `CACHE_DURATION` in `api/feed.js` (default: 15 minutes)

### Customize WordPress Widget
Edit styles and layout in `wordpress-widget.html`

## Rate Limits

- **YouTube**: 10,000 units/day (free tier)
- **Instagram**: Varies by app, typically 200 calls/hour

With 15-minute caching, you'll use minimal quota.

## License

MIT

## Support

For detailed setup help, see SETUP_GUIDE.md

For issues, check the troubleshooting section in SETUP_GUIDE.md
