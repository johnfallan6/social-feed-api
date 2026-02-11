module.exports = async (req, res) => {
  res.status(200).json({
    INSTAGRAM_USER_ID: process.env.INSTAGRAM_USER_ID || 'MISSING',
    INSTAGRAM_ACCESS_TOKEN: process.env.INSTAGRAM_ACCESS_TOKEN ? 'SET' : 'MISSING'
  });
};
