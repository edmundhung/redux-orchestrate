import { connect } from '@redux-orchestrate/react-redux';
import Counter from '../components/Counter';
import counter from '../aggregates/counter';

function selector(state, command) {
  return {
    value: state,
    onIncrement: () => command.increment(),
    onDecrement: () => command.decrement(),
  };
}

export default connect(
  counter,
  selector,
)(Counter);
