'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { products as sampleProducts, type Product } from '@/lib/products';
import { createClient } from '@/lib/supabase';

type CartLine = { productId: string; quantity: number };
export type CatalogStatus = 'loading' | 'live' | 'empty' | 'unavailable' | 'unconfigured';
type CartContextValue = {
  items: CartLine[];
  itemCount: number;
  subtotal: number;
  products: Product[];
  catalogStatus: CatalogStatus;
  addItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  getProduct: (productId: string) => Product | undefined;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = 'dailyroot-cart-v1';

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [catalog, setCatalog] = useState<Product[]>(sampleProducts);
  const [catalogStatus, setCatalogStatus] = useState<CatalogStatus>('loading');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadCatalogAndCart() {
      let nextProducts = sampleProducts;
      let nextStatus: CatalogStatus = 'unconfigured';

      const sb = createClient();
      if (sb) {
        try {
          const { data, error } = await sb
            .from('products')
            .select('id,name,price,unit,image_url,is_active,categories(name,slug)')
            .eq('is_active', true)
            .order('name');

          if (error) {
            nextStatus = 'unavailable';
          } else {
            const liveProducts = (data || []).map((row: any) => ({
              id: row.id,
              name: row.name,
              category: row.categories?.name || 'Uncategorised',
              price: Number(row.price),
              unit: row.unit,
              image: row.image_url,
              badge: undefined
            }));
            if (liveProducts.length > 0) {
              nextProducts = liveProducts;
              nextStatus = 'live';
            } else {
              nextStatus = 'empty';
            }
          }
        } catch {
          nextStatus = 'unavailable';
        }
      }

      if (cancelled) return;
      setCatalog(nextProducts);
      setCatalogStatus(nextStatus);

      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed: unknown = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setItems(parsed.filter((line): line is CartLine =>
              !!line && typeof line.productId === 'string' &&
              nextProducts.some((product) => product.id === line.productId) &&
              Number.isInteger(line.quantity) && line.quantity > 0
            ));
          }
        }
      } catch {
        try {
          window.localStorage.removeItem(STORAGE_KEY);
        } catch {
          // Storage may be unavailable in private or restricted contexts.
        }
      }
      setReady(true);
    }

    void loadCatalogAndCart();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (ready) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, ready]);

  const value = useMemo<CartContextValue>(() => {
    const itemCount = items.reduce((sum, line) => sum + line.quantity, 0);
    const subtotal = items.reduce((sum, line) => {
      const product = catalog.find((item) => item.id === line.productId);
      return sum + (product ? product.price * line.quantity : 0);
    }, 0);
    return {
      items,
      itemCount,
      subtotal,
      products: catalog,
      catalogStatus,
      addItem: (productId) => setItems((current) => {
        if (!catalog.some((product) => product.id === productId)) return current;
        const existing = current.find((line) => line.productId === productId);
        return existing
          ? current.map((line) => line.productId === productId ? { ...line, quantity: line.quantity + 1 } : line)
          : [...current, { productId, quantity: 1 }];
      }),
      setQuantity: (productId, quantity) => setItems((current) => quantity <= 0
        ? current.filter((line) => line.productId !== productId)
        : current.map((line) => line.productId === productId ? { ...line, quantity } : line)),
      removeItem: (productId) => setItems((current) => current.filter((line) => line.productId !== productId)),
      getProduct: (productId) => catalog.find((product) => product.id === productId),
    };
  }, [items, catalog, catalogStatus]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside CartProvider');
  return context;
}
