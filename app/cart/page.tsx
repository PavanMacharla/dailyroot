'use client';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { useCart } from '@/components/cart-provider';
import { useEffect, useState } from 'react';

export default function Cart() {
  const { items, subtotal, setQuantity, removeItem, getProduct } = useCart();
  const supabase = createClient();
  const [session, setSession] = useState<{ email?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      if (!supabase) { setLoading(false); return; }
      const { data } = await supabase.auth.getSession();
      if (!cancelled) {
        setSession(data.session ? { email: data.session.user.email } : null);
      }
      setLoading(false);
    }
    void init();
    return () => { cancelled = true; };
  }, [supabase]);

  if (loading) {
    return (
      <main className="wrap shophead">
        <span className="eyebrow">Your basket</span>
        <h1>Loading…</h1>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="wrap shophead">
        <span className="eyebrow">Sign in to check out</span>
        <h1>Your DailyRoot basket.</h1>
        <p className="muted">Please <Link href="/auth/signin">sign in</Link> before placing an order.</p>
        <Link className="btn" href="/auth/signin">Sign in →</Link>
        <Link className="continue-link" href="/shop">Continue shopping</Link>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="wrap shophead">
        <span className="eyebrow">Your basket</span>
        <h1>Your DailyRoot basket.</h1>
        <p className="muted">Your basket is empty. Add some fresh favourites to get started.</p>
        <Link className="btn" href="/shop">Continue shopping →</Link>
      </main>
    );
  }

  return (
    <main className="wrap shophead">
      <span className="eyebrow">Your basket</span>
      <h1>Your DailyRoot basket.</h1>
      <div className="cart-list">
        {items.map((line) => {
          const product = getProduct(line.productId);
          if (!product) return null;
          return (
            <div className="cart-line" key={line.productId}>
              <img src={product.image} alt={product.name} />
              <div className="cart-description">
                <strong>{product.name}</strong>
                <span className="muted">{product.unit} · ₹{product.price} each</span>
                <button className="text-button remove-button" onClick={() => removeItem(product.id)}>
                  Remove
                </button>
                <div className="quantity-control">
                  <button
                    aria-label={`Decrease ${product.name} quantity`}
                    onClick={() => setQuantity(product.id, line.quantity - 1)}
                  >
                    −
                  </button>
                  <span>{line.quantity}</span>
                  <button
                    aria-label={`Increase ${product.name} quantity`}
                    onClick={() => setQuantity(product.id, line.quantity + 1)}
                  >
                    +
                  </button>
                </div>
              </div>
              <strong className="line-total">₹{product.price * line.quantity}</strong>
            </div>
          );
        })}
      </div>
      <div className="cart-summary">
        <div><span>Subtotal</span><strong>₹{subtotal}</strong></div>
        <p className="muted">Delivery charges and any applicable discounts will be calculated at checkout.</p>
        <Link className="btn" href="/payment">
          Proceed to checkout →
        </Link>
        <Link className="continue-link" href="/shop">Continue shopping</Link>
      </div>
    </main>
  );
}
