import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../assets/styles/auth.css";

const Register = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const users = JSON.parse(localStorage.getItem("groomupUsers")) || [];

    const userExists = users.some(
      (u) => u.email === form.email
    );

    if (userExists) {
      alert("User already exists");
      return;
    }

    const newUser = {
      name: form.name,
      email: form.email,
      password: form.password,
    };

    users.push(newUser);
    localStorage.setItem("groomupUsers", JSON.stringify(users));
    localStorage.setItem("groomupUser", JSON.stringify(newUser));

    navigate("/");
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Create your GROOMUP account</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            required
            value={form.name}
            onChange={handleChange}
          />

          <input
            type="email"
            name="email"
            placeholder="Email address"
            required
            value={form.email}
            onChange={handleChange}
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            required
            value={form.password}
            onChange={handleChange}
          />

          <button type="submit">Register</button>
        </form>

        <p className="auth-switch">
          Already have an account?{" "}
          <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
