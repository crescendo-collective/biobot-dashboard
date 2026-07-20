-- BioBot Dashboard — Seed data for initial RSV rollout
-- Safe to re-run: uses ON CONFLICT DO NOTHING.

BEGIN;

INSERT INTO targets (target_code, display_name)
VALUES ('RSV', 'Respiratory Syncytial Virus')
ON CONFLICT (target_code) DO NOTHING;

-- Map Postman collection endpoints to dataset_config rows.
-- api_path_suffix is appended after /beta/data/{target_code}/
INSERT INTO dataset_config (target_id, geography_level, dataset_variant, api_path_suffix)
SELECT t.target_id, v.geography_level, v.dataset_variant, v.api_path_suffix
FROM targets t
CROSS JOIN (
    VALUES
        ('national'::geography_level, 'standard'::dataset_variant, 'national'),
        ('regional'::geography_level, 'standard'::dataset_variant, 'regional'),
        ('state'::geography_level,    'standard'::dataset_variant, 'state'),
        ('county'::geography_level,   'ai'::dataset_variant,       'county/ai'),
        ('county'::geography_level,   'hotspots'::dataset_variant, 'county/hotspots'),
        ('zip'::geography_level,      'standard'::dataset_variant, 'zip')
) AS v (geography_level, dataset_variant, api_path_suffix)
WHERE t.target_code = 'RSV'
ON CONFLICT (target_id, geography_level, dataset_variant) DO NOTHING;

COMMIT;
