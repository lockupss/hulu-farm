const forum = require('../data/forum.json')

function normalizePost(p) {
  const post = { ...p }
  if (!post.replies || Array.isArray(post.replies) === false) post.replies = []
  post.likes = typeof post.likes === 'number' ? post.likes : (Array.isArray(post.liked_by) ? post.liked_by.length : (post.likes ? Number(post.likes) : 0))
  post.liked_by = Array.isArray(post.liked_by) ? post.liked_by : []
  post.category = post.category || 'General'
  post.replies = (post.replies || []).map((r) => ({ ...(r || {}), replies: Array.isArray(r && r.replies) ? r.replies : [], likes: typeof (r && r.likes) === 'number' ? r.likes : 0, liked_by: Array.isArray(r && r.liked_by) ? r.liked_by : [] }))
  return post
}

console.log(JSON.stringify(forum.map(normalizePost), null, 2))
