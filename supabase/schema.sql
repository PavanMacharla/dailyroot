
-- =========================================================
-- DAILYROOT: SINGLE-STORE GROCERY DATABASE
-- Initial schema, permissions, RLS and COD order function
-- =========================================================

-- 1. TABLES

CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  image_url text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  sku text UNIQUE,
  description text,
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  compare_at_price numeric(10,2)
    CHECK (compare_at_price IS NULL OR compare_at_price >= price),
  unit text NOT NULL DEFAULT 'piece',
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  role text NOT NULL DEFAULT 'customer'
    CHECK (role IN ('customer', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label text NOT NULL DEFAULT 'Home',
  recipient_name text NOT NULL,
  phone text NOT NULL,
  address_line_1 text NOT NULL,
  address_line_2 text,
  landmark text,
  city text NOT NULL,
  state text NOT NULL,
  postal_code text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.inventory (
  product_id uuid PRIMARY KEY REFERENCES public.products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  low_stock_threshold integer NOT NULL DEFAULT 5
    CHECK (low_stock_threshold >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE
    DEFAULT ('DR-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12))),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  address_id uuid REFERENCES public.addresses(id) ON DELETE SET NULL,

  -- Delivery address snapshot
  recipient_name text NOT NULL,
  phone text NOT NULL,
  address_line_1 text NOT NULL,
  address_line_2 text,
  landmark text,
  city text NOT NULL,
  state text NOT NULL,
  postal_code text NOT NULL,

  subtotal numeric(12,2) NOT NULL CHECK (subtotal >= 0),
  delivery_fee numeric(12,2) NOT NULL DEFAULT 0 CHECK (delivery_fee >= 0),
  total numeric(12,2) NOT NULL CHECK (total >= 0),

  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN (
      'pending', 'confirmed', 'packed',
      'out_for_delivery', 'delivered', 'cancelled'
    )),

  payment_method text NOT NULL DEFAULT 'cod'
    CHECK (payment_method IN ('cod', 'razorpay')),

  payment_status text NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),

  customer_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  sku text,
  unit text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric(10,2) NOT NULL CHECK (unit_price >= 0),
  line_total numeric(12,2) NOT NULL CHECK (line_total >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. INDEXES

CREATE INDEX IF NOT EXISTS products_category_idx
  ON public.products(category_id);

CREATE INDEX IF NOT EXISTS products_active_idx
  ON public.products(is_active);

CREATE INDEX IF NOT EXISTS addresses_user_idx
  ON public.addresses(user_id);

CREATE INDEX IF NOT EXISTS orders_user_idx
  ON public.orders(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS order_items_order_idx
  ON public.order_items(order_id);

-- 3. UPDATED_AT TRIGGER

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS products_updated_at ON public.products;
CREATE TRIGGER products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS orders_updated_at ON public.orders;
CREATE TRIGGER orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS inventory_updated_at ON public.inventory;
CREATE TRIGGER inventory_updated_at
BEFORE UPDATE ON public.inventory
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. AUTOMATIC CUSTOMER PROFILE CREATION

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    NULLIF(NEW.raw_user_meta_data ->> 'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. ADMIN CHECK FUNCTION

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- 6. ENABLE ROW LEVEL SECURITY

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 7. RESET CLIENT TABLE PRIVILEGES

REVOKE ALL ON TABLE
  public.categories, public.products, public.profiles,
  public.addresses, public.inventory, public.orders,
  public.order_items
FROM anon, authenticated;

-- Public catalogue reads
GRANT SELECT ON public.categories, public.products, public.inventory
TO anon, authenticated;

-- Customer profile access
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (full_name, phone) ON public.profiles TO authenticated;

-- Address management
GRANT SELECT, INSERT, UPDATE, DELETE
ON public.addresses TO authenticated;

-- Order reads and admin updates
GRANT SELECT, UPDATE ON public.orders TO authenticated;
GRANT SELECT ON public.order_items TO authenticated;

-- Admin catalogue management (RLS still restricts this)
GRANT INSERT, UPDATE, DELETE
ON public.categories, public.products, public.inventory
TO authenticated;

-- 8. RLS POLICIES

-- Categories
DROP POLICY IF EXISTS "Public read active categories" ON public.categories;
CREATE POLICY "Public read active categories"
ON public.categories FOR SELECT
TO anon, authenticated
USING (is_active OR (SELECT public.is_admin()));

DROP POLICY IF EXISTS "Admin manage categories" ON public.categories;
CREATE POLICY "Admin manage categories"
ON public.categories FOR ALL
TO authenticated
USING ((SELECT public.is_admin()))
WITH CHECK ((SELECT public.is_admin()));

-- Products
DROP POLICY IF EXISTS "Public read active products" ON public.products;
CREATE POLICY "Public read active products"
ON public.products FOR SELECT
TO anon, authenticated
USING (is_active OR (SELECT public.is_admin()));

DROP POLICY IF EXISTS "Admin manage products" ON public.products;
CREATE POLICY "Admin manage products"
ON public.products FOR ALL
TO authenticated
USING ((SELECT public.is_admin()))
WITH CHECK ((SELECT public.is_admin()));

-- Profiles
DROP POLICY IF EXISTS "Read own profile or admin" ON public.profiles;
CREATE POLICY "Read own profile or admin"
ON public.profiles FOR SELECT
TO authenticated
USING (
  id = (SELECT auth.uid())
  OR (SELECT public.is_admin())
);

DROP POLICY IF EXISTS "Update own profile or admin" ON public.profiles;
CREATE POLICY "Update own profile or admin"
ON public.profiles FOR UPDATE
TO authenticated
USING (
  id = (SELECT auth.uid())
  OR (SELECT public.is_admin())
)
WITH CHECK (
  id = (SELECT auth.uid())
  OR (SELECT public.is_admin())
);

-- Addresses
DROP POLICY IF EXISTS "Read own addresses" ON public.addresses;
CREATE POLICY "Read own addresses"
ON public.addresses FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Insert own addresses" ON public.addresses;
CREATE POLICY "Insert own addresses"
ON public.addresses FOR INSERT
TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Update own addresses" ON public.addresses;
CREATE POLICY "Update own addresses"
ON public.addresses FOR UPDATE
TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Delete own addresses" ON public.addresses;
CREATE POLICY "Delete own addresses"
ON public.addresses FOR DELETE
TO authenticated
USING (user_id = (SELECT auth.uid()));

-- Inventory
DROP POLICY IF EXISTS "Read active product inventory" ON public.inventory;
CREATE POLICY "Read active product inventory"
ON public.inventory FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = inventory.product_id
      AND p.is_active = true
  )
  OR (SELECT public.is_admin())
);

DROP POLICY IF EXISTS "Admin manage inventory" ON public.inventory;
CREATE POLICY "Admin manage inventory"
ON public.inventory FOR ALL
TO authenticated
USING ((SELECT public.is_admin()))
WITH CHECK ((SELECT public.is_admin()));

-- Orders
DROP POLICY IF EXISTS "Read own orders or admin" ON public.orders;
CREATE POLICY "Read own orders or admin"
ON public.orders FOR SELECT
TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR (SELECT public.is_admin())
);

DROP POLICY IF EXISTS "Admin update orders" ON public.orders;
CREATE POLICY "Admin update orders"
ON public.orders FOR UPDATE
TO authenticated
USING ((SELECT public.is_admin()))
WITH CHECK ((SELECT public.is_admin()));

-- Order items
DROP POLICY IF EXISTS "Read own order items or admin" ON public.order_items;
CREATE POLICY "Read own order items or admin"
ON public.order_items FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
      AND (
        o.user_id = (SELECT auth.uid())
        OR (SELECT public.is_admin())
      )
  )
);

-- 9. SECURE CASH-ON-DELIVERY ORDER FUNCTION

CREATE OR REPLACE FUNCTION public.place_cod_order(
  p_address_id uuid,
  p_items jsonb,
  p_customer_note text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_address public.addresses%ROWTYPE;
  v_product public.products%ROWTYPE;
  v_stock integer;
  v_item record;
  v_order_id uuid;
  v_subtotal numeric(12,2) := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Please sign in before ordering';
  END IF;

  IF p_items IS NULL
     OR jsonb_typeof(p_items) <> 'array'
     OR jsonb_array_length(p_items) = 0
     OR jsonb_array_length(p_items) > 50 THEN
    RAISE EXCEPTION 'Invalid order items';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_to_recordset(p_items)
      AS x(product_id uuid, quantity integer)
    WHERE x.product_id IS NULL
       OR x.quantity IS NULL
       OR x.quantity < 1
       OR x.quantity > 99
  ) THEN
    RAISE EXCEPTION 'Invalid product or quantity';
  END IF;

  IF p_customer_note IS NOT NULL
     AND char_length(p_customer_note) > 500 THEN
    RAISE EXCEPTION 'Order note is too long';
  END IF;

  SELECT * INTO v_address
  FROM public.addresses
  WHERE id = p_address_id
    AND user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Delivery address not found';
  END IF;

  -- Lock stock rows and validate current prices and stock.
  FOR v_item IN
    SELECT x.product_id, SUM(x.quantity)::integer AS quantity
    FROM jsonb_to_recordset(p_items)
      AS x(product_id uuid, quantity integer)
    GROUP BY x.product_id
    ORDER BY x.product_id
  LOOP
    SELECT p, i.quantity
    INTO v_product, v_stock
    FROM public.products p
    JOIN public.inventory i ON i.product_id = p.id
    WHERE p.id = v_item.product_id
      AND p.is_active = true
    FOR UPDATE OF i;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product unavailable';
    END IF;

    IF v_stock < v_item.quantity THEN
      RAISE EXCEPTION 'Insufficient stock for %', v_product.name;
    END IF;

    v_subtotal := v_subtotal +
      (v_product.price * v_item.quantity);
  END LOOP;

  -- Create the order using the trusted database prices.
  INSERT INTO public.orders (
    user_id, address_id,
    recipient_name, phone,
    address_line_1, address_line_2, landmark,
    city, state, postal_code,
    subtotal, delivery_fee, total,
    payment_method, payment_status, status,
    customer_note
  )
  VALUES (
    v_user_id, v_address.id,
    v_address.recipient_name, v_address.phone,
    v_address.address_line_1, v_address.address_line_2,
    v_address.landmark,
    v_address.city, v_address.state, v_address.postal_code,
    v_subtotal, 0, v_subtotal,
    'cod', 'pending', 'pending',
    p_customer_note
  )
  RETURNING id INTO v_order_id;

  -- Deduct stock and save purchase-time price snapshots.
  FOR v_item IN
    SELECT x.product_id, SUM(x.quantity)::integer AS quantity
    FROM jsonb_to_recordset(p_items)
      AS x(product_id uuid, quantity integer)
    GROUP BY x.product_id
    ORDER BY x.product_id
  LOOP
    SELECT * INTO v_product
    FROM public.products
    WHERE id = v_item.product_id;

    UPDATE public.inventory
    SET quantity = quantity - v_item.quantity
    WHERE product_id = v_item.product_id;

    INSERT INTO public.order_items (
      order_id, product_id, product_name, sku,
      unit, quantity, unit_price, line_total
    )
    VALUES (
      v_order_id, v_product.id, v_product.name, v_product.sku,
      v_product.unit, v_item.quantity, v_product.price,
      v_product.price * v_item.quantity
    );
  END LOOP;

  RETURN v_order_id;
END;
$$;

-- Restrict the order function to signed-in customers.
REVOKE ALL ON FUNCTION public.place_cod_order(uuid, jsonb, text)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.place_cod_order(uuid, jsonb, text)
TO authenticated;

-- Restrict helper execution.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

-- 10. DATABASE COMPLETE
-- DAILYROOT MIGRATION 01
-- Profiles table and admin security repair
-- Schema: public