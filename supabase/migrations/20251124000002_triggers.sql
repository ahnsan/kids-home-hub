-- =============================================
-- Kids Home Hub - Database Triggers
-- Business logic triggers for automatic updates
-- Migration: 20251124000002
-- =============================================

-- =============================================
-- TRANSACTION TRIGGERS
-- =============================================

-- Trigger: Update child totals when transaction created
CREATE OR REPLACE FUNCTION handle_transaction_update_child()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'money' THEN
    IF NEW.action IN ('add', 'earn') THEN
      UPDATE children SET money_total = money_total + NEW.amount WHERE id = NEW.child_id;
    ELSE
      UPDATE children SET money_total = money_total - NEW.amount WHERE id = NEW.child_id;
    END IF;
  ELSIF NEW.type = 'points' THEN
    IF NEW.action IN ('add', 'earn') THEN
      UPDATE children SET points_total = points_total + NEW.amount WHERE id = NEW.child_id;
    ELSE
      UPDATE children SET points_total = points_total - NEW.amount WHERE id = NEW.child_id;
    END IF;
  ELSE
    IF NEW.action IN ('add', 'earn') THEN
      UPDATE children SET screen_total = screen_total + NEW.amount WHERE id = NEW.child_id;
    ELSE
      UPDATE children SET screen_total = screen_total - NEW.amount WHERE id = NEW.child_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_transaction_created
  AFTER INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION handle_transaction_update_child();

-- =============================================
-- CHORE COMPLETION TRIGGERS
-- =============================================

-- Trigger: Update child points when chore completed
CREATE OR REPLACE FUNCTION handle_chore_completion_update_child()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE children
  SET points_total = points_total + NEW.points_earned,
      updated_at = NOW()
  WHERE id = NEW.child_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_chore_completion_created
  AFTER INSERT ON chore_completions
  FOR EACH ROW
  EXECUTE FUNCTION handle_chore_completion_update_child();

-- =============================================
-- HOUSEHOLD TRIGGERS
-- =============================================

-- Trigger: Create household member and default chores when household created
CREATE OR REPLACE FUNCTION handle_household_created()
RETURNS TRIGGER AS $$
BEGIN
  -- Add creator as owner
  INSERT INTO household_members (household_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'owner');

  -- Create default chores
  PERFORM create_default_chores(NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_household_created
  AFTER INSERT ON households
  FOR EACH ROW
  EXECUTE FUNCTION handle_household_created();

-- =============================================
-- VALIDATION TRIGGERS
-- =============================================

-- Trigger: Validate transaction amount is positive
CREATE OR REPLACE FUNCTION validate_transaction_amount()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.amount <= 0 THEN
    RAISE EXCEPTION 'Transaction amount must be positive';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_transaction_amount_trigger
  BEFORE INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION validate_transaction_amount();

-- Trigger: Validate chore points are positive
CREATE OR REPLACE FUNCTION validate_chore_points()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.points <= 0 THEN
    RAISE EXCEPTION 'Chore points must be positive';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_chore_points_trigger
  BEFORE INSERT OR UPDATE ON chores
  FOR EACH ROW
  EXECUTE FUNCTION validate_chore_points();

-- =============================================
-- AUDIT TRIGGERS (Optional - for tracking changes)
-- =============================================

-- Uncomment if you want audit logging:

/*
-- Create audit log table
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  operation TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
  old_data JSONB,
  new_data JSONB,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log (table_name, record_id, operation, old_data, changed_by)
    VALUES (TG_TABLE_NAME, OLD.id, TG_OP, to_jsonb(OLD), auth.uid());
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log (table_name, record_id, operation, old_data, new_data, changed_by)
    VALUES (TG_TABLE_NAME, NEW.id, TG_OP, to_jsonb(OLD), to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (table_name, record_id, operation, new_data, changed_by)
    VALUES (TG_TABLE_NAME, NEW.id, TG_OP, to_jsonb(NEW), auth.uid());
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to sensitive tables
CREATE TRIGGER audit_children
  AFTER INSERT OR UPDATE OR DELETE ON children
  FOR EACH ROW
  EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_transactions
  AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION audit_trigger();
*/
