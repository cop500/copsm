-- Script de correction pour les politiques RLS des notifications

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Permettre lecture notifications" ON notifications_demandes;
DROP POLICY IF EXISTS "Permettre insertion notifications" ON notifications_demandes;
DROP POLICY IF EXISTS "Permettre suppression notifications" ON notifications_demandes;

-- Créer une nouvelle politique qui permet toutes les opérations
CREATE POLICY "Permettre toutes les opérations notifications" ON notifications_demandes
    FOR ALL USING (auth.role() = 'authenticated');

-- Recréer les fonctions avec SECURITY DEFINER
CREATE OR REPLACE FUNCTION create_notification_on_new_demande()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notifications_demandes (demande_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
$$ LANGUAGE plpgsql SECURITY DEFINER; 