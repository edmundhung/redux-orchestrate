import { connect } from 'react-redux';
import Counter from '../components/Counter';

function mapStateToProps(state) {
  return {
    value: state.counter,
  };
}

const actionCreators = {
  onIncrement: () => ({ type: 'INCREMENT' }),
  onDecrement: () => ({ type: 'DECREMENT' }),
};

export default connect(
  mapStateToProps,
  actionCreators,
)(Counter);
