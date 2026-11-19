/**
 * Convert the live PostgREST product shape into the storefront's Product shape.
 * Keep this function pure so the database boundary can be tested without network access.
 * @param {unknown} input
 * @returns {Array<{id: string, name: string, category: string, price: number, unit: string, image: string}>}
 */
export function mapSupabaseProducts(input) {
  if (!Array.isArray(input)) return [];

  return input.flatMap((row) => {
    if (!row || typeof row !== 'object' || row.is_active !== true || !row.id || !row.name) return [];

    const price = Number(row.price);
    if (!Number.isFinite(price) || price < 0) return [];

    const relation = Array.isArray(row.categories) ? row.categories[0] : row.categories;
    const categoryName = relation && typeof relation.name === 'string' ? relation.name.trim() : '';

    return [{
      id: String(row.id),
      name: String(row.name).trim(),
      category: categoryName || 'Uncategorized',
      price,
      unit: typeof row.unit === 'string' && row.unit.trim() ? row.unit.trim() : 'piece',
      image: typeof row.image_url === 'string' ? row.image_url : '',
    }];
  });
}
