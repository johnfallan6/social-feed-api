module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://inspiringaccess.org');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  res.status(200).json({ message: 'API is working' });
};
