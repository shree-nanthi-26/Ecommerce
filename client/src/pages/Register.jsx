import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      await register(name, email, password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Could not register user");
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1115] flex items-center justify-center px-4 py-10 text-white">
      <div className="w-full max-w-md rounded-3xl border border-[#2D333D] bg-[#1D222C] p-8 shadow-xl">
        <h1 className="text-3xl font-bold">Register</h1>
        <p className="mt-2 text-sm text-[#B8BEC9]">Create your ElectroMart account.</p>

        {error && (
          <div className="mt-6 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm font-semibold text-[#B8BEC9]">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-[#2D333D] bg-[#0F1115] px-4 py-3 text-white outline-none"
              required
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-[#B8BEC9]">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-[#2D333D] bg-[#0F1115] px-4 py-3 text-white outline-none"
              required
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-[#B8BEC9]">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-[#2D333D] bg-[#0F1115] px-4 py-3 text-white outline-none"
              required
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-[#B8BEC9]">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-[#2D333D] bg-[#0F1115] px-4 py-3 text-white outline-none"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-2xl bg-green-500 px-4 py-3 text-white font-semibold transition hover:bg-green-600"
          >
            Register
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#B8BEC9]">
          Already have an account?{' '}
          <Link to="/login" className="text-green-400 hover:text-green-300">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
