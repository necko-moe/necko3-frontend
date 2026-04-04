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

export interface CreateInvoiceReq {
  amount: string;
  token: string;
  network: string;
  expire_after?: number | null;
  webhook_url?: string | null;
  webhook_secret?: string | null;
  webhook_max_retries?: number | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page_size: number;
  page: number;
}
