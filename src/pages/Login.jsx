import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../assets/styles/auth.css";

const Login = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const users = JSON.parse(localStorage.getItem("groomupUsers")) || [];

    const user = users.find(
      (u) =>
        u.email === form.email &&
        u.password === form.password
    );

    if (!user) {
      alert("Invalid email or password");
      return;
    }

    localStorage.setItem("groomupUser", JSON.stringify(user));
    navigate("/");
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Login to GROOMUP</h2>

        <form onSubmit={handleSubmit}>
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

          <button type="submit">Login</button>
        </form>

        <p className="auth-switch">
          Don’t have an account?{" "}
          <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
