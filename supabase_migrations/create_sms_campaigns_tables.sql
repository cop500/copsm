-- Historique des campagnes SMS (Studio SMS / Texto)

CREATE TABLE IF NOT EXISTS sms_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  libelle TEXT NOT NULL,
  entreprise TEXT,
  reference_offre TEXT,
  pole TEXT,
  filiere TEXT,
  lieu TEXT,
  message TEXT NOT NULL,
  total_count INT NOT NULL DEFAULT 0,
  sent_count INT NOT NULL DEFAULT 0,
  failed_count INT NOT NULL DEFAULT 0,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sms_campaign_envois (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES sms_campaigns(id) ON DELETE CASCADE,
  numero TEXT NOT NULL,
  success BOOLEAN NOT NULL DEFAULT FALSE,
  provider_status INT,
  provider_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_campaigns_created_at ON sms_campaigns(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_campaigns_entreprise ON sms_campaigns(entreprise);
CREATE INDEX IF NOT EXISTS idx_sms_campaigns_reference ON sms_campaigns(reference_offre);
CREATE INDEX IF NOT EXISTS idx_sms_campaign_envois_campaign_id ON sms_campaign_envois(campaign_id);

ALTER TABLE sms_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_campaign_envois ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage sms_campaigns" ON sms_campaigns
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'business_developer'
    )
  );

CREATE POLICY "Admins manage sms_campaign_envois" ON sms_campaign_envois
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'business_developer'
    )
  );
