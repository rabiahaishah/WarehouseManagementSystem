import React, { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useNavigate } from "react-router-dom";
import { hasPermission } from "../utils/permission";

function Inbound() {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [editingInbound, setEditingInbound] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [products, setProducts] = useState([]);
  const [inbounds, setInbounds] = useState([]);
  const [formData, setFormData] = useState({
    product: "",
    supplier: "",
    quantity: 1,
    invoice_reference: "",
    received_date: "",
    attachment: null,
  });
  const [csvFile, setCsvFile] = useState(null);

  const token = localStorage.getItem("access_token");

  useEffect(() => {
    fetchProducts();
    fetchInbounds();
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
          console.warn("Scan error", error);
        }
      );
    }

    return () => {
      if (scanner) {
        scanner.clear().catch((err) => console.warn("Scanner clear error", err));
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

  const fetchInbounds = async () => {
    const res = await fetch("http://127.0.0.1:8000/api/inbounds/", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setInbounds(data);
  };

  const handleInboundSubmit = async (e) => {
    e.preventDefault();
    const submitData = new FormData();

    for (let key in formData) {
      if (formData[key] !== null && formData[key] !== "") {
        submitData.append(key, formData[key]);
      }
    }

    try {
      const res = await fetch("http://127.0.0.1:8000/api/inbounds/", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: submitData,
      });

      if (!res.ok) {
        const err = await res.json();
        console.error("Add Error:", err);
        alert("Failed to add inbound.");
        return;
      }

      alert("Inbound recorded!");
      setFormData({
        product: "",
        supplier: "",
        quantity: 1,
        invoice_reference: "",
        received_date: "",
        attachment: null,
      });
      fetchInbounds();
    } catch (error) {
      console.error("Add Exception:", error);
      alert("Add error. Check console.");
    }
  };

  const handleCsvUpload = async (e) => {
    e.preventDefault();
    const csvData = new FormData();
    csvData.append("file", csvFile);

    await fetch("http://127.0.0.1:8000/api/upload-inbounds/", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: csvData,
    });

    alert("CSV uploaded!");
    fetchInbounds();
  };

  const handleDeleteInbound = async (id) => {
    if (!window.confirm("Delete this inbound entry?")) return;
    await fetch(`http://127.0.0.1:8000/api/inbounds/${id}/`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchInbounds();
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Inbound Management</h1>

      <button
        onClick={() => setScanning(!scanning)}
        className="mb-4 bg-purple-600 text-white px-4 py-2 rounded"
      >
        {scanning ? "Stop Scanning" : "📷 Scan Barcode to Select Product"}
      </button>

      {scanning && <div id="qr-reader" className="mb-6"></div>}

      <form
        onSubmit={handleInboundSubmit}
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
              {p.name} ({p.sku})
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Supplier Name"
          className="p-2 border"
          value={formData.supplier}
          onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
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
          placeholder="Invoice Ref"
          className="p-2 border"
          value={formData.invoice_reference}
          onChange={(e) => setFormData({ ...formData, invoice_reference: e.target.value })}
        />

        <input
          type="date"
          className="p-2 border"
          value={formData.received_date}
          onChange={(e) => setFormData({ ...formData, received_date: e.target.value })}
          required
        />

        <input
          type="file"
          className="p-2 border"
          onChange={(e) => setFormData({ ...formData, attachment: e.target.files[0] })}
        />

        <div className="md:col-span-2 text-right">
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
            Submit Inbound
          </button>
        </div>
      </form>

      {hasPermission(["admin"]) && (
  <     form
          onSubmit={handleCsvUpload}
          className="mb-4 flex gap-2 items-center"
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


      <h2 className="text-lg font-semibold mb-2">Recent Inbounds</h2>
      <table className="w-full text-sm border">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="p-2">Product</th>
            <th>Supplier</th>
            <th>Qty</th>
            <th>Received</th>
            <th>Invoice</th>
            <th>File</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {inbounds.map((i) => (
            <tr key={i.id} className="border-t">
              <td className="p-2">{products.find((p) => p.id === i.product)?.name || "?"}</td>
              <td>{i.supplier}</td>
              <td>{i.quantity}</td>
              <td>{i.received_date}</td>
              <td>{i.invoice_reference || "-"}</td>
              <td>
                {i.attachment ? (
                  <a
                    href={`http://127.0.0.1:8000${i.attachment}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    View
                  </a>
                ) : (
                  "-"
                )}
              </td>
              <td className="space-x-2 text-xs">
                {hasPermission(["admin", "manager"]) && (
                  <button
                    className="text-blue-600"
                    onClick={() => {
                      setEditingInbound(i);
                      setFormData({
                        product: i.product,
                        supplier: i.supplier,
                        quantity: i.quantity,
                        invoice_reference: i.invoice_reference,
                        received_date: i.received_date,
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
                    onClick={() => handleDeleteInbound(i.id)}
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
            <h2 className="text-lg font-bold mb-4">Edit Inbound Entry</h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const updateData = new FormData();
                for (let key in formData) {
                  if (formData[key]) updateData.append(key, formData[key]);
                }

                await fetch(`http://127.0.0.1:8000/api/inbounds/${editingInbound.id}/`, {
                  method: "PATCH",
                  headers: { Authorization: `Bearer ${token}` },
                  body: updateData,
                });

                alert("Inbound updated.");
                setShowEditForm(false);
                fetchInbounds();
              }}
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
                placeholder="Supplier"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              />
              <input
                type="number"
                className="w-full p-2 border"
                placeholder="Quantity"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
              />
              <input
                className="w-full p-2 border"
                placeholder="Invoice Reference"
                value={formData.invoice_reference}
                onChange={(e) => setFormData({ ...formData, invoice_reference: e.target.value })}
              />
              <input
                type="date"
                className="w-full p-2 border"
                value={formData.received_date}
                onChange={(e) => setFormData({ ...formData, received_date: e.target.value })}
              />
              <input
                type="file"
                className="w-full p-2 border"
                onChange={(e) => setFormData({ ...formData, attachment: e.target.files[0] })}
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

export default Inbound;
