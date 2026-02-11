// Vercel Serverless Function - Social Media Feed API
// Path: /api/feed.js

const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes
let cache = {
  data: null,
  timestamp: 0
};

module.exports = async function handler(req, res) {
  // Enable CORS for WordPress site
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Check cache
  const now = Date.now();
  if (cache.data && (now - cache.timestamp) < CACHE_DURATION) {
    return res.status(200).json({
      ...cache.data,
      cached: true,
      cacheAge: Math.floor((now - cache.timestamp) / 1000)
    });
  }

  try {
    const platform = req.query.platform;
    let allPosts = [];

    // Fetch YouTube posts
    if (!platform || platform === 'youtube') {
      const youtubePosts = await fetchYouTubePosts();
      allPosts = allPosts.concat(youtubePosts);
    }

    // Fetch Instagram posts
    if (!platform || platform === 'instagram') {
      const instagramPosts = await fetchInstagramPosts();
      allPosts = allPosts.concat(instagramPosts);
    }

    // Sort by date (newest first)
    allPosts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const response = {
      posts: allPosts,
      count: allPosts.length,
      lastUpdated: new Date().toISOString(),
      cached: false
    };

    // Update cache
    cache = {
      data: response,
      timestamp: now
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching feed:', error);
    res.status(500).json({ 
      error: 'Failed to fetch social media feed',
      message: error.message 
    });
  }
}

async function fetchYouTubePosts() {
  const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
  const YOUTUBE_CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID;

  console.log('YouTube API Key length:', YOUTUBE_API_KEY?.length);
  console.log('YouTube Channel ID:', YOUTUBE_CHANNEL_ID);

  if (!YOUTUBE_API_KEY || !YOUTUBE_CHANNEL_ID) {
    console.warn('YouTube credentials not configured');
    return [];
  }

  try {
    const url = `https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&channelId=${YOUTUBE_CHANNEL_ID}&part=snippet&order=date&maxResults=10&type=video`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (!data.items) {
      return [];
    }

    const videoIds = data.items.map(item => item.id.videoId).join(',');
    const statsUrl = `https://www.googleapis.com/youtube/v3/videos?key=${YOUTUBE_API_KEY}&id=${videoIds}&part=statistics`;
    
    const statsResponse = await fetch(statsUrl);
    const statsData = await statsResponse.json();

    const statsMap = {};
    if (statsData.items) {
      statsData.items.forEach(item => {
        statsMap[item.id] = item.statistics;
      });
    }

    return data.items.map(item => ({
      id: `youtube_${item.id.videoId}`,
      platform: 'youtube',
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      timestamp: item.snippet.publishedAt,
      metrics: {
        views: parseInt(statsMap[item.id.videoId]?.viewCount || 0),
        likes: parseInt(statsMap[item.id.videoId]?.likeCount || 0),
        comments: parseInt(statsMap[item.id.videoId]?.commentCount || 0)
      }
    }));
  } catch (error) {
    console.error('YouTube API error:', error);
    return [];
  }
}

async function fetchInstagramPosts() {
  const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
  const INSTAGRAM_USER_ID = process.env.INSTAGRAM_USER_ID;

  if (!INSTAGRAM_ACCESS_TOKEN || !INSTAGRAM_USER_ID) {
    console.warn('Instagram credentials not configured');
    return [];
  }

  try {
    const url = `https://graph.instagram.com/${INSTAGRAM_USER_ID}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count&access_token=${INSTAGRAM_ACCESS_TOKEN}&limit=10`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (!data.data) {
      console.error('Instagram API error:', data);
      return [];
    }

    return data.data.map(item => ({
      id: `instagram_${item.id}`,
      platform: 'instagram',
      title: item.caption ? item.caption.substring(0, 100) + (item.caption.length > 100 ? '...' : '') : 'Instagram Post',
      description: item.caption || '',
      thumbnail: item.media_type === 'VIDEO' ? item.thumbnail_url : item.media_url,
      url: item.permalink,
      timestamp: item.timestamp,
      mediaType: item.media_type,
      metrics: {
        likes: item.like_count || 0,
        comments: item.comments_count || 0
      }
    }));
  } catch (error) {
    console.error('Instagram API error:', error);
    return [];
  }
}
