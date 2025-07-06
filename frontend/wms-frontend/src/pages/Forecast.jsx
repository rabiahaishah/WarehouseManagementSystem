import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { hasPermission } from "../utils/permission";

function Forecast() {
  const navigate = useNavigate();
  const token = localStorage.getItem("access_token");
  const [products, setProducts] = useState([]);
  const [selectedSKU, setSelectedSKU] = useState("");
  const [forecast, setForecast] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const res = await fetch("http://127.0.0.1:8000/api/products/?is_archived=false", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setProducts(data.results || data);
  };

  const handleFetchForecast = async () => {
    const res = await fetch(`http://127.0.0.1:8000/api/forecast/${selectedSKU}/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    setForecast(data);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Stock Forecasting</h1>

      {/* Product Selector */}
      <div className="flex flex-col md:flex-row gap-4 items-center mb-6">
        <select
          value={selectedSKU}
          onChange={(e) => setSelectedSKU(e.target.value)}
          className="p-2 border w-full md:w-1/3"
        >
          <option value="">Select a product</option>
          {products.map((p) => (
            <option key={p.id} value={p.sku}>
              {p.name} ({p.sku})
            </option>
          ))}
        </select>
        <button
          disabled={!selectedSKU}
          onClick={handleFetchForecast}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Get Forecast
        </button>
      </div>

      {/* Forecast Result */}
      {forecast && (
        <div className="bg-white p-6 rounded shadow-md max-w-xl">
          <h2 className="text-lg font-semibold mb-2">{forecast.product}</h2>

          <div className="space-y-2 text-sm">
            <p>
              <strong>SKU:</strong> {forecast.sku}
            </p>
            <p>
              <strong>Current Stock:</strong>{" "}
              <span className="font-semibold">{forecast.stock}</span>
            </p>
            <p>
              <strong>Daily Usage Average:</strong>{" "}
              <span className="text-blue-600 font-semibold">{forecast.daily_average}</span>
            </p>
            <p>
              <strong>Estimated Days Until Depletion:</strong>{" "}
              <span
                className={`font-semibold ${
                  forecast.forecast_days_left < 5 ? "text-red-600" : "text-green-600"
                }`}
              >
                {forecast.forecast_days_left}
              </span>
            </p>
          </div>
        </div>
      )}
      
    {/* Back to Home Button */}
      <div className="mt-6 text-right">
        <button
          onClick={() => navigate("/home")}
          className="bg-gray-200 text-sm px-4 py-2 rounded hover:bg-gray-300"
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );
}

export default Forecast;
