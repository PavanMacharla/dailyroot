'use client';
import Link from 'next/link';
import { useCart } from '@/components/cart-provider';
import { createClient } from '@/lib/supabase';
import { useEffect, useState } from 'react';

export default function SiteHeader() {
  const { itemCount } = useCart();
  const supabase = createClient();
  const [session, setSession] = useState<{ email?: string; role?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      const sb = createClient();
      if (!sb) { setLoading(false); return; }
      const { data } = await sb.auth.getSession();
      if (!cancelled && data.session) {
        setSession({ email: data.session.user.email, role: data.session.user.user_metadata.role });
      }
      const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
        if (!cancelled) {
          setSession(session ? { email: session.user.email, role: session.user.user_metadata.role } : null);
          setLoading(false);
        }
      });
      setLoading(false);
      return () => {
        cancelled = true;
        sub?.subscription?.unsubscribe?.();
      };
    }
    void init();
  }, []);

  async function handleSignOut() {
    const sb = createClient();
    if (sb) await sb.auth.signOut();
  }

  const isAdmin = session?.role === 'admin';

  if (loading || !supabase) {
    return (
      <header className="wrap nav">
        <Link className="brand" href="/">DailyRoot<span style={{ color: '#9aaa80' }}>.</span></Link>
        <nav className="navlinks">
          <Link href="/shop">Shop all</Link>
          <Link href="/shop?category=Fruits">Fruits</Link>
          <Link href="/shop?category=Vegetables">Vegetables</Link>
          <Link href="/shop?category=Dairy">Dairy</Link>
        </nav>
        <div className="navright">
          <Link href="/admin">Admin</Link>
          <Link className="pill" href="/cart">Basket ({itemCount})</Link>
        </div>
      </header>
    );
  }

  return (
    <header className="wrap nav">
      <Link className="brand" href="/">DailyRoot<span style={{ color: '#9aaa80' }}>.</span></Link>
      <nav className="navlinks">
        <Link href="/shop">Shop all</Link>
        <Link href="/shop?category=Fruits">Fruits</Link>
        <Link href="/shop?category=Vegetables">Vegetables</Link>
        <Link href="/shop?category=Dairy">Dairy</Link>
      </nav>
      <div className="navright">
        {session ? (
          <>
            <span className="muted" style={{ fontSize: 12, marginRight: 10 }}>{session.email}</span>
            {isAdmin && <Link href="/admin" className="btn" style={{ padding: '8px 14px', fontSize: 12, marginRight: 10 }}>Admin</Link>}
            <button className="text-button" onClick={handleSignOut}>Sign out</button>
          </>
        ) : (
          <>
            <Link href="/auth/signin">Sign in</Link>
            <Link href="/auth/signup" className="muted" style={{ marginLeft: 8 }}>Sign up</Link>
            <Link className="pill" href="/cart">Basket ({itemCount})</Link>
          </>
        )}
      </div>
    </header>
  );
}
