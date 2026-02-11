// Vercel Serverless Function - Check Environment Variables

module.exports = async function handler(req, res) {
  const INSTAGRAM_USER_ID = process.env.INSTAGRAM_USER_ID;
  const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
  const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
  const YOUTUBE_CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID;

  // Check for missing vars
  const missing = [];
  if (!INSTAGRAM_USER_ID) missing.push('INSTAGRAM_USER_ID');
  if (!INSTAGRAM_ACCESS_TOKEN) missing.push('INSTAGRAM_ACCESS_TOKEN');
  if (!YOUTUBE_API_KEY) missing.push('YOUTUBE_API_KEY');
  if (!YOUTUBE_CHANNEL_ID) missing.push('YOUTUBE_CHANNEL_ID');

  if (missing.length > 0) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing environment variables',
      missing
    });
  }

  // Test Instagram API
  let instagramValid = false;
  let instagramTest;
  try {
    const url = `https://graph.instagram.com/${INSTAGRAM_USER_ID}?fields=id,username&access_token=${INSTAGRAM_ACCESS_TOKEN}`;
    const response = await fetch(url);
    instagramTest = await response.json();
    instagramValid = !!instagramTest.id;
  } catch (err) {
    instagramTest = { error: err.message };
  }

  // Test YouTube API
  let youtubeValid = false;
  let youtubeTest;
  try {
    const url = `https://www.googleapis.com/youtube/v3/channels?key=${YOUTUBE_API_KEY}&id=${YOUTUBE_CHANNEL_ID}&part=snippet`;
    const response = await fetch(url);
    youtubeTest = await response.json();
    youtubeValid = youtubeTest.items?.length > 0;
  } catch (err) {
    youtubeTest = { error: err.message };
  }

  // Return result
  res.status(200).json({
    instagram: {
      userId: INSTAGRAM_USER_ID,
      accessTokenSet: !!INSTAGRAM_ACCESS_TOKEN,
      valid: instagramValid,
      result: instagramTest
    },
    youtube: {
      channelId: YOUTUBE_CHANNEL_ID,
      apiKeySet: !!YOUTUBE_API_KEY,
      valid: youtubeValid,
      result: youtubeTest
    }
  });
};
