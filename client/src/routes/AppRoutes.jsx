import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import Products from "../pages/Products";
import ProductDetail from "../pages/ProductDetail";
import Cart from "../pages/Cart";
import Wishlist from "../pages/Wishlist";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Checkout from "../pages/Checkout";
import OrderConfirmation from "../pages/OrderConfirmation";
import Orders from "../pages/Orders";
import Categories from "../pages/Categories";
import Deals from "../pages/Deals";
import Compare from "../pages/Compare";
import Support from "../pages/Support";
import ProtectedRoute from "./ProtectedRoute";

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0F1115] px-6 text-center text-white">
      <div>
        <p className="text-6xl font-black text-green-400">404</p>
        <h1 className="mt-4 text-3xl font-semibold">Page Not Found</h1>
        <p className="mt-3 text-[#B8BEC9]">
          The page you are looking for does not exist.
        </p>
        <a
          href="/"
          className="mt-6 inline-flex rounded-xl bg-green-500 px-5 py-3 font-semibold text-white transition hover:bg-green-600"
        >
          Back to Home
        </a>
      </div>
    </div>
  );
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/deals" element={<Deals />} />
        <Route path="/compare" element={<Compare />} />
        <Route path="/support" element={<Support />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/wishlist" element={<Wishlist />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-confirmation/:id" element={<OrderConfirmation />} />
          <Route path="/orders" element={<Orders />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
