import React from 'react';
import { connect } from '@redux-orchestrate/react-redux';
import appService from '../services/app';
import Picker from '../components/Picker';
import Posts from '../components/Posts';

function App(props) {
  const { subreddit, selectSubreddit, invalidateSubreddit, posts, isFetched, isFetching } = props;

  return (
    <div>
      <Picker value={subreddit} onChange={selectSubreddit} />
      {subreddit !== '' && (
        <div>
          <p>
            {isFetched && (
              <button onClick={invalidateSubreddit} disabled={isFetching}>
                Refresh
              </button>
            )}
          </p>
          {posts.length === 0 ? (
            <h2>{isFetched ? 'Empty' : 'Loading...'}</h2>
          ) : (
            <div style={{ opacity: isFetching ? 0.5 : 1 }}>
              <Posts posts={posts} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function selector(model, command) {
  return {
    subreddit: model.subreddit,
    selectSubreddit: command.selectSubreddit,
    invalidateSubreddit: command.invalidateSubreddit,
    posts: model.posts,
    isFetched: model.isFetched,
    isFetching: model.isFetching,
  };
}

export default connect(
  appService,
  selector,
)(App);
