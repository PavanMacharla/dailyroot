'use client';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { useCart } from '@/components/cart-provider';
import { useState } from 'react';

export default function Cart() {
  const { items, subtotal, setQuantity, removeItem, getProduct } = useCart();
  const supabase = createClient();
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placed, setPlaced] = useState(false);

  async function handleCheckout() {
    if (!supabase) { setError('Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment.'); return; }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setError('Please sign in before placing an order.'); return; }
    setPlacing(true); setError(null);
    const payload = items.map((line) => {
      const product = getProduct(line.productId);
      if (!product) return null;
      return { product_id: product.id, quantity: line.quantity };
    }).filter(Boolean);
    const { error: rpcError } = await supabase.rpc('place_cod_order', {
      p_address_id: null,
      p_items: payload,
      p_customer_note: null
    });
    if (rpcError) { setError(rpcError.message); setPlacing(false); return; }
    setPlaced(true);
  }

  if (placed) return <main className="wrap shophead"><span className="eyebrow">Order placed</span><h1>Thank you, DailyRoot order confirmed.</h1><p className="muted">Your cash-on-delivery order has been recorded. You will receive updates as it is packed and delivered.</p><Link className="btn" href="/shop">Continue shopping →</Link></main>;

  return <main className="wrap shophead">
    <span className="eyebrow">Your basket</span><h1>Your DailyRoot basket.</h1>
    {items.length === 0 ? <><p className="muted">Your basket is empty. Add some fresh favourites to get started.</p><Link className="btn" href="/shop">Continue shopping →</Link></> : <>
      <div className="cart-list">{items.map((line) => {
        const product = getProduct(line.productId);
        if (!product) return null;
        return <div className="cart-line" key={line.productId}>
          <img src={product.image} alt={product.name}/>
          <div className="cart-description"><strong>{product.name}</strong><span className="muted">{product.unit} · ₹{product.price} each</span><button className="text-button remove-button" onClick={() => removeItem(product.id)}>Remove</button></div>
          <div className="quantity-control"><button aria-label={`Decrease ${product.name} quantity`} onClick={() => setQuantity(product.id, line.quantity - 1)}>−</button><span>{line.quantity}</span><button aria-label={`Increase ${product.name} quantity`} onClick={() => setQuantity(product.id, line.quantity + 1)}>+</button></div>
          <strong className="line-total">₹{product.price * line.quantity}</strong>
        </div>;
      })}</div>
      <div className="cart-summary"><div><span>Subtotal</span><strong>₹{subtotal}</strong></div><p className="muted">Delivery charges and any applicable discounts will be calculated at checkout.</p>
        {error && <p style={{color:'#f0a3a3',fontSize:13}}>{error}</p>}
        <button className="btn" onClick={handleCheckout} disabled={placing}>{placing ? 'Placing order…' : 'Proceed to checkout →'}</button>
        <Link className="continue-link" href="/shop">Continue shopping</Link>
      </div>
    </>}
  </main>;
}
