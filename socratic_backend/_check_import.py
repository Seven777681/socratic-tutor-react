"""One-off diagnostic script: verifies that supabase-py is importable and
that the SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env can actually
authenticate against the project. Safe to delete after use.
"""

import os
from dotenv import load_dotenv

load_dotenv()

print("1) Checking supabase package import...")
import supabase  # noqa: E402
print(f"   OK - supabase-py version: {getattr(supabase, '__version__', 'unknown')}")

print("2) Checking env vars...")
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
print(f"   SUPABASE_URL = {url}")
print(f"   SUPABASE_SERVICE_ROLE_KEY = {(key[:10] + '...') if key else None}")

if not url or not key:
    raise SystemExit("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env")

print("3) Creating client...")
from supabase import create_client

client = create_client(url, key)
print("   OK - client created")

print("4) Probing REST endpoint with a harmless query (no table required)...")
try:
    # Querying a table that almost certainly doesn't exist. A *correct*
    # url+key combo will fail with "relation ... does not exist" (PostgREST
    # error, meaning we authenticated fine). A *wrong* key/url will fail
    # with an auth/network error instead.
    client.table("__connection_probe__").select("*").limit(1).execute()
    print("   Unexpected: query succeeded (table exists?) - connection is definitely OK")
except Exception as exc:  # noqa: BLE001
    message = str(exc)
    print(f"   Server responded with: {message}")
    lowered = message.lower()
    if "does not exist" in lowered or "42p01" in lowered or "pgrst" in lowered:
        print("   => Connection is WORKING (server rejected the query, not the credentials).")
    elif "invalid api key" in lowered or "jwt" in lowered or "unauthorized" in lowered or "401" in lowered:
        print("   => Connection FAILED: credentials look invalid.")
    else:
        print("   => Could not classify the error automatically. Inspect message above.")

print("Done.")
