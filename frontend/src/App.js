
import React, { useEffect, useRef } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
import io from "socket.io-client";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import ShipperDashboard from "./components/shipper/ShipperDashboard";
import AdminDashboard from "./components/AdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import NewOrder from "./components/NewOrder";
import OrderTracking from "./components/OrderTracking";
import OrderHistory from "./components/OrderHistory";
import UserProfile from "./components/UserProfile";
import MyReports from "./components/MyReports";
import ConfirmOrder from "./components/ConfirmOrder";
import AvailableOrders from "./components/shipper/AvailableOrders";
import MyOrders from "./components/shipper/MyOrders";
import Earnings from "./components/shipper/Earnings";
import ShipperProfile from "./components/shipper/ShipperProfile";
import CompletedOrders from "./components/shipper/CompletedOrders";
import CommissionManagement from "./components/shipper/CommissionManagement";
import AdminCommissionManagement from "./components/admin/AdminCommissionManagement";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

// Admin components
import UserManagement from "./components/admin/UserManagement";
import ShipperManagement from "./components/admin/ShipperManagement";
import OrderManagement from "./components/admin/OrderManagement";
import RevenueReport from "./components/admin/RevenueReport";
import ReportManagement from "./components/admin/ReportManagement";

import AdminDashboardHome from "./components/admin/AdminDashboardHome";
import ForgotPassword from "./pages/ForgotPassword";

import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFail from "./pages/PaymentFail";

function App() {
  const socket = useRef(null);

  useEffect(() => {
    // Lấy thông tin người dùng từ localStorage
    const userInfo = localStorage.getItem("user");
    const user = userInfo ? JSON.parse(userInfo) : null;

    // Chỉ kết nối socket nếu người dùng đã đăng nhập
    if (user && user._id && user.role) {
      // Khởi tạo kết nối socket
      socket.current = io("http://localhost:9999");

      // Gửi ID và vai trò người dùng lên server khi kết nối thành công
      socket.current.on("connect", () => {
        console.log("Connected to socket server!");
        socket.current.emit("registerUser", {
          userId: user._id,
          role: user.role,
        });
      });

      // Phân tách các listener dựa trên vai trò của người dùng
      if (user.role === "user") {
        // Lắng nghe sự kiện 'notification' từ server (chỉ dành cho user)
        socket.current.on("notification", (data) => {
          console.log("Notification for user:", data);

          // Bỏ qua toast notification cho ORDER_ACCEPTED nhưng vẫn cập nhật chuông thông báo
          if (data.type !== "ORDER_ACCEPTED") {
            toast.success(data.message || "Bạn có thông báo mới!", {
              icon: "🔔",
            });
          }

          // Gửi sự kiện để các component khác (như chuông thông báo) có thể cập nhật
          window.dispatchEvent(new Event("new-notification"));
        });
      } else if (user.role === "driver") {
        // Lắng nghe sự kiện cập nhật danh sách đơn hàng (không hiển thị thông báo, chỉ refresh)
        socket.current.on("order_list_updated", (data) => {
          console.log("Order list updated for driver:", data);
          // Gửi sự kiện để trang AvailableOrders có thể refresh
          window.dispatchEvent(
            new CustomEvent("order_list_updated", { detail: data })
          );
        });

        // Tài xế có thể nhận được các thông báo chung khác (ví dụ: tài khoản được duyệt)
        // nhưng chúng ta sẽ bỏ qua thông báo `ORDER_ACCEPTED` để tránh nhầm lẫn.
        socket.current.on("notification", (data) => {
          if (data.type === "ORDER_ACCEPTED") {
            return; // Bỏ qua thông báo này vì nó dành cho người dùng
          }
          console.log("Generic notification for driver:", data);
          
          // Hiển thị toast cho tất cả thông báo khác ngoại trừ ORDER_ACCEPTED
          toast.success(data.message || "Bạn có thông báo mới!", {
            icon: "🔔",
          });
          
          // Luôn cập nhật chuông thông báo
          window.dispatchEvent(new Event("new-notification"));
        });
      }

      // Dọn dẹp khi component unmount
      return () => {
        console.log("Disconnecting socket...");
        socket.current.disconnect();
      };
    }
  }, []); // Chỉ chạy 1 lần khi App mount

  return (
    <Router>
      <div>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* User Routes */}
          <Route
            path="/home"
            element={
              <ProtectedRoute allowedRoles={["user"]}>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/new-order"
            element={
              <ProtectedRoute allowedRoles={["user"]}>
                <NewOrder />
              </ProtectedRoute>
            }
          />
          <Route
            path="/order-tracking"
            element={
              <ProtectedRoute allowedRoles={["user"]}>
                <OrderTracking />
              </ProtectedRoute>
            }
          />
          <Route
            path="/order-history"
            element={
              <ProtectedRoute allowedRoles={["user"]}>
                <OrderHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={["user"]}>
                <UserProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-reports"
            element={
              <ProtectedRoute allowedRoles={["user"]}>
                <MyReports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/confirmOrder"
            element={
              <ProtectedRoute allowedRoles={["user"]}>
                <ConfirmOrder />
              </ProtectedRoute>
            }
          />
          {/* Shipper Routes */}
          <Route
            path="/shipper"
            element={
              <ProtectedRoute allowedRoles={["driver"]}>
                <ShipperDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/shipper/available-orders"
            element={
              <ProtectedRoute allowedRoles={["driver"]}>
                <AvailableOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/shipper/my-orders"
            element={
              <ProtectedRoute allowedRoles={["driver"]}>
                <MyOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/shipper/completed-orders"
            element={
              <ProtectedRoute allowedRoles={["driver"]}>
                <CompletedOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/shipper/earnings"
            element={
              <ProtectedRoute allowedRoles={["driver"]}>
                <Earnings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/shipper/profile"
            element={
              <ProtectedRoute allowedRoles={["driver"]}>
                <ShipperProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/shipper/commissions"
            element={
              <ProtectedRoute allowedRoles={["driver"]}>
                <CommissionManagement />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboardHome />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="shippers" element={<ShipperManagement />} />
            <Route path="orders" element={<OrderManagement />} />
            <Route path="revenue" element={<RevenueReport />} />
            <Route path="reports" element={<ReportManagement />} />

            <Route
              path="commission-management"
              element={<AdminCommissionManagement />}
            />
          </Route>
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/payment-fail" element={<PaymentFail />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
