import React from 'react';
import VisibilityFilter, { filters } from '../containers/VisibilityFilter';

function Button({ set, active, children }) {
  return (
    <button onClick={set} disabled={active}>
      {children}
    </button>
  );
}

function Filters() {
  return (
    <div>
      <span>Show: </span>
      <VisibilityFilter filter={filters.SHOW_ALL} component={Button}>
        All
      </VisibilityFilter>
      <VisibilityFilter filter={filters.SHOW_ACTIVE} component={Button}>
        Active
      </VisibilityFilter>
      <VisibilityFilter filter={filters.SHOW_COMPLETED} component={Button}>
        Completed
      </VisibilityFilter>
    </div>
  );
}

export default Filters;
