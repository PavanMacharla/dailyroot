import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/components/cart-provider';
import SiteHeader from '@/components/site-header';

export const metadata: Metadata = {
  title: 'DailyRoot — Fresh groceries, thoughtfully delivered',
  description: 'Shop fresh fruits, vegetables and everyday essentials with DailyRoot.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>
    <CartProvider>
      <div className="announcement">FRESH PICKS, EVERY DAY · FREE DELIVERY ON YOUR FIRST ORDER</div>
      <SiteHeader />
      {children}
      <footer className="footer"><div className="wrap"><div className="brand" style={{ color: 'white' }}>DailyRoot.</div><p>Freshness, delivered with care.</p><p>© 2026 DailyRoot. Demo storefront — connect your store database before accepting orders.</p></div></footer>
    </CartProvider>
  </body></html>;
}
