import React from 'react';

class Picker extends React.PureComponent {
  constructor(props) {
    super(props);

    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(e) {
    this.props.onChange(e.target.value);
  }

  render() {
    const { value } = this.props;

    return (
      <div>
        <h1>{value}</h1>
        <select onChange={this.handleChange} value={value}>
          <option value="" disabled>
            Choose a subreddit
          </option>
          <option value="reactjs">reactjs</option>
          <option value="frontend">frontend</option>
        </select>
      </div>
    );
  }
}

export default Picker;
