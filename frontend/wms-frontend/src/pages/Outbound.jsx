import React, { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useNavigate } from "react-router-dom"; 
import { hasPermission } from "../utils/permission";

function Outbound() {
  const navigate = useNavigate();
  const token = localStorage.getItem("access_token");
  const [scanning, setScanning] = useState(false);
  const [editingOutbound, setEditingOutbound] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [products, setProducts] = useState([]);
  const [outbounds, setOutbounds] = useState([]);
  const [csvFile, setCsvFile] = useState(null);
  const [formData, setFormData] = useState({
    product: "",
    customer: "",
    quantity: 1,
    so_reference: "",
    dispatch_date: "",
    attachment: null,
  });

  useEffect(() => {
    fetchProducts();
    fetchOutbounds();
  }, []);

  useEffect(() => {
    let scanner;
    if (scanning) {
      scanner = new Html5QrcodeScanner("qr-reader", { fps: 10, qrbox: 250 }, false);
      scanner.render(
        (decodedText) => {
          const matched = products.find((p) => p.sku === decodedText);
          if (matched) {
            setFormData((prev) => ({ ...prev, product: matched.id }));
            alert(`Product matched: ${matched.name} (${matched.sku})`);
          } else {
            alert(`No product found with SKU: ${decodedText}`);
          }
          scanner.clear().then(() => setScanning(false));
        },
        (error) => {
          console.warn("Scan error:", error);
        }
      );
    }

    return () => {
      if (scanner) {
        scanner.clear().catch((e) => console.error("Scanner cleanup error", e));
      }
    };
  }, [scanning, products]);

  const fetchProducts = async () => {
    const res = await fetch("http://127.0.0.1:8000/api/products/?is_archived=false", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setProducts(data.results || data);
  };

  const fetchOutbounds = async () => {
    const res = await fetch("http://127.0.0.1:8000/api/outbounds/", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setOutbounds(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const submitData = new FormData();
    for (let key in formData) {
      if (key === "attachment") {
        if (formData.attachment) submitData.append("attachment", formData.attachment);
      } else {
        submitData.append(key, formData[key]);
      }
    }

    const res = await fetch("http://127.0.0.1:8000/api/outbounds/", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: submitData,
    });

    if (res.status === 400) {
      const error = await res.json();
      alert(error.non_field_errors?.[0] || "Outbound failed.");
      return;
    }

    alert("Outbound recorded!");
    setFormData({
      product: "",
      customer: "",
      quantity: 1,
      so_reference: "",
      dispatch_date: "",
      attachment: null,
    });
    fetchOutbounds();
  };

  const handleDeleteOutbound = async (id) => {
    if (!window.confirm("Delete this outbound entry?")) return;
    await fetch(`http://127.0.0.1:8000/api/outbounds/${id}/`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    fetchOutbounds();
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const updateData = new FormData();
    for (let key in formData) {
      if (formData[key]) updateData.append(key, formData[key]);
    }

    await fetch(`http://127.0.0.1:8000/api/outbounds/${editingOutbound.id}/`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      body: updateData,
    });

    alert("Outbound updated.");
    setShowEditForm(false);
    fetchOutbounds();
  };

  const handleCsvUpload = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append("file", csvFile);

    const res = await fetch("http://127.0.0.1:8000/api/upload-outbounds/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}` },
      body: data,
    });

    const response = await res.json();
    alert(response.message || "CSV uploaded.");
    fetchOutbounds();
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Outbound Management</h1>

      <button
        onClick={() => setScanning(!scanning)}
        className="mb-4 bg-purple-600 text-white px-4 py-2 rounded"
      >
        {scanning ? "Stop Scanning" : "📷 Scan Barcode to Select Product"}
      </button>

      {scanning && <div id="qr-reader" className="mb-6"></div>}

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded shadow mb-6"
        encType="multipart/form-data"
      >
        <select
          value={formData.product}
          onChange={(e) => setFormData({ ...formData, product: e.target.value })}
          className="p-2 border"
          required
        >
          <option value="">Select Product</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.sku}) - {p.quantity} left
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Customer"
          className="p-2 border"
          value={formData.customer}
          onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
          required
        />

        <input
          type="number"
          placeholder="Quantity"
          className="p-2 border"
          value={formData.quantity}
          onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
          required
        />

        <input
          type="text"
          placeholder="SO Reference"
          className="p-2 border"
          value={formData.so_reference}
          onChange={(e) => setFormData({ ...formData, so_reference: e.target.value })}
        />

        <input
          type="date"
          className="p-2 border"
          value={formData.dispatch_date}
          onChange={(e) => setFormData({ ...formData, dispatch_date: e.target.value })}
          required
        />

        <input
          type="file"
          className="p-2 border"
          onChange={(e) => setFormData({ ...formData, attachment: e.target.files[0] })}
        />

        <div className="md:col-span-2 text-right">
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
            Submit Outbound
          </button>
        </div>
      </form>

      {hasPermission(["admin"]) && (
        <form
          onSubmit={handleCsvUpload}
          className="mb-6 flex gap-2 items-center"
          encType="multipart/form-data"
        >
          <input
            type="file"
            accept=".csv"
            className="p-2 border"
            onChange={(e) => setCsvFile(e.target.files[0])}
            required
          />
          <button type="submit" className="bg-green-600 text-white px-4 py-1 rounded">
            Upload CSV
          </button>
        </form>
      )}

      <h2 className="text-lg font-semibold mb-2">Recent Outbounds</h2>
      <table className="w-full text-sm border">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="p-2">Product</th>
            <th>Customer</th>
            <th>Qty</th>
            <th>SO Ref</th>
            <th>Dispatch Date</th>
            <th>Attachment</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {outbounds.map((o) => (
            <tr key={o.id} className="border-t">
              <td className="p-2">{products.find((p) => p.id === o.product)?.name || "?"}</td>
              <td>{o.customer}</td>
              <td>{o.quantity}</td>
              <td>{o.so_reference || "-"}</td>
              <td>{o.dispatch_date}</td>
              <td>
                {o.attachment ? (
                  <a
                    href={`http://127.0.0.1:8000${o.attachment}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 underline"
                  >
                    View
                  </a>
                ) : (
                  "-"
                )}
              </td>
              <td className="text-xs space-x-2">
                {hasPermission(["admin", "manager"]) && (
                  <button
                    className="text-blue-600"
                    onClick={() => {
                      setEditingOutbound(o);
                      setFormData({
                        product: o.product,
                        customer: o.customer,
                        quantity: o.quantity,
                        so_reference: o.so_reference,
                        dispatch_date: o.dispatch_date,
                        attachment: null,
                      });
                      setShowEditForm(true);
                    }}
                  >
                    Edit
                  </button>
                )}
                {hasPermission(["admin"]) && (
                  <button
                    className="text-red-600"
                    onClick={() => handleDeleteOutbound(o.id)}
                  >
                    Delete
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showEditForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow w-full max-w-md relative">
            <h2 className="text-lg font-bold mb-4">Edit Outbound Entry</h2>
            <form
              onSubmit={handleEditSubmit}
              className="space-y-2"
              encType="multipart/form-data"
            >
              <select
                value={formData.product}
                onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                className="w-full p-2 border"
              >
                <option value="">Select Product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              <input
                className="w-full p-2 border"
                placeholder="Customer"
                value={formData.customer}
                onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
              />
              <input
                type="number"
                className="w-full p-2 border"
                placeholder="Quantity"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: parseInt(e.target.value) })
                }
              />
              <input
                className="w-full p-2 border"
                placeholder="SO Reference"
                value={formData.so_reference}
                onChange={(e) =>
                  setFormData({ ...formData, so_reference: e.target.value })
                }
              />
              <input
                type="date"
                className="w-full p-2 border"
                value={formData.dispatch_date}
                onChange={(e) =>
                  setFormData({ ...formData, dispatch_date: e.target.value })
                }
              />
              <input
                type="file"
                className="w-full p-2 border"
                onChange={(e) =>
                  setFormData({ ...formData, attachment: e.target.files[0] })
                }
              />

              <div className="flex justify-end mt-4 gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditForm(false)}
                  className="text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-1 rounded"
                >
                  Save Changes
                </button>
              </div>
            </form>
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

export default Outbound;
