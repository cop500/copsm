-- Configuration des notifications email JPO (conseillers COP uniquement)

CREATE TABLE IF NOT EXISTS email_notifications_jpo_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enabled BOOLEAN DEFAULT true,
    subject TEXT DEFAULT 'Nouvelle demande de visite JPO — {etablissement}',
    message TEXT DEFAULT 'Bonjour,

Une nouvelle demande de visite pour les journées portes ouvertes a été enregistrée.

Établissement : {etablissement}
Contact : {nom_prenom} ({fonction})
Email : {email}
Téléphone : {telephone}
Date : {date_visite}
Créneau : {creneau}
Participants : {nombre_participants}
Accompagnateurs : {nombre_accompagnateurs}

Lien pour confirmer : {lien}

Cordialement,
Notification automatique - Système COP',
    recipient_emails JSONB DEFAULT '["omar.oumouzoune@ofppt.ma","abdelhamid.inajjaren@ofppt.ma","sara.hanzaze@ofppt.ma"]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO email_notifications_jpo_config (id, enabled, subject, message, recipient_emails)
VALUES (
    '00000000-0000-0000-0000-000000000003',
    true,
    'Nouvelle demande de visite JPO — {etablissement}',
    'Bonjour,

Une nouvelle demande de visite pour les journées portes ouvertes a été enregistrée.

Établissement : {etablissement}
Contact : {nom_prenom} ({fonction})
Email : {email}
Téléphone : {telephone}
Date : {date_visite}
Créneau : {creneau}
Participants : {nombre_participants}
Accompagnateurs : {nombre_accompagnateurs}

Lien pour confirmer : {lien}

Cordialement,
Notification automatique - Système COP',
    '["omar.oumouzoune@ofppt.ma","abdelhamid.inajjaren@ofppt.ma","sara.hanzaze@ofppt.ma"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE email_notifications_jpo_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage jpo email config" ON email_notifications_jpo_config;

CREATE POLICY "Admins can manage jpo email config" ON email_notifications_jpo_config
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'business_developer'
        )
    );
