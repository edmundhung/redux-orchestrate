import React from 'react';

function Posts({ posts }) {
  return (
    <ul>
      {posts.map(({ data }, i) => (
        <li key={i}>
          <a href={data.url} target="_blank" rel="noopener noreferrer">
            {data.title}
          </a>
        </li>
      ))}
    </ul>
  );
}

export default Posts;
