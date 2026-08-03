import { Link } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import ProductCard from "../components/product/ProductCard";
import { useWishlist } from "../context/WishlistContext";

function Wishlist() {
  const { wishlist, removeFromWishlist } = useWishlist();

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#0F1115] px-8 py-16 text-white">
        <div className="mx-auto max-w-[1500px]">
          <div className="mb-10">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-green-400">
              Saved Items
            </p>
            <h1 className="mt-2 text-4xl font-bold">My Wishlist</h1>
            <p className="mt-2 text-[#B8BEC9]">{wishlist.length} items saved</p>
          </div>

          {wishlist.length === 0 ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl border border-[#2D333D] bg-[#1A1D24] px-6 text-center">
              <p className="text-2xl font-semibold">Your wishlist is empty</p>
              <p className="mt-3 text-[#B8BEC9]">
                Save products you love and come back anytime.
              </p>
              <Link
                to="/products"
                className="mt-6 inline-flex rounded-xl bg-green-500 px-5 py-3 font-semibold text-white transition hover:bg-green-600"
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {wishlist.map((item) => (
                <div key={item.id} className="relative">
                  <ProductCard product={item} />
                  <button
                    type="button"
                    onClick={() => removeFromWishlist(item.id)}
                    className="absolute right-3 top-3 rounded-full border border-[#2D333D] bg-[#0F1115] px-3 py-2 text-sm text-[#B8BEC9] transition hover:border-green-500 hover:text-green-400"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

export default Wishlist;
