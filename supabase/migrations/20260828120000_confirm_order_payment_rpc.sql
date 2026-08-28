-- MoraBanc Office Store — confirmació de comanda en un sol pas, sense
-- justificant de transferència.
--
-- Substitueix el flux anterior (pujada obligatòria de justificant): ara,
-- en clicar "Entesos" a la pantalla de dades bancàries, la comanda passa
-- directament de 'pendiente_pago' a 'pagado' ("Confirmat" a la UI). No es
-- concedeix `update` directe sobre `orders` a `anon`: passa per aquesta
-- funció RPC (`SECURITY DEFINER`), que només toca `status` de la fila amb
-- aquesta referència, res més.
--
-- Ejecutar en el SQL Editor de Supabase, o vía `supabase db push` si usas la CLI.

create or replace function public.confirm_order_payment(p_reference text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.orders
  set status = 'pagado'
  where reference = p_reference;

  if not found then
    raise exception 'ORDER_NOT_FOUND: %', p_reference;
  end if;
end;
$$;

grant execute on function public.confirm_order_payment(text) to anon, authenticated;

NOTIFY pgrst, 'reload schema';
