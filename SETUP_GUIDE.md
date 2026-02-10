# Social Media Feed Setup Guide

Complete guide to deploy your YouTube and Instagram feed aggregator on Vercel and integrate it with WordPress.

---

## 📋 Prerequisites

- GitHub account
- Vercel account (free tier works)
- VS Code installed
- Node.js installed (v18 or higher recommended)
- Your API credentials ready:
  - YouTube API Key & Channel ID
  - Instagram Access Token & User ID

---

## Part 1: Set Up Your API Credentials

### YouTube API Setup

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create a new project** (or select existing)
3. **Enable YouTube Data API v3**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "YouTube Data API v3"
   - Click "Enable"
4. **Create API Key**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy your API key
5. **Find Your Channel ID**:
   - Go to YouTube Studio
   - Click on "Settings" > "Channel" > "Advanced settings"
   - Copy your Channel ID

### Instagram API Setup

Instagram requires the **Instagram Basic Display API**:

1. **Go to Facebook Developers**: https://developers.facebook.com/
2. **Create an App**:
   - Click "Create App"
   - Choose "Consumer" as app type
   - Fill in app details
3. **Add Instagram Basic Display**:
   - In your app dashboard, click "Add Product"
   - Find "Instagram Basic Display" and click "Set Up"
4. **Configure Basic Display**:
   - Create a new Instagram App
   - Add OAuth Redirect URL: `https://localhost`
   - Add Deauthorize and Data Deletion URLs (can be same as redirect)
5. **Get User ID and Access Token**:
   - Go to "Basic Display" > "User Token Generator"
   - Click "Generate Token"
   - Authorize your Instagram account
   - Copy the Access Token and User ID

**Note**: Instagram tokens expire every 60 days. You'll need to refresh them periodically or implement token refresh logic.

---

## Part 2: Local Development Setup

### 1. Open VS Code and Set Up Project

```bash
# Open terminal in VS Code (Ctrl+` or Cmd+`)

# Navigate to where you want your project
cd ~/Documents/Projects

# Create project directory
mkdir social-feed-api
cd social-feed-api

# Initialize Git repository
git init
```

### 2. Copy the Project Files

Copy all the files from this package into your `social-feed-api` folder:
- `api/feed.js`
- `package.json`
- `vercel.json`
- `.env.example`
- `.gitignore`

### 3. Set Up Environment Variables

```bash
# Copy the example file
cp .env.example .env

# Open .env in VS Code and add your credentials
```

Edit `.env` file:
```
YOUTUBE_API_KEY=your_actual_youtube_api_key
YOUTUBE_CHANNEL_ID=your_actual_channel_id
INSTAGRAM_ACCESS_TOKEN=your_actual_instagram_token
INSTAGRAM_USER_ID=your_actual_instagram_user_id
```

### 4. Install Dependencies and Test Locally

```bash
# Install Vercel CLI globally
npm install -g vercel

# Install project dependencies (if any added later)
npm install

# Start local development server
vercel dev
```

Your API should now be running at `http://localhost:3000/api/feed`

Test it by opening that URL in your browser - you should see JSON with your posts!

---

## Part 3: Deploy to Vercel

### 1. Push to GitHub

```bash
# In VS Code terminal
git add .
git commit -m "Initial commit - social feed API"

# Create a new repository on GitHub (github.com/new)
# Then link it (replace YOUR_USERNAME and REPO_NAME):
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
git branch -M main
git push -u origin main
```

### 2. Deploy on Vercel

**Option A: Deploy via Vercel Dashboard (Recommended)**

1. Go to https://vercel.com/
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure project:
   - Framework Preset: "Other"
   - Root Directory: `./`
5. Add Environment Variables:
   - Click "Environment Variables"
   - Add each variable from your `.env` file:
     - `YOUTUBE_API_KEY`
     - `YOUTUBE_CHANNEL_ID`
     - `INSTAGRAM_ACCESS_TOKEN`
     - `INSTAGRAM_USER_ID`
6. Click "Deploy"

**Option B: Deploy via CLI**

```bash
# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Add environment variables via CLI
vercel env add YOUTUBE_API_KEY
vercel env add YOUTUBE_CHANNEL_ID
vercel env add INSTAGRAM_ACCESS_TOKEN
vercel env add INSTAGRAM_USER_ID
```

### 3. Note Your API URL

After deployment, Vercel will give you a URL like:
`https://your-project-name.vercel.app`

Your API endpoint will be:
`https://your-project-name.vercel.app/api/feed`

**Test it!** Open this URL in your browser to verify it's working.

---

## Part 4: Add to WordPress

### Method 1: Using Custom HTML Block (Easiest)

1. **Edit Your WordPress Page/Post**:
   - Go to the page where you want the feed
   - Click "+" to add a new block
   - Search for "Custom HTML"
   - Add the Custom HTML block

2. **Copy the Widget Code**:
   - Open `wordpress-widget.html`
   - Copy ALL the code

3. **Update the API URL**:
   - Find this line in the code:
     ```javascript
     const API_URL = 'https://your-project.vercel.app/api/feed';
     ```
   - Replace with your actual Vercel URL

