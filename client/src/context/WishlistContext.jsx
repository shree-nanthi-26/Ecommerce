import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import {
  getWishlist as getRemoteWishlist,
  syncWishlist as syncRemoteWishlist,
  addToWishlist as addRemoteWishlistItem,
  removeFromWishlist as removeRemoteWishlistItem,
} from "../services/wishlistService";

const WishlistContext = createContext(null);
const GUEST_WISHLIST_KEY = "electromart_guest_wishlist";

function normalizeWishlistProduct(product) {
  return {
    id: product._id || product.id,
    name: product.name || "",
    price: product.price ?? 0,
    oldPrice: product.oldPrice ?? 0,
    rating: product.rating ?? 0,
    reviews: product.reviews ?? 0,
    category: product.category || "",
  };
}

function WishlistProvider({ children }) {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState(() => {
    const storedWishlist = localStorage.getItem(GUEST_WISHLIST_KEY);
    return storedWishlist ? JSON.parse(storedWishlist) : [];
  });

  useEffect(() => {
    if (!user) {
      localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(wishlist));
    }
  }, [wishlist, user]);

  useEffect(() => {
    if (!user) return;

    const fetchWishlist = async () => {
      try {
        const remoteWishlist = await getRemoteWishlist();
        const remoteItems = (remoteWishlist?.products || []).map(normalizeWishlistProduct);
        const guestIds = wishlist.map((item) => item.id);
        const remoteIds = remoteItems.map((item) => item.id);

        if (guestIds.length) {
          const mergedIds = Array.from(new Set([...remoteIds, ...guestIds]));
          const syncedWishlist = await syncRemoteWishlist(mergedIds);
          const syncedItems = (syncedWishlist?.products || []).map(normalizeWishlistProduct);
          setWishlist(syncedItems);
          localStorage.removeItem(GUEST_WISHLIST_KEY);
        } else {
          setWishlist(remoteItems);
        }
      } catch (error) {
        console.error("Unable to load wishlist:", error);
      }
    };

    fetchWishlist();
  }, [user]);

  const addToWishlist = async (product) => {
    const productId = product._id || product.id;

    if (user) {
      const updatedWishlist = await addRemoteWishlistItem(productId);
      setWishlist((updatedWishlist?.products || []).map(normalizeWishlistProduct));
      return;
    }

    setWishlist((currentWishlist) => {
      if (currentWishlist.some((item) => item.id === productId)) {
        return currentWishlist;
      }

      return [
        ...currentWishlist,
        normalizeWishlistProduct(product),
      ];
    });
  };

  const removeFromWishlist = async (id) => {
    if (user) {
      const updatedWishlist = await removeRemoteWishlistItem(id);
      setWishlist((updatedWishlist?.products || []).map(normalizeWishlistProduct));
      return;
    }

    setWishlist((currentWishlist) => currentWishlist.filter((item) => item.id !== id));
  };

  const toggleWishlist = (product) => {
    const productId = product._id || product.id;
    const exists = wishlist.some((item) => item.id === productId);

    if (exists) {
      removeFromWishlist(productId);
    } else {
      addToWishlist(product);
    }
  };

  const isInWishlist = (id) => wishlist.some((item) => item.id === id);

  const wishlistCount = useMemo(() => wishlist.length, [wishlist]);

  const value = useMemo(
    () => ({
      wishlist,
      addToWishlist,
      removeFromWishlist,
      toggleWishlist,
      isInWishlist,
      wishlistCount,
    }),
    [wishlist, wishlistCount]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

function useWishlist() {
  const context = useContext(WishlistContext);

  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }

  return context;
}

export { WishlistProvider, useWishlist };
export default WishlistProvider;
