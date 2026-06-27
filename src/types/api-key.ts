export type PermissionSchema = "full_access" | "write_invoices" | "read_invoices" | "public_read";

export type ApiKeyPrefixSchema = "sk_live" | "pk_live";

export interface ApiKeyRecordSchema {
  id: string;
  name: string;
  prefix: ApiKeyPrefixSchema;
  permissions: PermissionSchema[];
  is_active: boolean;
  created_at: string;
}

export interface CreateKeyReqSchema {
  name: string;
  prefix: ApiKeyPrefixSchema;
  permissions: PermissionSchema[];
}

export interface CreateKeyResSchema {
  key_id: string;
  raw_key: string;
}
