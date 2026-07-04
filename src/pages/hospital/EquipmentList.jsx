import React, { useEffect, useState } from "react";
import {
  getAllEquipment,
  deleteEquipment,
  getEquipmentById,
} from "../../services/EquipmentService";
import { useAuth } from "../../context/AuthContext";

/* ===========================
   DEFAULT PUBLIC EQUIPMENT
   Visible to ALL users
=========================== */
const PUBLIC_EQUIPMENT = [
  {
    id: "EQ-001",
    name: "MRI Scanner",
    model: "GE Signa HDxt",
    department: "Radiology",
    status: "Operational",
  },
  {
    id: "EQ-002",
    name: "Ventilator",
    model: "Philips Trilogy",
    department: "ICU",
    status: "Operational",
  },
  {
    id: "EQ-003",
    name: "X-Ray Machine",
    model: "Siemens AX",
    department: "Emergency",
    status: "Maintenance",
  },
  {
    id: "EQ-004",
    name: "Ultrasound",
    model: "Sonosite Edge",
    department: "Cardiology",
    status: "Operational",
  },
  {
    id: "EQ-005",
    name: "First Aid Kit",
    model: "FA-PRO-500",
    department: "Emergency",
    status: "Operational",
  },
  {
    id: "EQ-006",
    name: "Stethoscope",
    model: "ST-CLASSIC",
    department: "Cardiology",
    status: "Operational",
  },
  {
    id: "EQ-007",
    name: "Blood Pressure Monitor",
    model: "BP-AUTO",
    department: "General Ward",
    status: "Operational",
  },
  {
    id: "EQ-008",
    name: "Digital Thermometer",
    model: "TEMP-001",
    department: "Nursing Station",
    status: "Operational",
  },
];

/* ===========================
   EQUIPMENT IMAGES
=========================== */
const EQUIPMENT_IMAGES = {
  mri: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQl7fPv3AGiTlskFg0Ehetmi5OPa-grbbDihw&s",
  ventilator: "https://cpimg.tistatic.com/08907627/b/4/Ventilator-NICU-Eqp.jpg",
  "x-ray": "https://images.unsplash.com/photo-1581595220892-b0739db3ba8c",
  ultrasound: "https://images.unsplash.com/photo-1516549655169-df83a0774514",
  stethoscope: "https://m.media-amazon.com/images/I/51i5-G3clqS.jpg",
  default: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae",
};

