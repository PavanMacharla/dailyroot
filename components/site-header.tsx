'use client';
import Link from 'next/link';
import { useCart } from '@/components/cart-provider';

export default function SiteHeader() {
  const { itemCount } = useCart();
  return <header className="wrap nav">
    <Link className="brand" href="/">DailyRoot<span style={{ color: '#9aaa80' }}>.</span></Link>
    <nav className="navlinks">
      <Link href="/shop">Shop all</Link>
      <Link href="/shop?category=Fruits">Fruits</Link>
      <Link href="/shop?category=Vegetables">Vegetables</Link>
      <Link href="/shop?category=Dairy">Dairy</Link>
    </nav>
    <div className="navright"><Link href="/admin">Admin</Link><Link className="pill" href="/cart">Basket ({itemCount})</Link></div>
  </header>;
}
