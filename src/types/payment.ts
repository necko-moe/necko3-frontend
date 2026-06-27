export type PaymentStatus = "Pending" | "Confirming" | "Confirmed" | "Lost" | "Failed";

export interface PaymentSchema {
  id: string;
  from: string;
  to: string;
  network: string;
  token: string;
  tx_hash: string;
  amount_raw: string;
  block_number: number;
  block_hash: string;
  log_index: number | null;
  status: PaymentStatus;
  created_at: string;
}
