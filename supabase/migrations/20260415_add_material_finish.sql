-- Adicionar campo de acabamento/material para joias
ALTER TABLE products ADD COLUMN IF NOT EXISTS material_finish TEXT DEFAULT 'OURO 18K';
