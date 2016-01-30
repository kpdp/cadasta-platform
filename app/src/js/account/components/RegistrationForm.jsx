import React from 'react';

const propTypes = {
  accountRegister: React.PropTypes.func.isRequired,
};

class RegistrationForm extends React.Component {
  constructor(props) {
    super(props);

    this.handleFormSubmit = this.handleFormSubmit.bind(this);
  }

  handleFormSubmit(e) {
    e.preventDefault();
    this.props.accountRegister({
      username: this.refs.username.value,
      email: this.refs.email.value,
      password: this.refs.password.value,
      password_repeat: this.refs.password_repeat.value,
      first_name: this.refs.first_name.value,
      last_name: this.refs.last_name.value,
    });
  }

  render() {
    return (
      <form className="account-register" onSubmit={this.handleFormSubmit}>
        <label htmlFor="username">Username</label>
        <input name="username" ref="username" />

        <label htmlFor="email">Email</label>
        <input name="email" ref="email" type="email" />

        <label htmlFor="password">Password</label>
        <input name="password" ref="password" type="password" />

        <label htmlFor="password_repeat">Password</label>
        <input name="password_repeat" ref="password_repeat" type="password" />

        <label htmlFor="first_name">First name</label>
        <input name="first_name" ref="first_name" />

        <label htmlFor="last_name">Last name</label>
        <input name="last_name" ref="last_name" />

        <button type="submit">Register</button>
      </form>
    );
  }
}

RegistrationForm.propTypes = propTypes;

export default RegistrationForm;