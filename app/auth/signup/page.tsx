'use client';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SignUpPage() {
  const supabase = createClient();
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignUp(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setLoading(true);
    const sb = supabase;
    if (!sb) { setError('Supabase is not configured.'); setLoading(false); return; }
    const { error: err } = await sb.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
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
        <span className="eyebrow">Create an account</span>
        <h1>DailyRoot sign up</h1>
        <p className="muted">Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment.</p>
      </main>
    );
  }

  return (
    <main className="wrap shophead">
      <span className="eyebrow">Join DailyRoot</span>
      <h1>Create an account</h1>
      {error && <p style={{ color: '#f0a3a3', fontSize: 13, marginBottom: 14 }}>{error}</p>}
      <form onSubmit={handleSignUp} style={{ maxWidth: 420 }}>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 12, color: '#718075', marginBottom: 6 }}>Full name</label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Pavan Macharla"
            className="input"
          />
        </div>
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
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p className="muted" style={{ marginTop: 16, fontSize: 12 }}>
        Already have an account?{' '}
        <Link href="/auth/signin" className="muted" style={{ color: '#244b38', textDecoration: 'underline' }}>
          Sign in
        </Link>
      </p>
    </main>
  );
}
