import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { hasPermission } from "../utils/permission";

function CycleCount() {
  const navigate = useNavigate();
  const token = localStorage.getItem("access_token");
  const [products, setProducts] = useState([]);
  const [counts, setCounts] = useState([]);
  const [formData, setFormData] = useState({
    product: "",
    counted_quantity: 0,
    reason: "",
  });

  const [systemQty, setSystemQty] = useState(0);
  const [discrepancy, setDiscrepancy] = useState(0);

  useEffect(() => {
    const init = async () => {
      await fetchProducts();
      await fetchCounts();
    };
    init();
  }, []);

  const fetchProducts = async () => {
    const res = await fetch("http://127.0.0.1:8000/api/products/?is_archived=false", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setProducts(data.results || data);
  };

  const fetchCounts = async () => {
    const res = await fetch("http://127.0.0.1:8000/api/cycle-counts/", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setCounts(data);
  };

  const handleProductChange = (productId) => {
    const selected = products.find((p) => p.id === parseInt(productId));
    setFormData({ ...formData, product: productId });

    if (selected) {
      setSystemQty(selected.quantity);
      setDiscrepancy(formData.counted_quantity - selected.quantity);
    }
  };

  const handleCountChange = (qty) => {
    const parsedQty = parseInt(qty);
    setFormData({ ...formData, counted_quantity: parsedQty });
    setDiscrepancy(parsedQty - systemQty);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      product: parseInt(formData.product),
      counted_quantity: parseInt(formData.counted_quantity),
      system_quantity: systemQty,
      discrepancy: discrepancy,
      reason: formData.reason,
    };

    const res = await fetch("http://127.0.0.1:8000/api/cycle-counts/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json();
      console.error("Cycle count error:", err);
      alert("Failed: " + JSON.stringify(err));
      return;
    }

    alert("Cycle count recorded.");
    setFormData({ product: "", counted_quantity: 0, reason: "" });
    setSystemQty(0);
    setDiscrepancy(0);
    fetchCounts();
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Cycle Count & Reconciliation</h1>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded shadow mb-6"
      >
        <select
          value={formData.product}
          onChange={(e) => handleProductChange(e.target.value)}
          className="p-2 border"
          required
        >
          <option value="">Select Product</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.sku})
            </option>
          ))}
        </select>

        <input
          type="number"
          className="p-2 border"
          placeholder="Counted Quantity"
          value={formData.counted_quantity}
          onChange={(e) => handleCountChange(e.target.value)}
          required
        />

        <input
          className="p-2 border bg-gray-50"
          value={systemQty}
          disabled
          placeholder="System Quantity"
        />

        <input
          className={`p-2 border bg-gray-50 ${
            discrepancy !== 0 ? "text-red-600 font-semibold" : ""
          }`}
          value={discrepancy}
          disabled
          placeholder="Discrepancy"
        />

        <textarea
          className="md:col-span-2 p-2 border"
          placeholder="Reason for discrepancy"
          value={formData.reason}
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
        />

        <div className="md:col-span-2 text-right">
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
            Submit Cycle Count
          </button>
        </div>
      </form>

      {/* Count History */}
      <h2 className="text-lg font-semibold mb-2">Previous Counts</h2>
      <table className="w-full text-sm border">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="p-2">Product</th>
            <th>Counted</th>
            <th>System</th>
            <th>Discrepancy</th>
            <th>Reason</th>
            <th>Counted By</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {counts.map((c) => {
            const product = products.find((p) => p.id === c.product);
            return (
              <tr key={c.id} className="border-t">
                <td className="p-2">{product ? product.name : "Unknown"}</td>
                <td>{c.counted_quantity}</td>
                <td>{c.system_quantity}</td>
                <td>{c.discrepancy}</td>
                <td>{c.reason || "-"}</td>
                <td>{c.counted_by || "N/A"}</td>
                <td>{new Date(c.counted_at).toLocaleString()}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      
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

export default CycleCount;
