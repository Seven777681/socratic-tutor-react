# Supabase database CA certificate

Download the project CA certificate from **Supabase Dashboard > Project Settings > Database**
and save it in this directory as `supabase-ca.crt`.

The CA certificate is public certificate material and contains no database password or private key.
Production uses it with `sslmode=verify-full` to verify the database server certificate.
