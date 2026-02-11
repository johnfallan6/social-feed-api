// Vercel Serverless Function - Social Media Feed API
// Path: /api/feed.js

const CACHE_DURATION = 1 * 60 * 1000; // 1 minute
let cache = { data: null, timestamp: 0 };

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Environment variables
  const INSTAGRAM_USER_ID = process.env.INSTAGRAM_USER_ID;
  const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
  const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
  const YOUTUBE_CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID;

  // --- Runtime validation ---
  console.log('ENV CHECK:');
  console.log('INSTAGRAM_USER_ID =', INSTAGRAM_USER_ID);
  console.log('INSTAGRAM_ACCESS_TOKEN =', INSTAGRAM_ACCESS_TOKEN ? 'SET' : 'MISSING');
  console.log('YOUTUBE_API_KEY =', YOUTUBE_API_KEY ? 'SET' : 'MISSING');
  console.log('YOUTUBE_CHANNEL_ID =', YOUTUBE_CHANNEL_ID ? 'SET' : 'MISSING');

  if (!INSTAGRAM_USER_ID || INSTAGRAM_USER_ID === 'inspiringaccess') {
    console.error(
      "ERROR: INSTAGRAM_USER_ID is missing or still using 'inspiringaccess'. Must be numeric."
    );
    return res.status(500).json({
      error: "Instagram User ID misconfigured",
      message: "INSTAGRAM_USER_ID is missing or invalid. Must be numeric."
    });
  }

  // Serve from cache
  const now = Date.now();
  if (cache.data && now - cache.timestamp < CACHE_DURATION) {
    return res.status(200).json({ ...cache.data, cached: true, cacheAge: Math.floor((now - cache.timestamp) / 1000) });
  }

  try {
    const platform = req.query.platform;
    let allPosts = [];

    // Fetch YouTube posts
    if (!platform || platform === 'youtube') {
      allPosts = allPosts.concat(await fetchYouTubePosts(YOUTUBE_API_KEY, YOUTUBE_CHANNEL_ID));
    }

    // Fetch Instagram posts
    if (!platform || platform === 'instagram') {
      allPosts = allPosts.concat(await fetchInstagramPosts(INSTAGRAM_USER_ID, INSTAGRAM_ACCESS_TOKEN));
    }

    // Sort newest first
    allPosts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const response = {
      posts: allPosts,
      count: allPosts.length,
      lastUpdated: new Date().toISOString(),
      cached: false,
    };

    // Update cache
    cache = { data: response, timestamp: now };
    res.status(200).json(response);

  } catch (error) {
    console.error('Error fetching feed:', error);
    res.status(500).json({ error: 'Failed to fetch social media feed', message: error.message });
  }
};

// ------------------- Helper Functions -------------------

async function fetchYouTubePosts(YOUTUBE_API_KEY, YOUTUBE_CHANNEL_ID) {
  if (!YOUTUBE_API_KEY || !YOUTUBE_CHANNEL_ID) return [];

  try {
    const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
    searchUrl.search = new URLSearchParams({
      key: YOUTUBE_API_KEY,
      channelId: YOUTUBE_CHANNEL_ID,
      part: 'snippet',
      order: 'date',
      maxResults: '10',
      type: 'video',
    });

    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();
    if (!searchData.items) return [];

    const videoIds = searchData.items.map(i => i.id.videoId).join(',');
    const statsUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
    statsUrl.search = new URLSearchParams({
      key: YOUTUBE_API_KEY,
      id: videoIds,
      part: 'statistics',
    });

    const statsRes = await fetch(statsUrl);
    const statsData = await statsRes.json();
    const statsMap = {};
    if (statsData.items) {
      statsData.items.forEach(item => { statsMap[item.id] = item.statistics; });
    }

    return searchData.items.map(item => ({
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
        comments: parseInt(statsMap[item.id.videoId]?.commentCount || 0),
      },
    }));

  } catch (error) {
    console.error('YouTube API error:', error);
    return [];
  }
}

async function fetchInstagramPosts(INSTAGRAM_USER_ID, INSTAGRAM_ACCESS_TOKEN) {
  if (!INSTAGRAM_USER_ID || !INSTAGRAM_ACCESS_TOKEN) return [];

  try {
    console.log('Fetching Instagram posts for ID:', INSTAGRAM_USER_ID);

    const igUrl = new URL(`https://graph.instagram.com/${INSTAGRAM_USER_ID}/media`);
    igUrl.search = new URLSearchParams({
      fields: 'id,caption,media_type,media_url,permalink,timestamp',
      access_token: INSTAGRAM_ACCESS_TOKEN,
      limit: '10',
    });

    const response = await fetch(igUrl);
    const data = await response.json();

    if (!data.data) {
      console.error('Instagram API error:', data);
      return [];
    }

    return data.data.map(item => ({
      id: `instagram_${item.id}`,
      platform: 'instagram',
      title: item.caption
        ? item.caption.substring(0, 100) + (item.caption.length > 100 ? '...' : '')
        : 'Instagram Post',
      description: item.caption || '',
      thumbnail: item.media_url,
      url: item.permalink,
      timestamp: item.timestamp,
      mediaType: item.media_type,
    }));

  } catch (error) {
    console.error('Instagram API error:', error);
    return [];
  }
}
