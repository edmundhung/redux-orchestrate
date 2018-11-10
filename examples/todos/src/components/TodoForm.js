import React from 'react';

class TodoForm extends React.PureComponent {
  constructor(props) {
    super(props);

    this.input = React.createRef();
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleSubmit(e) {
    e.preventDefault();

    const { value } = this.input.current;

    this.props.onSubmit(value);
    this.input.current.value = '';
  }

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <input ref={this.input} />
        <button type="submit">Add Todo</button>
      </form>
    );
  }
}

export default TodoForm;
