import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const login = async (e) => {
    e.preventDefault();

    const res = await fetch("http://127.0.0.1:8000/api/token/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (data.access) {
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      localStorage.setItem("username", data.user.username);
      localStorage.setItem("user_role", data.user.role); 

      alert("Login successful!");

      setTimeout(() => {
        navigate("/home");
      }, 100);
    } else {
      alert("Login failed. Please check your credentials.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      {/* Titles */}
      <div className="mb-8 text-center">
        <h2 className="text-xl text-gray-600">Welcome to</h2>
        <h1 className="text-3xl md:text-4xl font-bold text-blue-800">
          Warehouse Management System
        </h1>
      </div>

      {/* Form */}
      <form
        onSubmit={login}
        className="bg-white p-6 rounded shadow-md w-full max-w-xl"
      >
        <div className="flex flex-col items-center space-y-4">
          <input
            type="text"
            placeholder="Username"
            className="border p-2 w-[700px] h-[40px] mx-auto"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="border p-2 w-[700px] h-[40px] mx-auto"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            className="w-[200px] h-[30px] bg-blue-600 text-white p-2 rounded hover:bg-blue-700 mx-auto"
          >
            Login
          </button>
        </div>
      </form>
    </div>
  );
}

export default Login;
