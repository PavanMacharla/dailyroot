import assert from 'node:assert/strict';
import test from 'node:test';
import { mapSupabaseProducts } from '../lib/supabase-products.mjs';

test('maps a live Supabase product and embedded category to the storefront shape', () => {
  const rows = [{
    id: 'product-1',
    name: 'Oranges',
    price: '45.50',
    unit: '1 kg',
    image_url: 'https://example.test/oranges.jpg',
    is_active: true,
    categories: { name: 'Fruits', slug: 'fruits' },
  }];

  assert.deepEqual(mapSupabaseProducts(rows), [{
    id: 'product-1',
    name: 'Oranges',
    category: 'Fruits',
    price: 45.5,
    unit: '1 kg',
    image: 'https://example.test/oranges.jpg',
  }]);
});

test('handles array relations and drops inactive or unusable rows', () => {
  const rows = [
    { id: 'product-2', name: 'Pears', price: 20, unit: null, image_url: null, is_active: true, categories: [{ name: 'Fruits' }] },
    { id: 'product-3', name: 'Hidden', price: 10, is_active: false },
    { id: 'product-4', name: 'Bad price', price: 'NaN', is_active: true },
  ];

  assert.deepEqual(mapSupabaseProducts(rows), [{
    id: 'product-2',
    name: 'Pears',
    category: 'Fruits',
    price: 20,
    unit: 'piece',
    image: '',
  }]);
});