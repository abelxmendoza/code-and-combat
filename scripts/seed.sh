#!/usr/bin/env bash
# Applies supabase/seed.sql. Local dev: prefer `supabase db reset`, which
# re-runs every migration and the seed together. This script is the
# straightforward path for a remote/hosted project using DATABASE_URL.
set -euo pipefail

if [ -n "${DATABASE_URL:-}" ]; then
  echo "Seeding via DATABASE_URL..."
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/seed.sql
elif command -v supabase >/dev/null 2>&1; then
  echo "No DATABASE_URL set — resetting the local Supabase stack (migrations + seed)..."
  supabase db reset
else
  echo "Set DATABASE_URL to your Supabase Postgres connection string, or install the Supabase CLI for local dev." >&2
  exit 1
fi
