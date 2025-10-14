-- Créer la table de configuration des notifications email

CREATE TABLE IF NOT EXISTS email_notifications_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Configuration des notifications
    enabled BOOLEAN DEFAULT true,
    subject TEXT DEFAULT 'Nouvelle demande entreprise à traiter',
    message TEXT DEFAULT 'Bonjour,

Une nouvelle demande d'entreprise a été enregistrée dans le système COP.

Entreprise : {nom_entreprise}
Contact : {nom_contact}
Email : {email}
Téléphone : {telephone}
Type de demande : {type_demande}

Lien : {lien}

Cordialement,
Notification automatique - Système COP',
    
    -- Emails destinataires (JSON array)
    recipient_emails JSONB DEFAULT '["omar.oumouzoune@ofppt.ma"]'::jsonb,
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insérer la configuration par défaut
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
ON CONFLICT (id) DO NOTHING;

-- Activer RLS
ALTER TABLE email_notifications_config ENABLE ROW LEVEL SECURITY;

-- Politique pour les admins
CREATE POLICY "Admins can manage email config" ON email_notifications_config
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'business_developer'
        )
    );

