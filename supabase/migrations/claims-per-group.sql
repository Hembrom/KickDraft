alter table player_claims
  drop constraint if exists player_claims_pkey,
  drop constraint if exists player_claims_player_id_key;

alter table player_claims
  add constraint player_claims_group_user_unique unique (google_user_id, group_slug),
  add constraint player_claims_group_player_unique unique (player_id, group_slug);