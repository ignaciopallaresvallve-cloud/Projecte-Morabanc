import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { PaymentSettings } from "@/types/order";

interface PaymentSettingsRow {
  account_holder: string;
  iban: string;
  payment_concept: string;
  swift_bic: string;
  pickup_dates: string[];
  pickup_dates_second_tanda: string[];
  is_discount_active: boolean;
}

function mapRow(row: PaymentSettingsRow): PaymentSettings {
  return {
    accountHolder: row.account_holder,
    iban: row.iban,
    paymentConcept: row.payment_concept,
    swiftBic: row.swift_bic,
    pickupDateOptions: row.pickup_dates ?? [],
    pickupDateOptionsSecondTanda: row.pickup_dates_second_tanda ?? [],
    isDiscountActive: row.is_discount_active,
  };
}

export async function getPaymentSettings(): Promise<PaymentSettings> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("payment_settings")
    .select(
      "account_holder, iban, payment_concept, swift_bic, pickup_dates, pickup_dates_second_tanda, is_discount_active"
    )
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    throw new Error(`No s'han pogut carregar els ajustos de pagament: ${error.message}`);
  }

  return data
    ? mapRow(data as PaymentSettingsRow)
    : {
        accountHolder: "",
        iban: "",
        paymentConcept: "",
        swiftBic: "",
        pickupDateOptions: [],
        pickupDateOptionsSecondTanda: [],
        isDiscountActive: false,
      };
}
