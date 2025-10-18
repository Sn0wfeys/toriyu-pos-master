-- Fix: Add search_path to all other functions for security

-- Fix update_stock_after_sale
CREATE OR REPLACE FUNCTION public.update_stock_after_sale()
RETURNS TRIGGER AS $$
DECLARE
  units_sold INTEGER;
BEGIN
  IF NEW.unit_type = 'dus' THEN
    SELECT units_per_box * NEW.quantity INTO units_sold
    FROM products WHERE id = NEW.product_id;
  ELSE
    units_sold := NEW.quantity;
  END IF;
  
  UPDATE products
  SET current_stock_units = current_stock_units - units_sold
  WHERE id = NEW.product_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql 
SET search_path = public;

-- Fix update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql 
SET search_path = public;

-- Fix update_stock_after_purchase
CREATE OR REPLACE FUNCTION public.update_stock_after_purchase()
RETURNS TRIGGER AS $$
DECLARE
  units_purchased INTEGER;
BEGIN
  IF NEW.unit_type = 'dus' THEN
    SELECT units_per_box * NEW.quantity INTO units_purchased
    FROM products WHERE id = NEW.product_id;
  ELSE
    units_purchased := NEW.quantity;
  END IF;
  
  UPDATE products
  SET current_stock_units = current_stock_units + units_purchased
  WHERE id = NEW.product_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql 
SET search_path = public;

-- Fix log_product_changes
CREATE OR REPLACE FUNCTION public.log_product_changes()
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
$$ LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public;