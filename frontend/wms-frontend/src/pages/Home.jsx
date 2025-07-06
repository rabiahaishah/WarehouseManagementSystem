import React from "react";
import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  const username = localStorage.getItem("username") || "User";
  const role = localStorage.getItem("role") || "unknown";

  const menuSections = [
    {
      title: "📊 Insights & Monitoring",
      items: [{ name: "Dashboard", path: "/dashboard" }],
    },
    {
      title: "📦 Inventory Operations",
      items: [
        { name: "Inventory Management", path: "/inventory" },
        { name: "Inbound Management", path: "/inbound" },
        { name: "Outbound Management", path: "/outbound" },
      ],
    },
    {
      title: "🔧 Warehouse Tools",
      items: [
        { name: "Cycle Count", path: "/cycle-count" },
        { name: "Stock Forecasting", path: "/forecast" },
      ],
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("username");
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      {/* Title & Subtext */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-blue-800 mb-4">
          Warehouse Management System
        </h1>
        <p className="text-gray-600 max-w-2xl text-sm md:text-base mx-auto">
          Manage stock, monitor workflows, and make smarter decisions — all in one place.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Logged in as: <span className="font-medium">{username}</span>
        </p>
      </div>

      {/* Menu Section */}
      <div className="w-full max-w-2xl bg-white p-6 rounded-lg shadow-md space-y-6">
        {menuSections.map((section) => (
          <div key={section.title}>
            <h3 className="text-lg font-semibold text-gray-700 mb-3 text-center">
              {section.title}
            </h3>
            <div className="flex flex-col items-center space-y-3">
              {section.items.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="bg-blue-600 text-white text-base rounded hover:bg-blue-700 w-[500px] h-[40px]"
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Logout Button */}
        <div className="text-center pt-4">
          <button
            onClick={handleLogout}
            className="text-red-600 text-sm underline hover:text-red-800"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default Home;
