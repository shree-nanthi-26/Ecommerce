import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import { useCart } from "./CartContext";
import {
  getWishlist as getRemoteWishlist,
  syncWishlist as syncRemoteWishlist,
  addToWishlist as addRemoteWishlistItem,
  removeFromWishlist as removeRemoteWishlistItem,
  clearWishlist as clearRemoteWishlist,
  updateWishlistNotifications as updateRemoteWishlistNotifications,
  moveWishlistItemToCart as moveRemoteWishlistItemToCart,
} from "../services/wishlistService";
import { getAllProducts } from "../services/productService";

const WishlistContext = createContext(null);
const GUEST_WISHLIST_KEY = "furniva_guest_wishlist";
const LEGACY_WISHLIST_KEY = "electromart_guest_wishlist";

function normalizeWishlistProduct(product) {
  let images = [];
  if (Array.isArray(product.images) && product.images.length > 0) {
    images = product.images.map((img) =>
      typeof img === "string"
        ? { url: img, publicId: "" }
        : { url: img?.url || "", publicId: img?.publicId || "" }
    );
  } else if (product.image) {
    images = [
      {
        url: typeof product.image === "string" ? product.image : product.image?.url || "",
        publicId: product.image?.publicId || "",
      },
    ];
  }

  const id = product._id || product.id;
  const currentPrice = Number(product.price) || 0;
  const priceWhenAdded = Number(product.priceWhenAdded) || currentPrice;
  const priceDrop =
    currentPrice < priceWhenAdded ? priceWhenAdded - currentPrice : Number(product.priceDrop) || 0;

  return {
    _id: id,
    id,
    name: product.name || "",
    price: currentPrice,
    oldPrice: Number(product.oldPrice) || 0,
    priceWhenAdded,
    priceDrop,
    notifyOnPriceDrop: Boolean(product.notifyOnPriceDrop),
    notifyOnRestock: Boolean(product.notifyOnRestock),
    addedAt: product.addedAt || new Date().toISOString(),
    rating: product.rating ?? 0,
    reviews: product.reviews ?? 0,
    category: product.category || "",
    images,
    image: images[0]?.url || (typeof product.image === "string" ? product.image : ""),
    stock: product.stock ?? 10,
    lowStockThreshold: product.lowStockThreshold ?? 5,
    badge: product.badge || "",
    specs: product.specs || {},
    description: product.description || "",
  };
}

function WishlistProvider({ children }) {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [wishlist, setWishlist] = useState(() => {
    try {
      let storedWishlist = localStorage.getItem(GUEST_WISHLIST_KEY);
      if (!storedWishlist) {
        storedWishlist = localStorage.getItem(LEGACY_WISHLIST_KEY);
        if (storedWishlist) {
          localStorage.setItem(GUEST_WISHLIST_KEY, storedWishlist);
          localStorage.removeItem(LEGACY_WISHLIST_KEY);
        }
      }
      return storedWishlist ? JSON.parse(storedWishlist).map(normalizeWishlistProduct) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (!user) {
      localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(wishlist));
      localStorage.removeItem(LEGACY_WISHLIST_KEY);
    }
  }, [wishlist, user]);

  // Auto-heal items in wishlist that were stored previously without images
  useEffect(() => {
    const itemsMissingImages = wishlist.filter(
      (item) => !item.images || item.images.length === 0 || !item.images[0]?.url
    );

    if (itemsMissingImages.length === 0) return;

    let isMounted = true;

    const healWishlist = async () => {
      try {
        const res = await getAllProducts({ limit: 100 });
        const allFetchedProducts = res.products || [];

        if (!isMounted) return;

        setWishlist((prevWishlist) => {
          let modified = false;
          const updated = prevWishlist.map((item) => {
            const itemId = item.id || item._id;
            if (!item.images || item.images.length === 0 || !item.images[0]?.url) {
              const matched = allFetchedProducts.find((p) => (p._id || p.id) === itemId);
              if (matched) {
                modified = true;
                return normalizeWishlistProduct({ ...item, ...matched });
              }
            }
            return item;
          });

          return modified ? updated : prevWishlist;
        });
      } catch (err) {
        console.warn("Could not auto-heal wishlist images:", err);
      }
    };

    healWishlist();

    return () => {
      isMounted = false;
    };
  }, [wishlist]);

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
          localStorage.removeItem(LEGACY_WISHLIST_KEY);
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
      if (currentWishlist.some((item) => (item._id || item.id) === productId)) {
        return currentWishlist;
      }

      return [
        ...currentWishlist,
        normalizeWishlistProduct({
          ...product,
          priceWhenAdded: product.price,
          addedAt: new Date().toISOString(),
        }),
      ];
    });
  };

  const removeFromWishlist = async (id) => {
    const targetId = id?._id || id?.id || id;
    if (user) {
      const updatedWishlist = await removeRemoteWishlistItem(targetId);
      setWishlist((updatedWishlist?.products || []).map(normalizeWishlistProduct));
      return;
    }

    setWishlist((currentWishlist) =>
      currentWishlist.filter((item) => (item._id || item.id) !== targetId)
    );
  };

  const clearWishlist = async () => {
    if (user) {
      await clearRemoteWishlist();
      setWishlist([]);
      return;
    }

    setWishlist([]);
    localStorage.removeItem(GUEST_WISHLIST_KEY);
    localStorage.removeItem(LEGACY_WISHLIST_KEY);
  };

  const toggleWishlist = (product) => {
    const productId = product._id || product.id;
    const exists = wishlist.some((item) => (item._id || item.id) === productId);

    if (exists) {
      removeFromWishlist(productId);
    } else {
      addToWishlist(product);
    }
  };

  const isInWishlist = (id) => {
    const targetId = id?._id || id?.id || id;
    return wishlist.some((item) => (item._id || item.id) === targetId);
  };

  const updateNotificationConsent = async (productId, data) => {
    if (user) {
      const res = await updateRemoteWishlistNotifications(productId, data);
      if (res?.data?.products) {
        setWishlist(res.data.products.map(normalizeWishlistProduct));
      }
      return res;
    }

    setWishlist((currentWishlist) =>
      currentWishlist.map((item) => {
        if ((item._id || item.id) === productId) {
          return {
            ...item,
            notifyOnPriceDrop:
              data.notifyOnPriceDrop !== undefined
                ? Boolean(data.notifyOnPriceDrop)
                : item.notifyOnPriceDrop,
            notifyOnRestock:
              data.notifyOnRestock !== undefined
                ? Boolean(data.notifyOnRestock)
                : item.notifyOnRestock,
          };
        }
        return item;
      })
    );
    return { success: true };
  };

  const moveToCart = async (product) => {
    const productId = product._id || product.id;
    if (user) {
      const res = await moveRemoteWishlistItemToCart(productId);
      if (res?.wishlist?.products) {
        setWishlist(res.wishlist.products.map(normalizeWishlistProduct));
      } else {
        removeFromWishlist(productId);
      }
      await addToCart(product, 1);
      return res;
    }

    await addToCart(product, 1);
    removeFromWishlist(productId);
    return { success: true };
  };

  const wishlistCount = useMemo(() => wishlist.length, [wishlist]);

  const value = useMemo(
    () => ({
      wishlist,
      addToWishlist,
      removeFromWishlist,
      clearWishlist,
      toggleWishlist,
      isInWishlist,
      updateNotificationConsent,
      moveToCart,
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
