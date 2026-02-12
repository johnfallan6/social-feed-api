const CACHE_DURATION = 10 * 60 * 1000;
let cache = { data: null, timestamp: 0 };

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*'); // Allow all origins for now
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const now = Date.now();
  const hardRefresh = req.query.hardRefresh === 'true' || req.query.t;

  if (!hardRefresh && cache.data && now - cache.timestamp < CACHE_DURATION) {
    return res.status(200).json({ ...cache.data, cached: true });
  }

  try {
    const posts = [];

    const yt = await fetchYouTube();
    const ig = await fetchInstagram();

    posts.push(...yt, ...ig);
    posts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const response = {
      posts,
      count: posts.length,
      lastUpdated: new Date().toISOString(),
      cached: false
    };

    cache = { data: response, timestamp: now };

    res.status(200).json(response);
  } catch (e) {
    console.error('API Error:', e);
    res.status(500).json({ error: e.message });
  }
};

async function fetchYouTube() {
  const key = process.env.YOUTUBE_API_KEY;
  const channel = process.env.YOUTUBE_CHANNEL_ID;
  if (!key || !channel) {
    console.warn('YouTube credentials missing');
    return [];
  }

  try {
    // Get video list
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?key=${key}&channelId=${channel}&part=snippet&order=date&maxResults=10&type=video`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (!searchData.items) return [];

    // Get video statistics
    const videoIds = searchData.items.map(v => v.id.videoId).join(',');
    const statsUrl = `https://www.googleapis.com/youtube/v3/videos?key=${key}&id=${videoIds}&part=statistics`;
    const statsRes = await fetch(statsUrl);
    const statsData = await statsRes.json();

    // Create stats map
    const statsMap = {};
    if (statsData.items) {
      statsData.items.forEach(item => {
        statsMap[item.id] = item.statistics;
      });
    }

    return searchData.items.map(v => ({
      id: 'youtube_' + v.id.videoId,
      platform: 'youtube',
      title: v.snippet.title,
      description: v.snippet.description,
      thumbnail: v.snippet.thumbnails.high?.url || v.snippet.thumbnails.medium?.url,
      url: `https://youtube.com/watch?v=${v.id.videoId}`,
      timestamp: v.snippet.publishedAt,
      metrics: {
        views: parseInt(statsMap[v.id.videoId]?.viewCount || 0),
        likes: parseInt(statsMap[v.id.videoId]?.likeCount || 0),
        comments: parseInt(statsMap[v.id.videoId]?.commentCount || 0)
      }
    }));
  } catch (error) {
    console.error('YouTube fetch error:', error);
    return [];
  }
}

async function fetchInstagram() {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  const user = process.env.INSTAGRAM_USER_ID;
  if (!token || !user) {
    console.warn('Instagram credentials missing');
    return [];
  }

  try {
    const url = `https://graph.instagram.com/${user}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count&access_token=${token}&limit=10`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.data) {
      console.error('Instagram API error:', data);
      return [];
    }

    return data.data.map(p => ({
      id: 'instagram_' + p.id,
      platform: 'instagram',
      title: p.caption ? p.caption.substring(0, 100) + (p.caption.length > 100 ? '...' : '') : 'Instagram Post',
      description: p.caption || '',
      thumbnail: p.media_type === 'VIDEO' ? p.thumbnail_url : p.media_url,
      url: p.permalink,
      timestamp: p.timestamp,
      mediaType: p.media_type,
      metrics: {
        likes: p.like_count || 0,
        comments: p.comments_count || 0
      }
    }));
  } catch (error) {
    console.error('Instagram fetch error:', error);
    return [];
  }
}