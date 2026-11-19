'use client';
import { useCart } from '@/components/cart-provider';
import type { Product } from '@/lib/products';

export default function ProductCard({ product }: { product: Product }) {
  const { addItem, items } = useCart();
  const quantity = items.find((line) => line.productId === product.id)?.quantity ?? 0;
  return <article>
    <img className="product-img" src={product.image} alt={product.name}/>
    <div className="product-name">{product.name}</div>
    <div className="product-meta">{product.unit} · {product.category}</div>
    <div className="price-row"><strong>₹{product.price}</strong><button className="add" aria-label={`Add ${product.name} to basket`} onClick={() => addItem(product.id)}>+</button></div>
    {quantity > 0 && <small className="muted">In basket: {quantity}</small>}
  </article>;
}
