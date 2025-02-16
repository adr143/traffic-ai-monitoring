import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, register, logout } from "../auth/auth";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    if (isRegistering) {
      const success = await register(username, email, password);
      if (success) {
        alert("Registration successful. Check your email for confirmation.");
        setIsRegistering(false);
      } else {
        alert("Registration failed.");
      }
    } else {
      const success = await login(username, password);
      if (success) {
        alert("Logged in successfully");
        navigate("/");
      } else {
        alert("Invalid credentials");
      }
    }
  };

  const handleLogout = async () => {
    await logout();
    alert("Logged out successfully");
    navigate("/login");
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-bold mb-4">{isRegistering ? "Register" : "Login"}</h2>
        <form onSubmit={handleAuth} className="flex flex-col gap-4">
          <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)}
            className="border px-4 py-2 rounded-md" required />
          {isRegistering && (
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="border px-4 py-2 rounded-md" required />
          )}
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
            className="border px-4 py-2 rounded-md" required />
          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">{isRegistering ? "Register" : "Login"}</button>
        </form>
        <div className="mt-4">
          <button onClick={() => setIsRegistering(!isRegistering)} className="text-blue-500 underline">
            {isRegistering ? "Already have an account? Login" : "Don't have an account? Register"}
          </button>
        </div>
        {!isRegistering && (
          <button onClick={handleLogout} className="mt-4 bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 w-full">
            Logout
          </button>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
