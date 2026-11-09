-- Profil ambassadeur : colonnes Massar / internat / identité (Excel CMC)
ALTER TABLE stagiaires ADD COLUMN IF NOT EXISTS date_naissance date;
ALTER TABLE stagiaires ADD COLUMN IF NOT EXISTS lieu_naissance text;
ALTER TABLE stagiaires ADD COLUMN IF NOT EXISTS sexe text;
ALTER TABLE stagiaires ADD COLUMN IF NOT EXISTS situation_familiale text;
ALTER TABLE stagiaires ADD COLUMN IF NOT EXISTS nationalite text;
ALTER TABLE stagiaires ADD COLUMN IF NOT EXISTS adresse text;
ALTER TABLE stagiaires ADD COLUMN IF NOT EXISTS province text;
ALTER TABLE stagiaires ADD COLUMN IF NOT EXISTS niveau_scolaire text;
ALTER TABLE stagiaires ADD COLUMN IF NOT EXISTS annee_scolaire text;
ALTER TABLE stagiaires ADD COLUMN IF NOT EXISTS type_formation text;
ALTER TABLE stagiaires ADD COLUMN IF NOT EXISTS groupe text;
ALTER TABLE stagiaires ADD COLUMN IF NOT EXISTS internat boolean DEFAULT false;

COMMENT ON COLUMN stagiaires.internat IS 'Résident à l''internat de la CMC';
