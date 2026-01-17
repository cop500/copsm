-- ========================================
-- Migration : Créer la table certificat_templates
-- ========================================
-- Cette migration crée la table pour gérer les templates de certificats personnalisables par l'admin

-- Créer la table certificat_templates
-- Note: La garantie qu'un seul template soit actif est gérée par un trigger (voir plus bas)
CREATE TABLE IF NOT EXISTS public.certificat_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom TEXT NOT NULL,
    template_html TEXT NOT NULL,
    styles_css TEXT,
    active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer un index sur active pour améliorer les recherches
CREATE INDEX IF NOT EXISTS idx_certificat_templates_active 
ON public.certificat_templates(active) 
WHERE active = TRUE;

-- Créer un index sur created_at pour le tri chronologique
CREATE INDEX IF NOT EXISTS idx_certificat_templates_created_at 
ON public.certificat_templates(created_at DESC);

-- Ajouter les commentaires pour documenter la table
COMMENT ON TABLE public.certificat_templates IS 
'Table des templates de certificats de participation. Permet aux administrateurs de personnaliser le design des certificats.';

COMMENT ON COLUMN public.certificat_templates.id IS 
'Identifiant unique du template';

COMMENT ON COLUMN public.certificat_templates.nom IS 
'Nom du template (ex: "Template Classique", "Template Moderne")';

COMMENT ON COLUMN public.certificat_templates.template_html IS 
'Template HTML avec variables dynamiques : {{nom}}, {{atelier}}, {{date}}, {{animateur}}, etc.';

COMMENT ON COLUMN public.certificat_templates.styles_css IS 
'Styles CSS personnalisés pour le template';

COMMENT ON COLUMN public.certificat_templates.active IS 
'Indique si ce template est actuellement actif. Un seul template peut être actif à la fois.';

COMMENT ON COLUMN public.certificat_templates.created_at IS 
'Date de création du template';

COMMENT ON COLUMN public.certificat_templates.updated_at IS 
'Date de dernière modification du template';

-- Créer une fonction pour s'assurer qu'un seul template est actif
CREATE OR REPLACE FUNCTION ensure_single_active_template()
RETURNS TRIGGER AS $$
BEGIN
    -- Si on active ce template, désactiver tous les autres
    IF NEW.active = TRUE THEN
        UPDATE certificat_templates 
        SET active = FALSE 
        WHERE id != NEW.id AND active = TRUE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer un trigger pour garantir qu'un seul template est actif
DROP TRIGGER IF EXISTS trigger_ensure_single_active_template ON public.certificat_templates;

CREATE TRIGGER trigger_ensure_single_active_template
BEFORE INSERT OR UPDATE ON public.certificat_templates
FOR EACH ROW
WHEN (NEW.active = TRUE)
EXECUTE FUNCTION ensure_single_active_template();

-- Créer un trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_certificat_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_certificat_templates_updated_at ON public.certificat_templates;

CREATE TRIGGER trigger_update_certificat_templates_updated_at
BEFORE UPDATE ON public.certificat_templates
FOR EACH ROW
EXECUTE FUNCTION update_certificat_templates_updated_at();

-- Insérer un template par défaut
INSERT INTO public.certificat_templates (nom, template_html, styles_css, active)
VALUES (
    'Template Classique',
    '<div class="certificat">
        <div class="header">
            <h1>CERTIFICAT DE PARTICIPATION</h1>
        </div>
        <div class="content">
            <p>Le Centre d''Orientation Professionnelle certifie que</p>
            <p class="nom">{{nom}}</p>
            <p>a participé avec succès à l''atelier</p>
            <p class="atelier">{{atelier}}</p>
            <p>animé par {{animateur}}</p>
            <p>le {{date}}</p>
        </div>
        <div class="footer">
            <p>Date d''émission : {{date_certificat}}</p>
        </div>
    </div>',
    '.certificat { 
        font-family: Arial, sans-serif; 
        text-align: center; 
        padding: 40px; 
    }
    .header h1 { 
        color: #1E40AF; 
        font-size: 32px; 
        margin-bottom: 30px; 
    }
    .content { 
        margin: 40px 0; 
        line-height: 1.8; 
    }
    .nom { 
        font-size: 28px; 
        font-weight: bold; 
        color: #FF6D1F; 
        margin: 20px 0; 
    }
    .atelier { 
        font-size: 22px; 
        font-weight: bold; 
        color: #1E40AF; 
        margin: 20px 0; 
    }
    .footer { 
        margin-top: 50px; 
        font-size: 14px; 
        color: #666; 
    }',
    TRUE  -- Template actif par défaut
)
ON CONFLICT DO NOTHING;

-- Vérification
SELECT 
    'Template par défaut créé' as info,
    COUNT(*) as nombre_templates,
    COUNT(*) FILTER (WHERE active = TRUE) as templates_actifs
FROM public.certificat_templates;

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE 'Migration terminée : La table certificat_templates a été créée avec un template par défaut.';
END $$;

