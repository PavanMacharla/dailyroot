# DailyRoot — grocery e-commerce starter

A premium minimalist Next.js starter for an Indian grocery store.

## Included
- Responsive storefront homepage and catalogue
- Category filtering and product search
- Starter basket interaction on catalogue page
- Admin dashboard visual shell
- Supabase client setup and initial PostgreSQL schema
- INR pricing and sample grocery catalogue

## Requirements
- Node.js 20.9+
- A free Supabase project
- A GitHub account
- A Vercel account

## Run locally
1. Install Node.js 20.9 or later.
2. In this folder run `npm install`.
3. Copy `.env.example` to `.env.local` and fill in the Supabase project URL and anon key.
4. Run `npm run dev` and open http://localhost:3000.

The storefront can be previewed without Supabase credentials; database features are not connected yet.

## Supabase setup
1. Create a project at https://supabase.com.
2. Open SQL Editor and run `supabase/schema.sql`.
3. Copy Project URL and anon/public key from Project Settings → API into `.env.local`.

## Deploy
1. Push this folder to a new GitHub repository.
2. Import the repository at https://vercel.com/new.
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel project environment variables.
4. Deploy.

## Important launch checklist
This is a starter scaffold, not yet a production-ready store. Before accepting real orders, implement and test: persistent cart, customer sign-in, verified PIN-code delivery zones, secure checkout/order-creation server action or RPC, stock reservation, admin role provisioning and server-side authorization, Razorpay server-side order creation/signature verification (if enabled), order notifications, privacy/returns/delivery policies, backups, rate limiting, and audit logging. Never put Supabase service-role keys or payment secrets in client-side code. The admin page in this starter is not yet access-controlled.

## Cart and category navigation update
This version uses a shared React cart provider with localStorage persistence. Category links pass a `category` query parameter and the shop page applies the selected category. The cart page supports quantity changes and removal. Checkout is intentionally a placeholder until order creation, address validation, and payment processing are implemented.
