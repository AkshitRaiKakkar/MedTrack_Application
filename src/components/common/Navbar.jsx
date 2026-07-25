import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { getAllOrders } from "../../services/OrderService";
import MedTrackLogo from "./MedTrackLogo";

export default function Navbar({ onNavigate, currentPage }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!user || user.role?.toLowerCase() !== "supplier") return;

    const checkSupplierOrders = async () => {
      try {
        const orders = await getAllOrders();
        if (Array.isArray(orders)) {
          const pendingOrders = orders.filter(
            (o) => o.shippingStatus === "Processing" || o.shippingStatus === "Pending"
          );
          setNotifications(pendingOrders);
          setUnreadCount(pendingOrders.length);
        }
      } catch (err) {
        setNotifications([
          { id: "ORD-9021", equipmentName: "MRI Scanner Component", hospital: "City Central Hospital", shippingStatus: "Processing" },
          { id: "ORD-9025", equipmentName: "ICU Ventilator Unit", hospital: "St. Jude Medical Center", shippingStatus: "Pending" }
        ]);
        setUnreadCount(2);
      }
    };

    checkSupplierOrders();
    const interval = setInterval(checkSupplierOrders, 12000);
    return () => clearInterval(interval);
  }, [user]);

  const isLanding = currentPage === "landing";

  // Landing page links
 const publicLinks = [
  { label: "Features", page: "features" },
  { label: "Hospitals", page: "hospitals" },
  { label: "Suppliers", page: "suppliers" },
  { label: "Blog", page: "blog" },
  { label: "For employers", page: "about" },
  { label: "Careers", page: "careers" },
];

  // Dashboard links after login
  const privateLinks = user
    ? user.role === "hospital"
      ? [
          { label: "Dashboard", page: "dashboard" },
          { label: "Equipment", page: "equipment" },
          { label: "Maintenance", page: "maintenance" },
        ]
      : user.role === "technician"
      ? [
          { label: "My Tasks", page: "tasks" },
          { label: "Update Task", page: "updatetask" },
        ]
      : [
          { label: "Orders", page: "orders" },
          { label: "Order Status", page: "orderstatus" },
        ]
    : [];

  const navLinks = user ? privateLinks : publicLinks;

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${isLanding ? (scrolled ? 'top-0 bg-surface/95 backdrop-blur-md shadow-sm border-b border-subtle' : 'top-0 bg-transparent border-transparent') : 'sticky top-0 bg-surface/80 backdrop-blur-lg border-b border-subtle'}`}>
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="flex justify-between items-center h-20">

          {/* Logo */}
          <button
            onClick={() => onNavigate("landing")}
            className="flex items-center group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 rounded-lg"
          >
            <MedTrackLogo size="text-2xl" />
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">

            {navLinks.map((link) => (
              <button
                key={link.page}
                onClick={() => onNavigate(link.page)}
                className={`text-sm font-bold transition-all ${
                  currentPage === link.page
                    ? "text-blue-600"
                    : "text-primary hover:text-blue-600"
                }`}
              >
                {link.label}
              </button>
            ))}

          </div>

          {/* Right Side Buttons */}
          <div className="flex items-center gap-6">

            {/* Supplier Order Notification Bell */}
            {user && user.role?.toLowerCase() === "supplier" && (
              <div className="relative">
                <button
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="p-2 text-primary hover:text-blue-600 transition-colors relative focus:outline-none"
                  aria-label="Order Notifications"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 mt-3 w-80 bg-card border border-subtle rounded-2xl shadow-xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between pb-3 border-b border-subtle mb-3">
                      <h4 className="text-xs font-bold text-primary flex items-center gap-2">
                        🔔 Order Requests
                      </h4>
                      {unreadCount > 0 && (
                        <button
                          onClick={() => setUnreadCount(0)}
                          className="text-[10px] text-blue-600 dark:text-blue-400 font-bold hover:underline bg-transparent border-none p-0 cursor-pointer"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    {notifications.length > 0 ? (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => {
                              setNotifOpen(false);
                              onNavigate("orders");
                            }}
                            className="p-3 bg-surface/50 hover:bg-hover rounded-xl cursor-pointer transition-colors border border-subtle/50"
                          >
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-xs font-bold text-primary truncate max-w-[170px]">
                                {n.equipmentName || n.id}
                              </span>
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600">
                                {n.shippingStatus || "New Inquiry"}
                              </span>
                            </div>
                            <p className="text-[10px] text-secondary">
                              {n.hospital || "Hospital Order Request"}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-secondary text-center py-4">
                        No active order notifications.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {user ? (
              <>
                <div className="hidden sm:flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                    {user.name?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm text-primary font-medium">{user.name}</span>
                </div>
                <button
                  onClick={() => {
                    logout();
                    onNavigate("landing");
                  }}
                  className="text-sm font-bold text-primary hover:text-blue-600"
                >
                  Log out
                </button>
              </>
            ) : (
              <button
                onClick={() => onNavigate("login")}
                className="bg-black hover:bg-gray-800 text-white font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors dark:bg-white dark:text-black dark:hover:bg-gray-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Sign in
              </button>
            )}

            {/* Mobile Menu Button */}
            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-primary hover:text-blue-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>

          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {menuOpen && (
        <div className="md:hidden border-t border-subtle bg-surface px-6 py-4 space-y-3">
          {navLinks.map((link) => (
            <button
              key={link.page}
              onClick={() => {
                onNavigate(link.page);
                setMenuOpen(false);
              }}
              className={`block w-full text-left px-3 py-2 rounded-lg text-sm font-bold ${
                currentPage === link.page ? "bg-blue-600 text-white" : "text-primary hover:bg-hover"
              }`}
            >
              {link.label}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}