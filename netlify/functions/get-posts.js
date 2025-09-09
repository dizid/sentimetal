// netlify/functions/get-posts.js
// Replaces get-tweets.js. Fetches last 20 Reddit posts for a user. Protects API credentials.
// Uses node-fetch for HTTP requests. Install: npm i node-fetch@2

const fetch = require('node-fetch')

exports.handler = async (event) => {
  const username = event.queryStringParameters.username
  if (!username) {
    return { statusCode: 400, body: 'Missing username' }
  }

  const clientId = process.env.REDDIT_CLIENT_ID // From Netlify env vars.
  const clientSecret = process.env.REDDIT_CLIENT_SECRET // From Netlify env vars.
  const userAgent = 'VueSentimentAnalyzer/1.0' // Unique user-agent for your app.

  try {
    // Step 1: Get OAuth token (client credentials for read-only access).
    const authRes = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': userAgent
      },
      body: 'grant_type=client_credentials'
    })
    const { access_token } = await authRes.json()
    if (!access_token) throw new Error('Failed to authenticate')

    // Step 2: Get last 20 posts by user.
    const postsRes = await fetch(`https://oauth.reddit.com/user/${username}/submitted?limit=20`, {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'User-Agent': userAgent
      }
    })
    const postsData = await postsRes.json()
    const posts = postsData.data?.children.map(post => post.data.selftext || post.data.title) || []
    return { statusCode: 200, body: JSON.stringify(posts) }
  } catch (error) {
    return { statusCode: 500, body: error.message }
  }
}