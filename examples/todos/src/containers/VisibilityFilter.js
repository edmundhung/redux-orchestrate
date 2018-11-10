import { render } from '@redux-orchestrate/react-redux';
import visibilityFilterAggregate, { filters } from '../aggregates/visibilityFilter';

function selector(filter, command, props) {
  return {
    active: filter === props.filter,
    set: () => command.set(props.filter),
  };
}

export { filters };

export default render(visibilityFilterAggregate, selector);
