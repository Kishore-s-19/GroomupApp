import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "../assets/styles/auth.css";

const Register = () => {
  const navigate = useNavigate();
  const { register, error: authError } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await register(form);

    if (result.success) {
      navigate("/");
    } else {
      setError(result.error?.message || "Registration failed");
    }
    
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Create your GROOMUP account</h2>

        {(error || authError) && (
          <div className="auth-error">
            {error || authError}
          </div>
        )}

          <form onSubmit={handleSubmit}>
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              required
              minLength={2}
              maxLength={100}
              value={form.name}
              onChange={handleChange}
              disabled={loading}
            />

            <input
              type="email"
              name="email"
              placeholder="Email address"
              required
              value={form.email}
              onChange={handleChange}
              disabled={loading}
            />

            <input
              type="tel"
              name="phone"
              placeholder="Phone Number"
              required
              minLength={7}
              maxLength={20}
              value={form.phone}
              onChange={handleChange}
              disabled={loading}
            />

            <input
              type="password"
              name="password"
              placeholder="Password"
              required
              minLength={8}
              maxLength={100}
              value={form.password}
              onChange={handleChange}
              disabled={loading}
            />


          <button type="submit" disabled={loading}>
            {loading ? "Creating Account..." : "Register"}
          </button>
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
