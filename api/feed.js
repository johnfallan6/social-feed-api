const CACHE_DURATION = 15 * 60 * 1000;
let cache = { data: null, timestamp: 0 };

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://inspiringaccess.org');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const now = Date.now();
  const hardRefresh = req.query.hardRefresh === 'true';

  if (!hardRefresh && cache.data && now - cache.timestamp < CACHE_DURATION) {
    return res.status(200).json(cache.data);
  }

  try {
    const posts = [];

    const yt = await fetchYouTube();
    const ig = await fetchInstagram();

    posts.push(...yt, ...ig);
    posts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const response = {
      posts,
      lastUpdated: new Date().toISOString()
    };

    cache = { data: response, timestamp: now };

    res.status(200).json(response);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

async function fetchYouTube() {
  const key = process.env.YOUTUBE_API_KEY;
  const channel = process.env.YOUTUBE_CHANNEL_ID;
  if (!key || !channel) return [];

  const search = await fetch(`https://www.googleapis.com/youtube/v3/search?key=${key}&channelId=${channel}&part=snippet&order=date&maxResults=5&type=video`);
  const sdata = await search.json();

  return sdata.items.map(v => ({
    id: 'yt_' + v.id.videoId,
    title: v.snippet.title,
    thumbnail: v.snippet.thumbnails.high.url,
    url: `https://youtube.com/watch?v=${v.id.videoId}`,
    timestamp: v.snippet.publishedAt,
    metrics: {}
  }));
}

async function fetchInstagram() {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  const user = process.env.INSTAGRAM_USER_ID;
  if (!token || !user) return [];

  const res = await fetch(`https://graph.instagram.com/${user}/media?fields=id,caption,media_url,permalink,timestamp&access_token=${token}&limit=5`);
  const data = await res.json();
  if (!data.data) return [];

  return data.data.map(p => ({
    id: 'ig_' + p.id,
    title: p.caption || 'Instagram Post',
    thumbnail: p.media_url,
    url: p.permalink,
    timestamp: p.timestamp,
    metrics: {}
  }));
}
