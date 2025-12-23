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
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insérer la configuration par défaut
INSERT INTO email_notifications_assistance_config (id, enabled, subject, message)
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
Notification automatique - Système COP'
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

