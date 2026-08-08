import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "../pages/Home";
import Products from "../pages/Products";
import ProductDetail from "../pages/ProductDetail";
import Cart from "../pages/Cart";
import Wishlist from "../pages/Wishlist";
import Login from "../pages/Login";
import Register from "../pages/Register";
import ForgotPassword from "../pages/ForgotPassword";
import ResetPassword from "../pages/ResetPassword";
import VerifyEmail from "../pages/VerifyEmail";
import Checkout from "../pages/Checkout";
import OrderConfirmation from "../pages/OrderConfirmation";
import Orders from "../pages/Orders";
import Categories from "../pages/Categories";
import Deals from "../pages/Deals";
import Compare from "../pages/Compare";
import Support from "../pages/Support";
import TrackOrder from "../pages/TrackOrder";
import WarrantyReturns from "../pages/WarrantyReturns";
import Profile from "../pages/Profile";

import ProtectedRoute from "./ProtectedRoute";
import AdminRoute from "./AdminRoute";

import AdminLayout from "../components/layout/AdminLayout";
import AdminDashboard from "../pages/admin/Dashboard";
import AdminProducts from "../pages/admin/Products";
import AdminProductForm from "../pages/admin/ProductForm";
import AdminOrders from "../pages/admin/Orders";
import AdminUsers from "../pages/admin/Users";
import AdminWafLogs from "../pages/admin/WafLogs";
import AdminBlockedIps from "../pages/admin/BlockedIps";


function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
      }}
    >
      <h1>404</h1>

      <h2>Page Not Found</h2>

      <p>
        The page you are looking for does not exist.
      </p>

      <a href="/">
        <button>
          Back to Home
        </button>
      </a>
    </div>
  );
}


function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ==================== PUBLIC ROUTES ==================== */}

        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        <Route
          path="/reset-password/:token"
          element={<ResetPassword />}
        />

        <Route
          path="/verify-email/:token"
          element={<VerifyEmail />}
        />

        <Route
          path="/products"
          element={<Products />}
        />

        <Route
          path="/products/:id"
          element={<ProductDetail />}
        />

        <Route
          path="/categories"
          element={<Categories />}
        />

        <Route
          path="/deals"
          element={<Deals />}
        />

        <Route
          path="/compare"
          element={<Compare />}
        />

        <Route
          path="/support"
          element={<Support />}
        />

        <Route
          path="/warranty-returns"
          element={<WarrantyReturns />}
        />

        <Route
          path="/cart"
          element={<Cart />}
        />

        <Route
          path="/wishlist"
          element={<Wishlist />}
        />


        {/* ==================== PROTECTED USER ROUTES ==================== */}

        <Route element={<ProtectedRoute />}>

          <Route
            path="/checkout"
            element={<Checkout />}
          />

          <Route
            path="/order-confirmation/:id"
            element={<OrderConfirmation />}
          />

          <Route
            path="/orders"
            element={<Orders />}
          />

          <Route
            path="/orders/:id/track"
            element={<TrackOrder />}
          />

          <Route
            path="/profile"
            element={<Profile />}
          />

        </Route>


        {/* ==================== ADMIN ROUTES ==================== */}

        <Route element={<AdminRoute />}>

          <Route element={<AdminLayout />}>

            <Route
              path="/admin/dashboard"
              element={<AdminDashboard />}
            />

            <Route
              path="/admin/products"
              element={<AdminProducts />}
            />

            <Route
              path="/admin/products/new"
              element={<AdminProductForm />}
            />

            <Route
              path="/admin/products/:id/edit"
              element={<AdminProductForm />}
            />

            <Route
              path="/admin/orders"
              element={<AdminOrders />}
            />

            <Route
              path="/admin/users"
              element={<AdminUsers />}
            />

            <Route
              path="/admin/attack-logs"
              element={<AdminWafLogs />}
            />

            <Route
              path="/admin/blocked-ips"
              element={<AdminBlockedIps />}
            />

          </Route>

        </Route>


        {/* ==================== 404 ROUTE ==================== */}

        <Route
          path="*"
          element={<NotFound />}
        />

      </Routes>
    </BrowserRouter>
  );
}


export default AppRoutes;