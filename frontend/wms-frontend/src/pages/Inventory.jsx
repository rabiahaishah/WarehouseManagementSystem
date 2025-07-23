import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { hasPermission } from "../utils/permission";

function Inventory() {
  const navigate = useNavigate();
  const [barcodeSKU, setBarcodeSKU] = useState(null);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [csvFile, setCsvFile] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    tags: "",
    description: "",
    category: "",
    quantity: 0,
    low_stock_threshold: 5,
  });

  useEffect(() => {
    fetchProducts();
  }, [search, showArchived]);

  const fetchProducts = async () => {
    const token = localStorage.getItem("access_token");
    try {
      let url = `http://127.0.0.1:8000/api/products/?search=${search}&page_size=1000`;
      url += `&is_archived=${showArchived ? "true" : "false"}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.status === 401 || res.status === 403) {
        alert("Session expired. Please login again.");
        localStorage.removeItem("access_token");
        window.location.href = "/login";
        return;
      }
      const data = await res.json();
      const items = data.results || data;
      setProducts(Array.isArray(items) ? items : []);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      alert("Server error. Check console.");
    }
  };

  const fetchAuditLogs = async (productId) => {
    const token = localStorage.getItem("access_token");
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/audit-log/?product_id=${productId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      setAuditLogs(data);
      setShowLogs(true);
    } catch (error) {
      console.error("Failed to fetch logs:", error);
      alert("Could not load logs.");
    }
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem("access_token");
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await fetch(`http://127.0.0.1:8000/api/products/${id}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      fetchProducts();
    } catch (error) {
      alert("Failed to delete product.");
    }
  };

  const toggleArchive = async (id, archive) => {
    const token = localStorage.getItem("access_token");
    try {
      await fetch(`http://127.0.0.1:8000/api/products/${id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_archived: archive }),
      });
      fetchProducts();
    } catch (error) {
      alert("Failed to update archive status.");
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("access_token");
    const formDataUpload = new FormData();
    formDataUpload.append("file", csvFile);
    try {
      await fetch("http://127.0.0.1:8000/api/upload-products/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataUpload,
      });
      alert("CSV upload complete!");
      setTimeout(fetchProducts, 1000);
    } catch (error) {
      alert("Failed to upload CSV.");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Inventory Management</h1>

      <div className="mb-4 flex flex-col md:flex-row md:items-center gap-2">
        <input
          type="text"
          className="p-2 border w-full md:w-1/3"
          placeholder="Search by name, SKU, tag, category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="mb-4 flex flex-col md:flex-row justify-between items-center gap-2">
        {hasPermission(["admin", "manager", "operator"]) && (
          <button
            className="bg-green-600 text-white px-4 py-2 rounded"
            onClick={() => {
              setIsEditing(false);
              setFormData({
                name: "",
                sku: "",
                tags: "",
                description: "",
                category: "",
                quantity: 0,
                low_stock_threshold: 5,
              });
              setShowForm(true);
            }}
          >
            + Add Product
          </button>
        )}
        <button
          onClick={() => setShowArchived(!showArchived)}
          className="bg-gray-200 text-sm px-3 py-1 rounded"
        >
          {showArchived ? "Hide Archived" : "Show Archived"}
        </button>
      </div>

      {hasPermission(["admin"]) && (
        <form
          onSubmit={handleUpload}
          className="mb-6 flex flex-col md:flex-row gap-2 md:items-center"
          encType="multipart/form-data"
        >
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setCsvFile(e.target.files[0])}
            required
            className="p-2 border rounded"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-1 rounded"
          >
            Upload CSV
          </button>
        </form>
      )}

      {loading ? (
        <div>Loading...</div>
      ) : (
        <table className="w-full border text-sm">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2">Name</th>
              <th>SKU</th>
              <th>Category</th>
              <th>Tags</th>
              <th>Quantity</th>
              <th>Low Stock</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t hover:bg-gray-50">
                <td className="p-2">{p.name}</td>
                <td>{p.sku}</td>
                <td>{p.category}</td>
                <td>{p.tags}</td>
                <td>{p.quantity}</td>
                <td className={p.quantity <= p.low_stock_threshold ? "text-red-600 font-semibold" : ""}>
                  {p.quantity <= p.low_stock_threshold ? "LOW" : "OK"}
                </td>
                <td className="space-x-2">
                  {hasPermission(["admin", "manager"]) && (
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setFormData(p);
                        setShowForm(true);
                      }}
                      className="text-blue-600 text-xs"
                    >
                      Edit
                    </button>
                  )}

                  {hasPermission(["admin"]) && (
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="text-red-600 text-xs"
                    >
                      Delete
                    </button>
                  )}

                  {hasPermission(["admin", "manager", "operator"]) && (
                    p.is_archived ? (
                      <button
                        onClick={() => toggleArchive(p.id, false)}
                        className="text-green-600 text-xs"
                      >
                        Unarchive
                      </button>
                    ) : (
                      <button
                        onClick={() => toggleArchive(p.id, true)}
                        className="text-yellow-600 text-xs"
                      >
                        Archive
                      </button>
                    )
                  )}

                  <button
                    onClick={() => setBarcodeSKU(p.sku)}
                    className="text-purple-600 text-xs"
                  >
                    Barcode
                  </button>

                  {hasPermission(["admin"]) && (
                    <button
                      onClick={() => fetchAuditLogs(p.id)}
                      className="text-indigo-600 text-xs"
                    >
                      Logs
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      
      {showLogs && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-md w-full max-w-lg relative">
            <h2 className="text-lg font-semibold mb-4">Audit Log</h2>

            {auditLogs.length === 0 ? (
              <p className="text-sm text-gray-600">No logs available for this product.</p>
            ) : (
              <ul className="text-sm space-y-2 max-h-[300px] overflow-y-auto">
                {auditLogs.map((log) => (
                  <li key={log.id} className="border-b pb-2">
                    <p><strong>Action:</strong> {log.action}</p>
                    <p><strong>By:</strong> {log.performed_by}</p>
                    <p><strong>At:</strong> {new Date(log.timestamp).toLocaleString()}</p>
                  </li>
                ))}
              </ul>
            )}

            <div className="text-right mt-4">
              <button
                onClick={() => setShowLogs(false)}
                className="text-sm text-gray-600 underline"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Modal */}
      {barcodeSKU && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-md relative max-w-lg w-full">
            <h2 className="text-lg font-semibold mb-4">Barcode & QR for {barcodeSKU}</h2>
            <div className="flex justify-between gap-4 mb-4">
              <div className="text-center">
                <p className="text-sm font-medium">Barcode</p>
                <img
                  src={`http://127.0.0.1:8000/api/products/${barcodeSKU}/barcode/`}
                  alt="barcode"
                  className="max-w-xs mx-auto"
                />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">QR Code</p>
                <img
                  src={`http://127.0.0.1:8000/api/products/${barcodeSKU}/qrcode/`}
                  alt="qrcode"
                  className="max-w-[128px] mx-auto"
                />
              </div>
            </div>
            <div className="text-right">
              <button
                onClick={() => setBarcodeSKU(null)}
                className="text-sm text-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow w-full max-w-md relative">
            <h2 className="text-lg font-bold mb-4">
              {isEditing ? "Edit Product" : "Add Product"}
            </h2>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const token = localStorage.getItem("access_token");
                const method = isEditing ? "PATCH" : "POST";
                const url = isEditing
                  ? `http://127.0.0.1:8000/api/products/${formData.id}/`
                  : "http://127.0.0.1:8000/api/products/";

                try {
                  const res = await fetch(url, {
                    method: method,
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(formData),
                  });

                  if (!res.ok) throw new Error("Failed");

                  alert(isEditing ? "Product updated!" : "Product added!");
                  setShowForm(false);
                  fetchProducts();
                } catch (error) {
                  alert("Error saving product.");
                }
              }}
              className="space-y-2"
            >
              <input className="w-full border p-2" placeholder="Name" value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              <input className="w-full border p-2" placeholder="SKU" value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })} required />
              <input className="w-full border p-2" placeholder="Tags" value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })} />
              <input className="w-full border p-2" placeholder="Description" value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              <input className="w-full border p-2" placeholder="Category" value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })} />
              <input className="w-full border p-2" type="number" placeholder="Quantity" value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })} />
              <input className="w-full border p-2" type="number" placeholder="Low Stock Threshold" value={formData.low_stock_threshold}
                onChange={(e) => setFormData({ ...formData, low_stock_threshold: parseInt(e.target.value) })} />

              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setShowForm(false)} className="text-gray-600">Cancel</button>
                <button type="submit" className="bg-blue-600 text-white px-4 py-1 rounded">
                  {isEditing ? "Update" : "Create"}
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

export default Inventory;
