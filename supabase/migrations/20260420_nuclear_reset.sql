-- RDY Supply: Nuclear Reset
-- Destrói TODOS os triggers e funções ad-hoc criados manualmente no dashboard.
-- Recria as políticas de RLS do zero, sem recursão.
-- Tabelas e dados NÃO são afetados.

-- ============================================================
-- 1. BACKUP — rode antes e salve o resultado
-- ============================================================
-- SELECT * FROM profiles;
-- SELECT * FROM contracts;
-- SELECT * FROM contract_technicians;
-- SELECT * FROM equipment_models;
-- SELECT * FROM contract_equipment;
-- SELECT * FROM equipment_min_stock;
-- SELECT * FROM equipment_stock_entries;
-- SELECT * FROM paper_stock_entries;
-- SELECT * FROM stock_alerts;
-- SELECT * FROM user_configs;
-- SELECT * FROM contract_supplies;

-- ============================================================
-- 2. DESTRUIR todos os triggers no schema public
-- ============================================================
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT trigger_name, event_object_table
    FROM information_schema.triggers
    WHERE event_object_schema = 'public'
    GROUP BY trigger_name, event_object_table
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS %I ON public.%I CASCADE',
      r.trigger_name, r.event_object_table
    );
    RAISE NOTICE 'Dropped trigger: % on %', r.trigger_name, r.event_object_table;
  END LOOP;
END $$;

-- ============================================================
-- 3. DESTRUIR todas as funções no schema public
-- ============================================================
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure::text AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prokind = 'f'
  LOOP
    BEGIN
      EXECUTE format('DROP FUNCTION IF EXISTS %s CASCADE', r.sig);
      RAISE NOTICE 'Dropped function: %', r.sig;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END LOOP;
END $$;

-- ============================================================
-- 4. DESTRUIR todas as políticas de RLS
-- ============================================================
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON public.%I',
      r.policyname, r.tablename
    );
    RAISE NOTICE 'Dropped policy: % on %', r.policyname, r.tablename;
  END LOOP;
END $$;

-- ============================================================
-- 5. RECRIAR políticas limpas — sem recursão, sem self-join
-- ============================================================
CREATE POLICY "rdy_all" ON profiles             FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "rdy_all" ON contracts            FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "rdy_all" ON contract_technicians FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "rdy_all" ON equipment_models     FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "rdy_all" ON contract_equipment   FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "rdy_all" ON equipment_min_stock  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "rdy_all" ON equipment_stock_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "rdy_all" ON paper_stock_entries  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "rdy_all" ON stock_alerts         FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "rdy_all" ON user_configs         FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "rdy_all" ON contract_supplies    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- 6. VERIFICAR — deve retornar 11 linhas, uma por tabela
-- ============================================================
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
