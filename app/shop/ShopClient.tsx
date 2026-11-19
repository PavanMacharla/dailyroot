'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import ProductCard from '@/components/product-card';
import { useCart } from '@/components/cart-provider';
import { type Product } from '@/lib/products';

const categories = ['All', 'Fruits', 'Vegetables', 'Dairy', 'Bakery'];

export default function ShopClient({ initialProducts }: { initialProducts: Product[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const { itemCount } = useCart();

  useEffect(() => {
    const requested = searchParams.get('category') || 'All';
    setCategory(categories.includes(requested) ? requested : 'All');
  }, [searchParams]);

  const filtered = useMemo(() => initialProducts.filter((product) =>
    (category === 'All' || product.category === category) &&
    product.name.toLowerCase().includes(query.trim().toLowerCase())
  ), [category, query, initialProducts]);

  function changeCategory(next: string) {
    setCategory(next);
    const params = new URLSearchParams(searchParams.toString());
    if (next === 'All') params.delete('category'); else params.set('category', next);
    const suffix = params.toString();
    router.replace(suffix ? `${pathname}?${suffix}` : pathname, { scroll: false });
  }

  return <main className="wrap">
    <div className="shophead"><span className="eyebrow">The DailyRoot market</span><h1>Good things, gathered.</h1><p className="muted">Fresh picks and pantry favourites for every day.</p></div>
    <div className="shop-controls">
      <input aria-label="Search groceries" placeholder="Search groceries..." value={query} onChange={(event) => setQuery(event.target.value)}/>
      <select aria-label="Filter by category" value={category} onChange={(event) => changeCategory(event.target.value)}>{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select>
      <span className="pill">Items in basket: {itemCount}</span>
    </div>
    {category !== 'All' && <p className="muted">Showing {category.toLowerCase()} · <button className="text-button" onClick={() => changeCategory('All')}>Clear filter</button></p>}
    <div className="products">{filtered.map((product) => <ProductCard key={product.id} product={product}/>)}</div>
    {filtered.length === 0 && <p>No products match your search. Try another search or category.</p>}
  </main>;
}