4. **Paste into WordPress**:
   - Paste the entire code into the Custom HTML block
   - Click "Preview" to test
   - Click "Publish" or "Update"

### Method 2: Add to Theme Template (More Permanent)

1. **Go to WordPress Admin** > Appearance > Theme File Editor

2. **Choose Template**:
   - Select the template file where you want the feed (e.g., `page.php`, `single.php`, or `front-page.php`)

3. **Add Code**:
   - Paste the widget code where you want it to appear
   - Make sure to update the API_URL first!

4. **Update File**

### Method 3: Create a Shortcode (Most Flexible)

1. **Go to WordPress Admin** > Appearance > Theme File Editor

2. **Edit `functions.php`**:

```php
function social_feed_shortcode() {
    // Read the widget HTML file content
    $widget_html = '<!-- Paste your widget code here -->';
    return $widget_html;
}
add_shortcode('social_feed', 'social_feed_shortcode');
```

3. **Use Shortcode**:
   - In any page/post, add: `[social_feed]`

---

## Part 5: Customize the Feed

### Change the Number of Posts

In `api/feed.js`, find `maxResults=10` and change to your preferred number:

```javascript
// YouTube
const url = `https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&channelId=${YOUTUBE_CHANNEL_ID}&part=snippet&order=date&maxResults=20&type=video`;

// Instagram
const url = `https://graph.instagram.com/${INSTAGRAM_USER_ID}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count&access_token=${INSTAGRAM_ACCESS_TOKEN}&limit=20`;
```

### Adjust Cache Duration

In `api/feed.js`, change the cache time (default is 15 minutes):

```javascript
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
```

### Customize Styling

In `wordpress-widget.html`, modify the `<style>` section:

**Change colors**:
```css
.filter-btn.active {
  background: #your-color; /* Change button color */
}
```

**Change grid layout**:
```css
#social-feed-posts {
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); /* Smaller cards */
  gap: 20px; /* Change spacing */
}
```

**Change post card size**:
```css
.post-thumbnail {
  height: 250px; /* Taller thumbnails */
}
```

---

## 🔧 Troubleshooting

### API Not Working

1. **Check Environment Variables**:
   - Go to Vercel Dashboard > Your Project > Settings > Environment Variables
   - Verify all 4 variables are set correctly

2. **Check API Quotas**:
   - YouTube: 10,000 units/day (each request uses ~3 units)
   - Instagram: Check your app's rate limits

3. **Check CORS**:
   - Verify the API returns proper CORS headers
   - Test API directly in browser first

### WordPress Widget Not Showing

1. **Check Browser Console** (F12):
   - Look for JavaScript errors
   - Check if API URL is correct

2. **Verify API URL**:
   - Make sure you updated the API_URL in the widget code
   - Test the URL directly in your browser

3. **Check Theme Compatibility**:
   - Some themes may conflict with custom scripts
   - Try adding to a different template

### Instagram Token Expired

Instagram tokens expire every 60 days:

1. Go back to Facebook Developers
2. Generate a new token
3. Update in Vercel:
   - Dashboard > Project > Settings > Environment Variables
   - Edit `INSTAGRAM_ACCESS_TOKEN`
   - Add new value
4. Redeploy (or wait for cache to clear)

---

## 📱 Testing Your Feed

### Test the API Directly

1. **All Posts**:
   `https://your-project.vercel.app/api/feed`

2. **YouTube Only**:
   `https://your-project.vercel.app/api/feed?platform=youtube`

3. **Instagram Only**:
   `https://your-project.vercel.app/api/feed?platform=instagram`

### Test on WordPress

1. Open your WordPress page
2. Check browser console for errors (F12)
3. Verify posts are loading
4. Test filter buttons
5. Check mobile responsiveness

---

## 🚀 Next Steps / Enhancements

### Add More Features

1. **Pagination**: Handle more than 10-20 posts
2. **Search**: Add search functionality
3. **Load More Button**: Instead of showing all posts
4. **Lightbox**: Click thumbnails to view full images
5. **Auto-refresh**: Automatically update feed every X minutes

### Performance Optimization

1. **Image Optimization**: Use a CDN or WordPress image optimization
2. **Lazy Loading**: Already implemented for images
3. **Increase Cache**: Adjust cache duration based on your update frequency

### Security Improvements

1. **Rate Limiting**: Add rate limiting to your API
2. **Token Refresh**: Implement automatic Instagram token refresh
3. **Error Handling**: Enhanced error messages

---

## 📞 Support

If you encounter issues:

1. Check Vercel deployment logs
2. Check browser console for JavaScript errors
3. Verify all API credentials are correct
4. Test API endpoint directly in browser
5. Check API rate limits

---

## 🔄 Updating Your Feed

To make changes:

1. Edit files locally in VS Code
2. Test with `vercel dev`
3. Commit changes: `git commit -am "Your change description"`
4. Push to GitHub: `git push`
5. Vercel will automatically redeploy!

---

Good luck with your social media feed! 🎉
