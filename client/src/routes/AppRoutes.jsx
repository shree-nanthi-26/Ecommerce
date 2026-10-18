import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import PageSkeleton from "../components/common/PageSkeleton";

// Core Guards & Layouts
import ProtectedRoute from "./ProtectedRoute";
import AdminRoute from "./AdminRoute";
import AdminLayout from "../components/layout/AdminLayout";

// Customer Pages (Lazy loaded)
const Home = lazy(() => import("../pages/Home"));
const Products = lazy(() => import("../pages/Products"));
const ProductDetail = lazy(() => import("../pages/ProductDetail"));
const Cart = lazy(() => import("../pages/Cart"));
const Wishlist = lazy(() => import("../pages/Wishlist"));
const Login = lazy(() => import("../pages/Login"));
const Register = lazy(() => import("../pages/Register"));
const ForgotPassword = lazy(() => import("../pages/ForgotPassword"));
const ResetPassword = lazy(() => import("../pages/ResetPassword"));
const VerifyEmail = lazy(() => import("../pages/VerifyEmail"));
const Checkout = lazy(() => import("../pages/Checkout"));
const OrderConfirmation = lazy(() => import("../pages/OrderConfirmation"));
const Orders = lazy(() => import("../pages/Orders"));
const Categories = lazy(() => import("../pages/Categories"));
const Deals = lazy(() => import("../pages/Deals"));
const Compare = lazy(() => import("../pages/Compare"));
const Support = lazy(() => import("../pages/Support"));
const TrackOrder = lazy(() => import("../pages/TrackOrder"));
const WarrantyReturns = lazy(() => import("../pages/WarrantyReturns"));
const Profile = lazy(() => import("../pages/Profile"));
const Addresses = lazy(() => import("../pages/Addresses"));
const NotificationCenter = lazy(() => import("../pages/NotificationCenter"));
const Unsubscribe = lazy(() => import("../pages/Unsubscribe"));

// Admin Pages (Lazy loaded)
const AdminDashboard = lazy(() => import("../pages/admin/Dashboard"));
const AdminProducts = lazy(() => import("../pages/admin/Products"));
const AdminProductForm = lazy(() => import("../pages/admin/ProductForm"));
const AdminInventory = lazy(() => import("../pages/admin/Inventory"));
const AdminOrders = lazy(() => import("../pages/admin/Orders"));
const AdminReturns = lazy(() => import("../pages/admin/Returns"));
const AdminTickets = lazy(() => import("../pages/admin/Tickets"));
const AdminUsers = lazy(() => import("../pages/admin/Users"));
const AdminActivity = lazy(() => import("../pages/admin/Activity"));
const AdminSecurityDashboard = lazy(() => import("../pages/admin/SecurityDashboard"));

// Heavy interactive widgets (Lazy loaded)
const ShoppingAssistant = lazy(() => import("../components/assistant/ShoppingAssistant"));

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
      <p>The page you are looking for does not exist.</p>
      <a href="/">
        <button className="btn-primary mt-4">Back to Home</button>
      </a>
    </div>
  );
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageSkeleton />}>
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

        <Route
          path="/notifications"
          element={<NotificationCenter />}
        />

        <Route
          path="/unsubscribe"
          element={<Unsubscribe />}
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

          <Route
            path="/addresses"
            element={<Addresses />}
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
              path="/admin/inventory"
              element={<AdminInventory />}
            />

            <Route
              path="/admin/orders"
              element={<AdminOrders />}
            />

            <Route
              path="/admin/returns"
              element={<AdminReturns />}
            />

            <Route
              path="/admin/tickets"
              element={<AdminTickets />}
            />

            <Route
              path="/admin/users"
              element={<AdminUsers />}
            />

            <Route
              path="/admin/activity"
              element={<AdminActivity />}
            />

            <Route
              path="/admin/security"
              element={<AdminSecurityDashboard />}
            />

            <Route
              path="/admin/attack-logs"
              element={<AdminSecurityDashboard />}
            />

            <Route
              path="/admin/blocked-ips"
              element={<AdminSecurityDashboard />}
            />

          </Route>

        </Route>


        {/* ==================== 404 ROUTE ==================== */}

        <Route
          path="*"
          element={<NotFound />}
        />

      </Routes>
      <ShoppingAssistant />
      </Suspense>
    </BrowserRouter>
  );
}


export default AppRoutes;