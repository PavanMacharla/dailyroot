import type { CatalogStatus } from '@/components/cart-provider';

export default function CatalogNotice({ status }: { status: CatalogStatus }) {
  if (status === 'loading' || status === 'live') return null;

  const message = status === 'empty'
    ? 'Supabase is connected, but its products table is empty. Showing the starter catalogue.'
    : status === 'unconfigured'
      ? 'Supabase is not configured here. Showing the starter catalogue.'
      : 'The Supabase catalogue could not be loaded. Showing the starter catalogue.';

  return <p className="catalog-notice" role="status">{message}</p>;
}
