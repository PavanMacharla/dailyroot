import { Suspense } from 'react';
import { createClient } from '@/lib/supabase';
import { fetchProducts } from '@/lib/products';
import ShopClient from './ShopClient';

export default async function ShopPage() {
  const supabase = createClient();
  const catalog = await fetchProducts(supabase).catch(() => []);

  return (
    <Suspense fallback={<main className="wrap"><p>Loading the market...</p></main>}>
      <ShopClient initialProducts={catalog} />
    </Suspense>
  );
}