export default function EquipmentList({ onNavigate }) {
  const { user } = useAuth();

  const [equipment, setEquipment] = useState([]);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [hoveredCard, setHoveredCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [equipmentDetails, setEquipmentDetails] = useState(null);
  const [detailsError, setDetailsError] = useState(null);

  useEffect(() => {
    fetchEquipment();
  }, []);

  const mergeEquipment = (fetchedEquipment = []) => {
    const equipmentMap = new Map();

    PUBLIC_EQUIPMENT.forEach((item) => {
      equipmentMap.set(String(item.id), item);
    });

    fetchedEquipment.forEach((item) => {
      equipmentMap.set(String(item.id), item);
    });

    return Array.from(equipmentMap.values());
  };

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const data = await getAllEquipment();
      setEquipment(Array.isArray(data) ? mergeEquipment(data) : PUBLIC_EQUIPMENT);
    } catch (error) {
      console.error("Failed to fetch equipment", error);
      setEquipment(PUBLIC_EQUIPMENT);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (id) => {
    setSelectedEquipmentId(id);
    setDetailsLoading(true);
    setDetailsError(null);
    setEquipmentDetails(null);

    try {
      const publicEquipmentDetails = PUBLIC_EQUIPMENT.find(
        (item) => String(item.id) === String(id)
      );

      if (publicEquipmentDetails) {
        setEquipmentDetails(publicEquipmentDetails);
        return;
      }

      const data = await getEquipmentById(id);
      setEquipmentDetails(data);
    } catch (error) {
      console.error("Error fetching equipment details:", error);
      const errMsg =
        error.response?.data?.message || `Equipment not found with id: ${id}`;
      setDetailsError(errMsg);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        await deleteEquipment(id);
        fetchEquipment();
      } catch (error) {
        alert("Failed to delete equipment. It might be linked to maintenance tasks.");
      }
    }
  };

  const getImage = (name = "") => {
    const lower = name.toLowerCase();

    for (const key in EQUIPMENT_IMAGES) {
      if (lower.includes(key)) {
        return EQUIPMENT_IMAGES[key];
      }
    }

    return EQUIPMENT_IMAGES.default;
  };

  const departmentOptions = [
    "All",
    ...new Set(equipment.map((item) => item.department).filter(Boolean)),
  ];

  const statusOptions = [
    "All",
    ...new Set(equipment.map((item) => item.status).filter(Boolean)),
  ];

  const filtered = equipment.filter((item) => {
    const searchValue = search.toLowerCase().trim();

    const matchesSearch =
      !searchValue ||
      item.name?.toLowerCase().includes(searchValue) ||
      String(item.id).toLowerCase().includes(searchValue) ||
      item.model?.toLowerCase().includes(searchValue) ||
      item.department?.toLowerCase().includes(searchValue) ||
      item.status?.toLowerCase().includes(searchValue);

    const matchesDepartment =
      departmentFilter === "All" || item.department === departmentFilter;

    const matchesStatus = statusFilter === "All" || item.status === statusFilter;

    return matchesSearch && matchesDepartment && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-surface p-10 font-sans text-primary">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8 flex-wrap gap-5">
        <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400 m-0">
          Medical Equipment Inventory
        </h1>

        <div className="flex gap-4 items-center flex-wrap">
          <input
            type="text"
            placeholder="Search by name, ID, model..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-5 py-3 rounded-lg border border-subtle bg-surface text-primary w-72 text-base shadow-sm outline-none transition-colors focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
          />

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-5 py-3 rounded-lg border border-subtle bg-surface text-primary text-base shadow-sm outline-none transition-colors focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
          >
            {departmentOptions.map((department) => (
              <option key={department} value={department}>
                {department === "All" ? "All Departments" : department}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-5 py-3 rounded-lg border border-subtle bg-surface text-primary text-base shadow-sm outline-none transition-colors focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status === "All" ? "All Statuses" : status}
              </option>
            ))}
          </select>

          {user?.role === "hospital" && (
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white border-none px-6 py-3 rounded-lg text-base font-semibold cursor-pointer shadow-md transition-colors"
              onClick={() => onNavigate("add-equipment")}
            >
              + Add Equipment
            </button>
          )}
        </div>
      </div>

      {/* Result Summary */}
      <div className="mb-6 rounded-xl border border-subtle bg-card p-4 shadow-sm">
        <p className="text-primary font-semibold">
          Showing {filtered.length} of {equipment.length} equipment items
        </p>
        <p className="text-secondary text-sm mt-1">
          Department: {departmentFilter === "All" ? "All Departments" : departmentFilter}
          {" | "}
          Status: {statusFilter === "All" ? "All Statuses" : statusFilter}
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-10 text-secondary font-semibold">
          Loading equipment inventory...
        </div>
      )}

      {/* Empty State */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-10 text-secondary">
          No equipment items match your current search or filters.
        </div>
      )}

      {/* Grid Section */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6">
          {filtered.map((item) => (
            <div
              key={item.id}
              className={`bg-card rounded-xl overflow-hidden shadow-sm transition-all border border-subtle flex flex-col ${
                hoveredCard === item.id ? "transform -translate-y-1 shadow-lg" : ""
              }`}
              onMouseEnter={() => setHoveredCard(item.id)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <img
                src={getImage(item.name)}
                alt={item.name}
                className="w-full h-48 object-cover border-b border-subtle"
              />

              <div className="p-5 flex-grow flex flex-col">
                <div
                  className={`px-3 py-1 rounded-full text-xs font-semibold uppercase inline-block mb-3 w-fit ${
                    item.status === "Operational"
                      ? "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400"
                      : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                  }`}
                >
                  {item.status}
                </div>

                <h3 className="text-xl font-semibold mb-2 text-primary">
                  {item.name}
                </h3>

                <div className="text-sm text-secondary mb-1.5 flex items-center">
                  <span>
                    <strong>ID:</strong> {item.id}
                  </span>
                </div>

                <div className="text-sm text-secondary mb-1.5 flex items-center">
                  <span>
                    <strong>Department:</strong> {item.department || "N/A"}
                  </span>
                </div>

                <div className="text-sm text-secondary mb-1.5 flex items-center">
                  <span>
                    <strong>Model:</strong> {item.model || "N/A"}
                  </span>
                </div>

                <div className="mt-auto pt-4 border-t border-subtle flex justify-between items-center gap-2">
                  <button
                    onClick={() => handleViewDetails(item.id)}
                    className="flex-1 py-2 px-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg cursor-pointer font-semibold text-sm transition-colors hover:bg-blue-100 dark:hover:bg-blue-900/40"
                  >
                    Details
                  </button>

                  <button
                    onClick={() => onNavigate("schedule-maintenance")}
                    className="flex-1 py-2 px-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg cursor-pointer font-semibold text-sm transition-colors hover:bg-blue-100 dark:hover:bg-blue-900/40"
                  >
                    Schedule Service
                  </button>

                  {/* Hide delete button for default public items */}
                  {user?.role === "hospital" &&
                    !String(item.id).startsWith("EQ-00") && (
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="py-2 px-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg cursor-pointer font-semibold text-sm transition-colors hover:bg-red-100 dark:hover:bg-red-900/40"
                      >
                        Delete
                      </button>
                    )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Equipment Details Modal */}
      {selectedEquipmentId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-card rounded-3xl p-8 max-w-lg w-full shadow-2xl relative border border-subtle">
            <button
              onClick={() => setSelectedEquipmentId(null)}
              className="absolute top-5 right-5 w-9 h-9 rounded-full bg-hover text-secondary border-none flex items-center justify-center text-xl font-bold cursor-pointer transition-colors hover:bg-subtle"
            >
              &times;
            </button>

            {detailsLoading && (
              <div className="text-center py-10 px-5">
                <div className="inline-block w-10 h-10 border-4 border-subtle border-t-blue-600 rounded-full animate-spin"></div>
                <p className="mt-4 text-secondary font-semibold">
                  Fetching equipment details...
                </p>
              </div>
            )}

            {detailsError && (
              <div className="text-center p-5">
                <div className="text-red-500 text-5xl mb-4">⚠️</div>
                <h3 className="text-xl font-bold text-primary mb-2">Not Found</h3>
                <p className="text-red-500 text-sm mb-6 font-medium">
                  {detailsError}
                </p>
                <button
                  onClick={() => setSelectedEquipmentId(null)}
                  className="bg-red-500 hover:bg-red-600 text-white border-none py-3 px-6 rounded-xl font-bold cursor-pointer shadow-sm"
                >
                  Close
                </button>
              </div>
            )}

            {equipmentDetails && (
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-2xl">
                    ⚙️
                  </div>
                  <div>
                    <h2 className="text-2xl font-extrabold text-primary m-0">
                      {equipmentDetails.name}
                    </h2>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide inline-block mt-1.5 ${
                        equipmentDetails.status === "Operational"
                          ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
                      }`}
                    >
                      {equipmentDetails.status}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-4 bg-hover p-5 rounded-2xl mb-6">
                  <div>
                    <span className="text-[11px] text-secondary font-bold uppercase tracking-wider">
                      Equipment ID
                    </span>
                    <p className="text-[15px] text-primary font-bold m-1 font-mono">
                      {equipmentDetails.id}
                    </p>
                  </div>
                  <div className="w-full h-px bg-subtle"></div>
                  <div>
                    <span className="text-[11px] text-secondary font-bold uppercase tracking-wider">
                      Model Details
                    </span>
                    <p className="text-[15px] text-primary font-semibold m-1">
                      {equipmentDetails.model || "N/A"}
                    </p>
                  </div>
                  <div className="w-full h-px bg-subtle"></div>
                  <div>
                    <span className="text-[11px] text-secondary font-bold uppercase tracking-wider">
                      Department / Location
                    </span>
                    <p className="text-[15px] text-primary font-semibold m-1">
                      {equipmentDetails.department || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => setSelectedEquipmentId(null)}
                    className="bg-blue-600 hover:bg-blue-700 text-white border-none py-3 px-7 rounded-xl cursor-pointer font-bold text-[15px] shadow-sm transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
