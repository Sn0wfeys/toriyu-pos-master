-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('admin', 'reseller');

-- Create enum for unit types
CREATE TYPE unit_type AS ENUM ('botol', 'dus');

-- Create enum for transaction types
CREATE TYPE transaction_type AS ENUM ('sale', 'purchase', 'adjustment');

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  size TEXT NOT NULL, -- 'kecil', 'sedang', 'besar'
  units_per_box INTEGER NOT NULL DEFAULT 12, -- conversion rate
  purchase_price_per_unit DECIMAL(10,2) NOT NULL,
  selling_price_per_unit DECIMAL(10,2) NOT NULL,
  selling_price_per_box DECIMAL(10,2) NOT NULL,
  current_stock_units INTEGER NOT NULL DEFAULT 0,
  minimum_stock_units INTEGER NOT NULL DEFAULT 24,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Products policies (admin only)
CREATE POLICY "Authenticated users can view products"
  ON products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can manage products"
  ON products FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create sales_transactions table
CREATE TABLE sales_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_type unit_type NOT NULL,
  price_per_unit DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for sales_transactions
ALTER TABLE sales_transactions ENABLE ROW LEVEL SECURITY;

-- Sales transactions policies
CREATE POLICY "Authenticated users can view sales"
  ON sales_transactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create sales"
  ON sales_transactions FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Admin can delete sales"
  ON sales_transactions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create purchase_orders table
CREATE TABLE purchase_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  supplier_name TEXT NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_type unit_type NOT NULL,
  purchase_price_per_unit DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for purchase_orders
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;

-- Purchase orders policies (admin only)
CREATE POLICY "Admin can view purchase orders"
  ON purchase_orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can create purchase orders"
  ON purchase_orders FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create audit_log table
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for audit_log
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Audit log policies (admin only)
CREATE POLICY "Admin can view audit logs"
  ON audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to handle user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'admin')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Function to update product stock after sale
CREATE OR REPLACE FUNCTION update_stock_after_sale()
RETURNS TRIGGER AS $$
DECLARE
  units_sold INTEGER;
BEGIN
  -- Convert to units
  IF NEW.unit_type = 'dus' THEN
    SELECT units_per_box * NEW.quantity INTO units_sold
    FROM products WHERE id = NEW.product_id;
  ELSE
    units_sold := NEW.quantity;
  END IF;
  
  -- Update stock
  UPDATE products
  SET current_stock_units = current_stock_units - units_sold
  WHERE id = NEW.product_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for stock update on sale
CREATE TRIGGER update_stock_on_sale
  AFTER INSERT ON sales_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_after_sale();

-- Function to update product stock after purchase
CREATE OR REPLACE FUNCTION update_stock_after_purchase()
RETURNS TRIGGER AS $$
DECLARE
  units_purchased INTEGER;
BEGIN
  -- Convert to units
  IF NEW.unit_type = 'dus' THEN
    SELECT units_per_box * NEW.quantity INTO units_purchased
    FROM products WHERE id = NEW.product_id;
  ELSE
    units_purchased := NEW.quantity;
  END IF;
  
  -- Update stock
  UPDATE products
  SET current_stock_units = current_stock_units + units_purchased
  WHERE id = NEW.product_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for stock update on purchase
CREATE TRIGGER update_stock_on_purchase
  AFTER INSERT ON purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_after_purchase();

-- Function to log audit trail for price changes
CREATE OR REPLACE FUNCTION log_product_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND (
    OLD.purchase_price_per_unit != NEW.purchase_price_per_unit OR
    OLD.selling_price_per_unit != NEW.selling_price_per_unit OR
    OLD.selling_price_per_box != NEW.selling_price_per_box
  )) THEN
    INSERT INTO audit_log (user_id, action, table_name, record_id, old_values, new_values)
    VALUES (
      auth.uid(),
      'UPDATE_PRICE',
      'products',
      NEW.id,
      jsonb_build_object(
        'purchase_price_per_unit', OLD.purchase_price_per_unit,
        'selling_price_per_unit', OLD.selling_price_per_unit,
        'selling_price_per_box', OLD.selling_price_per_box
      ),
      jsonb_build_object(
        'purchase_price_per_unit', NEW.purchase_price_per_unit,
        'selling_price_per_unit', NEW.selling_price_per_unit,
        'selling_price_per_box', NEW.selling_price_per_box
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for audit log
CREATE TRIGGER log_product_price_changes
  AFTER UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION log_product_changes();

-- Insert default admin products (Toriyu Water)
INSERT INTO products (name, size, units_per_box, purchase_price_per_unit, selling_price_per_unit, selling_price_per_box, current_stock_units, minimum_stock_units)
VALUES
  ('Toriyu Water', 'Kecil (330ml)', 12, 2000, 3000, 35000, 0, 24),
  ('Toriyu Water', 'Sedang (600ml)', 12, 3500, 5000, 58000, 0, 24),
  ('Toriyu Water', 'Besar (1500ml)', 6, 6000, 8500, 50000, 0, 12);