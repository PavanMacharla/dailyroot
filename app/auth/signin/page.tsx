'use client';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SignInPage() {
  const supabase = createClient();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignIn(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setLoading(true);
    const sb = supabase;
    if (!sb) { setError('Supabase is not configured.'); setLoading(false); return; }
    const { error: err } = await sb.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.push('/cart');
  }

  if (!supabase) {
    return (
      <main className="wrap shophead">
        <span className="eyebrow">Sign in</span>
        <h1>DailyRoot sign in</h1>
        <p className="muted">Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment.</p>
      </main>
    );
  }

  return (
    <main className="wrap shophead">
      <span className="eyebrow">Welcome back</span>
      <h1>Sign in to DailyRoot</h1>
      {error && <p style={{ color: '#f0a3a3', fontSize: 13, marginBottom: 14 }}>{error}</p>}
      <form onSubmit={handleSignIn} style={{ maxWidth: 420 }}>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 12, color: '#718075', marginBottom: 6 }}>Email address</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="input"
          />
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: 'block', fontSize: 12, color: '#718075', marginBottom: 6 }}>Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="input"
          />
        </div>
        <button type="submit" className="btn" disabled={loading} style={{ width: '100%' }}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="muted" style={{ marginTop: 16, fontSize: 12 }}>
        New to DailyRoot?{' '}
        <Link href="/auth/signup" className="muted" style={{ color: '#244b38', textDecoration: 'underline' }}>
          Create an account
        </Link>
      </p>
    </main>
  );
}
