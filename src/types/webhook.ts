export type WebhookStatus =
  | "Pending"
  | "Processing"
  | "Sent"
  | "Failed"
  | "Cancelled";

export type WebhookEventType =
  | "tx_detected"
  | "tx_confirmed"
  | "invoice_paid"
  | "invoice_expired";

export interface TxDetectedEvent {
  event_type: "tx_detected";
  data: {
    invoice_id: string;
    tx_hash: string;
    amount: string;
    currency: string;
  };
}

export interface TxConfirmedEvent {
  event_type: "tx_confirmed";
  data: {
    invoice_id: string;
    tx_hash: string;
    confirmations: number;
  };
}

export interface InvoicePaidEvent {
  event_type: "invoice_paid";
  data: {
    invoice_id: string;
    paid_amount: string;
  };
}

export interface InvoiceExpiredEvent {
  event_type: "invoice_expired";
  data: {
    invoice_id: string;
  };
}

export type WebhookEventSchema =
  | TxDetectedEvent
  | TxConfirmedEvent
  | InvoicePaidEvent
  | InvoiceExpiredEvent;

export interface WebhookSchema {
  id: string;
  invoice_id: string;
  url: string;
  payload: WebhookEventSchema;
  status: WebhookStatus;
  attempts: number;
  max_retries: number;
  next_retry: string;
  created_at: string;
}
