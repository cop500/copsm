-- Ajouter la colonne promotion à la table enquete_reponses (enquête d'insertion)
ALTER TABLE enquete_reponses
ADD COLUMN IF NOT EXISTS promotion text;

COMMENT ON COLUMN enquete_reponses.promotion IS 'Promotion du stagiaire ex: 2022-2024 (janvier 2025), 2023-2025 (janvier 2026), 2024-2026 (janvier 2027)';
