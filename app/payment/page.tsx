'use client';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { useCart } from '@/components/cart-provider';
import { useState, useEffect } from 'react';

type OrderLine = { productId: string; quantity: number };

export default function PaymentPage() {
  const { items, subtotal, setQuantity, removeItem, getProduct } = useCart();
  const supabase = createClient();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<{ email?: string } | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      if (!supabase) { setLoaded(true); return; }
      const { data } = await supabase.auth.getSession();
      if (!cancelled) {
        setSession(data.session ? { email: data.session.user.email } : null);
        setLoaded(true);
      }
    }
    void init();
    return () => { cancelled = true; };
  }, [supabase]);

  const lineItems = items;

  async function handlePayWithJustPay() {
    if (!supabase) {
      setError('Supabase is not configured.');
      return;
    }
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setError('Please sign in before paying.');
      return;
    }
    if (lineItems.length === 0) {
      setError('Your basket is empty.');
      return;
    }

    setPaying(true);
    setError(null);

    try {
      // JustPay integration point. JustPay does not publish a public client SDK,
      // so wire this to your backend / JustPay checkout API with your merchant key.
      // Example shape (replace with real endpoint and credentials):
      // const res = await fetch('https://api.justpay.io/v1/checkout/sessions', {
      //   method: 'POST',
      //   headers: {
      //     Authorization: `Bearer ${process.env.JUSTPAY_SECRET_KEY}`,
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     amount: subtotal * 100,
      //     currency: 'INR',
      //     customer_email: data.session.user.email,
      //     line_items: lineItems.map((l) => {
      //       const p = getProduct(l.productId);
      //       return { name: p?.name ?? 'Item', quantity: l.quantity, amount: p?.price ?? 0 };
      //     }),
      //     success_url: `${window.location.origin}/payment/success`,
      //     cancel_url: `${window.location.origin}/cart`,
      //   }),
      // });
      // const result = await res.json();
      // window.location.href = result.checkout_url;

      // Fallback placeholder until JustPay credentials are available.
      await new Promise((r) => setTimeout(r, 700));
    } catch (err: any) {
      setError(err.message || 'Payment could not be started.');
    } finally {
      setPaying(false);
    }
  }

  async function handlePlaceCodOrder() {
    if (!supabase) {
      setError('Supabase is not configured.');
      return;
    }
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setError('Please sign in before placing an order.');
      return;
    }
    setPaying(true);
    setError(null);
    const payload = lineItems.map((line) => {
      const product = getProduct(line.productId);
      if (!product) return null;
      return { product_id: product.id, quantity: line.quantity };
    }).filter(Boolean);
    const { error: rpcError } = await supabase.rpc('place_cod_order', {
      p_address_id: null,
      p_items: payload,
      p_customer_note: null,
    });
    if (rpcError) {
      setError(rpcError.message);
      setPaying(false);
      return;
    }
    setPaying(false);
  }

  if (!loaded) {
    return (
      <main className="wrap shophead">
        <span className="eyebrow">Payment</span>
        <h1>Loading…</h1>
      </main>
    );
  }

  return (
    <main className="wrap shophead">
      <span className="eyebrow">Payment</span>
      <h1>Pay for your order</h1>
      {session ? (
        <p className="muted">Signed in as {session.email}</p>
      ) : (
        <p className="muted">Please <Link href="/auth/signin">sign in</Link> to pay.</p>
      )}
      {error && <p style={{ color: '#f0a3a3', fontSize: 13, marginBottom: 14 }}>{error}</p>}
      <div className="cart-list">
        {lineItems.map((line) => {
          const product = getProduct(line.productId);
          if (!product) return null;
          return (
            <div className="cart-line" key={line.productId}>
              <img src={product.image} alt={product.name} />
              <div className="cart-description">
                <strong>{product.name}</strong>
                <span className="muted">{product.unit} · ₹{product.price} each</span>
                <div className="quantity-control">
                  <button onClick={() => setQuantity(product.id, line.quantity - 1)}>−</button>
                  <span>{line.quantity}</span>
                  <button onClick={() => setQuantity(product.id, line.quantity + 1)}>+</button>
                </div>
              </div>
              <strong className="line-total">₹{product.price * line.quantity}</strong>
            </div>
          );
        })}
      </div>
      <div className="cart-summary">
        <div><span>Subtotal</span><strong>₹{subtotal}</strong></div>
        <p className="muted">Delivery charges will be calculated at checkout.</p>
        <button className="btn" onClick={handlePayWithJustPay} disabled={paying} style={{ width: '100%', marginBottom: 10 }}>
          {paying ? 'Starting payment…' : 'Pay with JustPay'}
        </button>
        <button className="btn" onClick={handlePlaceCodOrder} disabled={paying} style={{ width: '100%', background: '#e8e9e1', color: '#202820' }}>
          {paying ? 'Placing…' : 'Pay cash on delivery'}
        </button>
        <Link className="continue-link" href="/shop">Continue shopping</Link>
      </div>
    </main>
  );
}
