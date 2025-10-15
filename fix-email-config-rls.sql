-- Script pour corriger les politiques RLS et insérer la configuration email

-- 1. Désactiver temporairement RLS
ALTER TABLE email_notifications_config DISABLE ROW LEVEL SECURITY;

-- 2. Supprimer toutes les politiques existantes
DROP POLICY IF EXISTS "Admins can manage email config" ON email_notifications_config;

-- 3. Insérer la configuration par défaut
INSERT INTO email_notifications_config (id, enabled, subject, message, recipient_emails)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    true,
    'Nouvelle demande entreprise à traiter',
    'Bonjour,

Une nouvelle demande d''entreprise a été enregistrée dans le système COP.

Entreprise : {nom_entreprise}
Contact : {nom_contact}
Email : {email}
Téléphone : {telephone}
Type de demande : {type_demande}

Lien : {lien}

Cordialement,
Notification automatique - Système COP',
    '["omar.oumouzoune@ofppt.ma"]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
    enabled = EXCLUDED.enabled,
    subject = EXCLUDED.subject,
    message = EXCLUDED.message,
    recipient_emails = EXCLUDED.recipient_emails,
    updated_at = NOW();

-- 4. Réactiver RLS
ALTER TABLE email_notifications_config ENABLE ROW LEVEL SECURITY;

-- 5. Créer une politique plus permissive pour l'insertion
CREATE POLICY "Allow public insert email config" ON email_notifications_config
    FOR INSERT
    WITH CHECK (true);

-- 6. Créer une politique pour la lecture (admins seulement)
CREATE POLICY "Allow admin select email config" ON email_notifications_config
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'business_developer'
        )
    );

-- 7. Créer une politique pour la mise à jour (admins seulement)
CREATE POLICY "Allow admin update email config" ON email_notifications_config
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'business_developer'
        )
    );

-- 8. Vérifier que la configuration a été insérée
SELECT * FROM email_notifications_config;
