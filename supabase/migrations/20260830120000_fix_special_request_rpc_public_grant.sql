-- MoraBanc Office Store — CORRECCIÓ URGENT DE SEGURETAT.
--
-- Diagnòstic (detectat en verificar el flux en producció): PostgreSQL
-- concedeix `execute` a `PUBLIC` sobre les funcions noves per defecte, tret
-- que es revoqui explícitament. La migració anterior
-- (20260829120000_special_requests_status_and_approval.sql) només va fer
-- `grant execute ... to authenticated`, sense revocar abans el `PUBLIC`
-- implícit — així que `anon` (qualsevol visitant, sense sessió d'admin)
-- podia cridar `approve_special_request` i `reject_special_request`
-- directament via l'API REST, saltant-se completament el panell
-- d'administració. Verificat amb la clau anon: la crida arribava fins a
-- l'excepció `SPECIAL_REQUEST_NOT_FOUND` en comptes d'un error de permisos,
-- confirmant que s'executava la funció.
--
-- Aquesta migració revoca explícitament l'accés de `public`/`anon` i deixa
-- només `authenticated` amb permís d'execució.
--
-- Ejecutar en el SQL Editor de Supabase COM MÉS AVIAT MILLOR.

revoke all on function public.approve_special_request(uuid) from public;
revoke all on function public.approve_special_request(uuid) from anon;
grant execute on function public.approve_special_request(uuid) to authenticated;

revoke all on function public.reject_special_request(uuid) from public;
revoke all on function public.reject_special_request(uuid) from anon;
grant execute on function public.reject_special_request(uuid) to authenticated;

NOTIFY pgrst, 'reload schema';
