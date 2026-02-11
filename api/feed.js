import { useState, useEffect } from 'react';

const CACHE_KEY = 'feedCache';
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes in ms
const CACHE_WARNING_DURATION = 5000; // 5 seconds

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isCached, setIsCached] = useState(false);

  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { posts, lastUpdated, cachedAt } = JSON.parse(cached);
      const age = Date.now() - cachedAt;
      if (age < CACHE_DURATION) {
        setPosts(posts);
        setLastUpdated(lastUpdated);
        setIsCached(true);

        // Auto-hide cached warning after 5s
        setTimeout(() => setIsCached(false), CACHE_WARNING_DURATION);
        return;
      }
    }
    fetchFeed(); // fetch fresh if no cache or expired
  }, []);

  async function fetchFeed(hardRefresh = false) {
    try {
      setLoading(true);
      const url = `/api/feed${hardRefresh ? '?hardRefresh=true' : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      setPosts(data.posts);
      setLastUpdated(data.lastUpdated);
      setIsCached(false); // fresh fetch is not cached

      // save to localStorage cache
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          posts: data.posts,
          lastUpdated: data.lastUpdated,
          cachedAt: Date.now(),
        })
      );
    } catch (err) {
      console.error('Failed to fetch feed:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Feed</h2>
        <button
          onClick={() => fetchFeed(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh Feed'}
        </button>
      </div>

      <p className="text-sm text-gray-500 mb-1">
        Last Updated: {lastUpdated ? new Date(lastUpdated).toLocaleString() : '—'}
      </p>
      {isCached && (
        <p className="text-xs text-yellow-600 mb-2 transition-opacity duration-500">
          ⚠️ Showing cached data. Click "Refresh Feed" for live updates.
        </p>
      )}

      <div className="grid gap-4">
        {posts.map(post => (
          <div key={post.id} className="border rounded p-2">
            <a href={post.url} target="_blank" rel="noopener noreferrer">
              <img
                src={post.thumbnail}
                alt={post.title}
                className="w-full h-auto rounded mb-2"
              />
              <h3 className="font-semibold">{post.title}</h3>
            </a>
            {post.metrics && (
              <div className="text-sm text-gray-600 mt-1">
                {post.metrics.views !== null && <>Views: {post.metrics.views} </>}
                {post.metrics.likes !== null && <>Likes: {post.metrics.likes} </>}
                {post.metrics.comments !== null && <>Comments: {post.metrics.comments}</>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
