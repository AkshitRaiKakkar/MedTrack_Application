import React, { useState, useEffect } from "react";
import { getAllSpareParts, createSparePart, updateSparePart, deleteSparePart } from "../../services/SparePartService";
import { Plus, Edit2, Trash2, Search, AlertCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function SparePartsCatalog({ onNavigate }) {
  const { user } = useAuth();
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPart, setEditingPart] = useState(null);
  const [formData, setFormData] = useState({
    partNumber: "",
    description: "",
    compatibleModels: "",
    stockLevel: 0,
    reorderPoint: 0,
    unitCost: 0.0,
  });

  useEffect(() => {
    fetchParts();
  }, []);

  const fetchParts = async () => {
    try {
      setLoading(true);
      const data = await getAllSpareParts();
      setParts(data);
    } catch (err) {
      console.error("Error fetching spare parts:", err);
      setError("Failed to load spare parts catalog.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (part = null) => {
    if (part) {
      setEditingPart(part);
      setFormData({
        partNumber: part.partNumber,
        description: part.description,
        compatibleModels: part.compatibleModels || "",
        stockLevel: part.stockLevel,
        reorderPoint: part.reorderPoint,
        unitCost: part.unitCost,
      });
    } else {
      setEditingPart(null);
      setFormData({
        partNumber: "",
        description: "",
        compatibleModels: "",
        stockLevel: 0,
        reorderPoint: 0,
        unitCost: 0.0,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPart(null);
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? (value ? Number(value) : "") : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPart) {
        await updateSparePart(editingPart.id, formData);
      } else {
        await createSparePart(formData);
      }
      handleCloseModal();
      fetchParts();
    } catch (err) {
      console.error("Error saving spare part:", err);
      alert("Failed to save spare part.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this spare part?")) {
      try {
        await deleteSparePart(id);
        fetchParts();
      } catch (err) {
        console.error("Error deleting spare part:", err);
        alert("Failed to delete spare part.");
      }
    }
  };

  const filteredParts = parts.filter((part) =>
    part.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    part.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden pb-12 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
          <button onClick={() => onNavigate("dashboard")} className="hover:text-blue-600 transition-colors">Dashboard</button>
          <span>/</span>
          <span className="text-slate-600">Spare Parts Catalog</span>
        </div>

        {/* Title Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Spare Parts & Consumables</h1>
            <p className="text-slate-500 text-sm">Manage inventory levels, reorder points, and part compatibility.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => handleOpenModal()}
              className="px-5 py-2.5 bg-blue-600 text-white hover:bg-blue-700 text-sm font-semibold rounded-2xl transition-all shadow-sm active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <Plus size={16} /> Add New Part
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6 bg-white p-3 rounded-2xl shadow-sm border border-slate-200/80 flex items-center gap-3">
          <Search size={20} className="text-slate-400 ml-2" />
          <input 
            type="text" 
            placeholder="Search by part number or description..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-sm text-slate-800 placeholder:text-slate-400 font-medium"
          />
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 text-sm font-semibold flex items-center gap-2">
            <AlertCircle size={18} /> {error}
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/80">
                    <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Part Number</th>
                    <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Description</th>
                    <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Compatible Models</th>
                    <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs text-right">Stock</th>
                    <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs text-right">Unit Cost</th>
                    <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs text-center">Status</th>
                    <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredParts.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-slate-500 font-medium">
                        No spare parts found.
                      </td>
                    </tr>
                  ) : (
                    filteredParts.map((part) => (
                      <tr key={part.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4 font-bold text-slate-900">{part.partNumber}</td>
                        <td className="px-6 py-4 font-medium text-slate-700">{part.description}</td>
                        <td className="px-6 py-4 text-slate-500 text-xs">{part.compatibleModels || "N/A"}</td>
                        <td className="px-6 py-4 text-right font-semibold">
                          <span className={part.stockLevel <= part.reorderPoint ? "text-red-600" : "text-slate-700"}>
                            {part.stockLevel}
                          </span>
                          <span className="text-slate-400 text-xs ml-1 block">Min: {part.reorderPoint}</span>
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-slate-700">${part.unitCost?.toFixed(2)}</td>
                        <td className="px-6 py-4 text-center">
                          {part.stockLevel <= part.reorderPoint ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-700 uppercase tracking-wider">
                              Low Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase tracking-wider">
                              In Stock
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleOpenModal(part)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                              <Edit2 size={16} />
                            </button>
                            <button onClick={() => handleDelete(part.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">{editingPart ? "Edit Spare Part" : "Add Spare Part"}</h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition-colors">
                <AlertCircle size={18} className="rotate-45" /> {/* Close icon lookalike */}
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Part Number *</label>
                    <input required type="text" name="partNumber" value={formData.partNumber} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Unit Cost ($) *</label>
                    <input required type="number" step="0.01" min="0" name="unitCost" value={formData.unitCost} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Description *</label>
                  <input required type="text" name="description" value={formData.description} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Compatible Models</label>
                  <input type="text" name="compatibleModels" value={formData.compatibleModels} onChange={handleChange} placeholder="e.g. Model X, Model Y" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Current Stock *</label>
                    <input required type="number" min="0" name="stockLevel" value={formData.stockLevel} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Reorder Point *</label>
                    <input required type="number" min="0" name="reorderPoint" value={formData.reorderPoint} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                  </div>
                </div>
                
              </div>
              
              <div className="mt-8 flex justify-end gap-3">
                <button type="button" onClick={handleCloseModal} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors">
                  {editingPart ? "Save Changes" : "Create Part"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
