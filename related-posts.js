function getRelatedPosts(currentPost, allPosts) {
  if (!currentPost || !currentPost.tags || !allPosts) return [];
  const currentTags = currentPost.tags;
  return allPosts
    .filter(post => post.id !== currentPost.id)
    .map(post => {
      const matchCount = (post.tags || []).filter(tag => currentTags.includes(tag)).length;
      return { post, matchCount };
    })
    .filter(item => item.matchCount > 0)
    .sort((a, b) => b.matchCount - a.matchCount)
    .slice(0, 5)
    .map(item => item.post);
}
module.exports = { getRelatedPosts };
