export type InvoiceStatus = "Pending" | "Paid" | "Expired" | "Cancelled";

export interface InvoiceSchema {
  id: string;
  address_index: number;
  address: string;
  amount: string;
  amount_raw: string;
  paid: string;
  paid_raw: string;
  token: string;
  network: string;
  decimals: number;
  created_at: string;
  expires_at: string;
  status: InvoiceStatus;
  webhook_url: string | null;
  webhook_secret: string | null;
  webhook_max_retries: number | null;
}

export interface WebhookConfigSchema {
  url: string;
  secret?: string | null;
  max_retries?: number | null;
}

export interface CreateInvoiceReq {
  amount: number;
  asset: string;
  network: string;
  duration?: number | null;
  webhook_config?: WebhookConfigSchema | null;
}


export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page_size: number;
  page: number;
}
