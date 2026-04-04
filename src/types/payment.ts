export type PaymentStatus = "Confirming" | "Confirmed" | "Cancelled";

export interface PaymentSchema {
  id: string;
  invoice_id: string;
  from: string;
  to: string;
  network: string;
  token: string;
  tx_hash: string;
  amount_raw: string;
  block_number: number;
  log_index: number;
  status: PaymentStatus;
  created_at: string;
}
