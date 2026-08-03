import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import {
  getCart as getRemoteCart,
  syncCart as syncRemoteCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCart as clearRemoteCart,
} from "../services/cartService";

const CartContext = createContext(null);
const GUEST_CART_KEY = "electromart_guest_cart";

function normalizeCartItem(item) {
  const product = item.product || {};
  const id = product._id || product.id || item.id;

  return {
    id,
    name: product.name || item.name || "",
    price: item.price ?? product.price ?? 0,
    quantity: item.quantity || 0,
  };
}

function transformCartResponse(cartData) {
  return (cartData?.items || []).map(normalizeCartItem);
}

function mapCartItemsForSync(items) {
  return items.map((item) => ({ productId: item.id, quantity: item.quantity }));
}

function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState(() => {
    const storedCart = localStorage.getItem(GUEST_CART_KEY);
    return storedCart ? JSON.parse(storedCart) : [];
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
    }
  }, [cart, user]);

  useEffect(() => {
    if (!user) return;

    const fetchCart = async () => {
      setLoading(true);
      try {
        const remoteCart = await getRemoteCart();
        const remoteItems = transformCartResponse(remoteCart);
        const hasGuestItems = cart.length > 0;

        if (hasGuestItems) {
          const merged = new Map();

          [...remoteItems, ...cart].forEach((item) => {
            const existing = merged.get(item.id);
            if (existing) {
              merged.set(item.id, {
                ...existing,
                quantity: existing.quantity + item.quantity,
              });
            } else {
              merged.set(item.id, { ...item });
            }
          });

          const mergedItems = Array.from(merged.values());
          const syncedCart = await syncRemoteCart(mapCartItemsForSync(mergedItems));
          const syncedItems = transformCartResponse(syncedCart);
          setCart(syncedItems);
          localStorage.removeItem(GUEST_CART_KEY);
        } else {
          setCart(remoteItems);
        }
      } catch (error) {
        console.error("Unable to load cart:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [user]);

  const addToCart = async (product, quantity = 1) => {
    const productId = product._id || product.id;

    if (user) {
      const updatedCart = await addCartItem(productId, quantity);
      setCart(transformCartResponse(updatedCart));
      return;
    }

    setCart((currentCart) => {
      const existingItem = currentCart.find((item) => item.id === productId);
      if (existingItem) {
        return currentCart.map((item) =>
          item.id === productId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      return [
        ...currentCart,
        {
          id: productId,
          name: product.name,
          price: product.price,
          quantity,
        },
      ];
    });
  };

  const removeFromCart = async (id) => {
    if (user) {
      const updatedCart = await removeCartItem(id);
      setCart(transformCartResponse(updatedCart));
      return;
    }
    setCart((currentCart) => currentCart.filter((item) => item.id !== id));
  };

  const updateQuantity = async (id, newQuantity) => {
    if (user) {
      const updatedCart = await updateCartItem(id, newQuantity);
      setCart(transformCartResponse(updatedCart));
      return;
    }

    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.id === id ? { ...item, quantity: newQuantity } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const clearCart = async () => {
    if (user) {
      const updatedCart = await clearRemoteCart();
      setCart(transformCartResponse(updatedCart));
      return;
    }

    setCart([]);
  };

  const cartCount = useMemo(
    () => cart.reduce((total, item) => total + item.quantity, 0),
    [cart]
  );

  const cartTotal = useMemo(
    () => cart.reduce((total, item) => total + item.price * item.quantity, 0),
    [cart]
  );

  const value = useMemo(
    () => ({
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartCount,
      cartTotal,
      loading,
    }),
    [cart, cartCount, cartTotal, loading]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }

  return context;
}

export { CartProvider, useCart };
export default CartProvider;
