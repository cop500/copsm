-- Créer la table de configuration des notifications email pour les demandes d'assistance

CREATE TABLE IF NOT EXISTS email_notifications_assistance_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Configuration des notifications
    enabled BOOLEAN DEFAULT true,
    subject TEXT DEFAULT 'Nouvelle demande d''assistance vous a été assignée',
    message TEXT DEFAULT 'Bonjour {conseiller_nom},

Une nouvelle demande d''assistance vous a été assignée dans le système COP.

Détails de la demande :
- Stagiaire : {nom_stagiaire}
- Téléphone : {telephone_stagiaire}
- Type d''assistance : {type_assistance}
- Statut : {statut}

Lien pour accéder à la demande : {lien}

Cordialement,
Notification automatique - Système COP',
    
    -- Emails des destinataires configurés manuellement (JSON: { "conseiller_id": "email@example.com" })
    recipient_emails JSONB DEFAULT '{}'::jsonb,
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insérer la configuration par défaut
INSERT INTO email_notifications_assistance_config (id, enabled, subject, message, recipient_emails)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    true,
    'Nouvelle demande d''assistance vous a été assignée',
    'Bonjour {conseiller_nom},

Une nouvelle demande d''assistance vous a été assignée dans le système COP.

Détails de la demande :
- Stagiaire : {nom_stagiaire}
- Téléphone : {telephone_stagiaire}
- Type d''assistance : {type_assistance}
- Statut : {statut}

Lien pour accéder à la demande : {lien}

Cordialement,
Notification automatique - Système COP',
    '{}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- Activer RLS
ALTER TABLE email_notifications_assistance_config ENABLE ROW LEVEL SECURITY;

-- Politique pour les admins
CREATE POLICY "Admins can manage assistance email config" ON email_notifications_assistance_config
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'business_developer'
        )
    );

-- Ajouter la colonne recipient_emails si elle n'existe pas déjà (pour les migrations existantes)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'email_notifications_assistance_config' 
        AND column_name = 'recipient_emails'
    ) THEN
        ALTER TABLE email_notifications_assistance_config 
        ADD COLUMN recipient_emails JSONB DEFAULT '{}'::jsonb;
        
        -- Mettre à jour les enregistrements existants
        UPDATE email_notifications_assistance_config 
        SET recipient_emails = '{}'::jsonb 
        WHERE recipient_emails IS NULL;
    END IF;
END $$;

