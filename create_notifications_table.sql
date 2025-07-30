-- Créer la table des notifications pour les demandes entreprises
CREATE TABLE IF NOT EXISTS notifications_demandes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    demande_id UUID NOT NULL REFERENCES demandes_entreprises(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_notifications_demande_id ON notifications_demandes(demande_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications_demandes(created_at);

-- Activer RLS
ALTER TABLE notifications_demandes ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
CREATE POLICY "Permettre lecture notifications" ON notifications_demandes
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Permettre insertion notifications" ON notifications_demandes
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Permettre suppression notifications" ON notifications_demandes
    FOR DELETE USING (auth.role() = 'authenticated');

-- Fonction pour créer automatiquement une notification quand une nouvelle demande est créée
CREATE OR REPLACE FUNCTION create_notification_on_new_demande()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notifications_demandes (demande_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour créer automatiquement une notification
CREATE TRIGGER trigger_create_notification
    AFTER INSERT ON demandes_entreprises
    FOR EACH ROW
    EXECUTE FUNCTION create_notification_on_new_demande();

-- Fonction pour supprimer automatiquement les notifications quand le statut change
CREATE OR REPLACE FUNCTION delete_notification_on_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Supprimer les notifications si le statut n'est plus 'en_attente' ou NULL
    IF OLD.statut IS NULL OR OLD.statut = 'en_attente' THEN
        IF NEW.statut IS NOT NULL AND NEW.statut != 'en_attente' THEN
            DELETE FROM notifications_demandes WHERE demande_id = NEW.id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour supprimer automatiquement les notifications
CREATE TRIGGER trigger_delete_notification
    AFTER UPDATE ON demandes_entreprises
    FOR EACH ROW
    EXECUTE FUNCTION delete_notification_on_status_change(); 