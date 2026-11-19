import type { Product } from './products';

type SupabaseCategory = { name?: string | null; slug?: string | null };
type SupabaseProductRow = {
  id: string;
  name: string;
  price: number | string;
  unit?: string | null;
  image_url?: string | null;
  is_active: boolean;
  categories?: SupabaseCategory | SupabaseCategory[] | null;
};

export function mapSupabaseProducts(rows: unknown): Product[];
