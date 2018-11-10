export function fetchRedditPosts(subreddit) {
  return fetch(`https://www.reddit.com/r/${subreddit}.json`)
    .then(response => response.json())
    .then(({ data }) => data.children);
}
