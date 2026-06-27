### ChainConfigSchema
Type: object
Properties:
  - **active**: `boolean` (Nullable: false, Description: Indicates whether the network should be active immediately upon creation.)
  - **block_lag**: `integer` (Nullable: false, Description: Delay in blocks between the node and the tip.)
  - **chain_type**: `#/components/schemas/ChainTypeSchema` (Nullable: false, Description: none)
  - **decimals**: `integer` (Nullable: false, Description: Number of decimal places for the native currency.)
  - **last_processed_block**: `integer` (Nullable: false, Description: The starting block number for the indexer. Use 0 to start from the current tip.)
  - **logo_url**: `string,null` (Nullable: false, Description: Optional URL pointing to the network's logo icon.)
  - **name**: `string` (Nullable: false, Description: Unique canonical identifier for the new network.)
  - **native_symbol**: `string` (Nullable: false, Description: The native currency symbol.)
  - **required_confirmations**: `integer` (Nullable: false, Description: Number of blocks required to consider a transaction fully confirmed.)
  - **rpc_urls**: `string[]` (Nullable: false, Description: List of RPC endpoint URLs used to interact with the network.)
  - **safe_lag**: `integer` (Nullable: false, Description: Minimum block depth required to trust empty log responses from RPC (prevents false-empty logs))
  - **tokens**: `#/components/schemas/TokenConfigSchema[]` (Nullable: false, Description: Initial list of tokens (e.g., ERC20) to track on this network.)
  - **xpub**: `string` (Nullable: false, Description: Extended public key used to derive HD wallet addresses.)

### ChainDataSchema
Type: object
Properties:
  - **active**: `boolean` (Nullable: false, Description: Indicates whether the network is currently active and processing events.)
  - **block_lag**: `integer` (Nullable: false, Description: Current delay in blocks between the node and the tip.)
  - **chain_type**: `#/components/schemas/ChainTypeSchema` (Nullable: false, Description: none)
  - **decimals**: `integer` (Nullable: false, Description: Number of decimal places for the native currency)
  - **id**: `integer` (Nullable: false, Description: Internal system ID for the network.)
  - **last_processed_block**: `integer` (Nullable: false, Description: The block number that was last processed by the indexer.)
  - **logo_url**: `string,null` (Nullable: false, Description: URL pointing to the network's logo icon.)
  - **name**: `string` (Nullable: false, Description: Unique canonical identifier of the network.)
  - **native_symbol**: `string` (Nullable: false, Description: The native currency symbol of the network.)
  - **required_confirmations**: `integer` (Nullable: false, Description: Number of blocks required to consider a transaction fully confirmed.)
  - **rpc_urls**: `string[]` (Nullable: false, Description: List of RPC endpoint URLs used to interact with the network.)
  - **safe_lag**: `integer` (Nullable: false, Description: Minimum block depth required to trust empty log responses from RPC (prevents false-empty logs))
  - **watch_addresses**: `string[]` (Nullable: false, Description: List of explicitly watched addresses on this network.)
  - **xpub**: `string` (Nullable: false, Description: Extended public key used to derive HD wallet addresses for this network.)

### CreateInvoiceReqSchema
Type: object
Properties:
  - **amount**: `number` (Nullable: false, Description: The exact amount of the asset expected to be paid.)
  - **asset**: `string` (Nullable: false, Description: The asset to be paid (native coin symbol or token ticker).)
  - **duration**: `integer` (Nullable: false, Description: Duration in seconds before the invoice expires (default is 900 seconds / 15 minutes).)
  - **network**: `string` (Nullable: false, Description: The target blockchain network.)
  - **webhook_config**: `unknown` (Nullable: false, Description: none)

### InvoiceSchema
Type: object
Properties:
  - **address**: `string` (Nullable: false, Description: The unique cryptocurrency address generated for this invoice.)
  - **address_index**: `integer` (Nullable: false, Description: Internal index used for HD wallet address derivation.)
  - **amount**: `string` (Nullable: false, Description: Human-readable target amount.)
  - **amount_raw**: `string` (Nullable: false, Description: Raw target amount in minimal indivisible units (e.g., Wei). Passed as a string to prevent precision loss.)
  - **created_at**: `string` (Nullable: false, Description: none)
  - **decimals**: `integer` (Nullable: false, Description: none)
  - **expires_at**: `string` (Nullable: false, Description: none)
  - **id**: `string` (Nullable: false, Description: none)
  - **network**: `string` (Nullable: false, Description: none)
  - **paid**: `string` (Nullable: false, Description: Human-readable amount that has been paid so far.)
  - **paid_raw**: `string` (Nullable: false, Description: Raw paid amount in minimal units. Passed as a string.)
  - **status**: `#/components/schemas/InvoiceStatusSchema` (Nullable: false, Description: none)
  - **token**: `string` (Nullable: false, Description: none)
  - **webhook_max_retries**: `integer,null` (Nullable: false, Description: none)
  - **webhook_secret**: `string,null` (Nullable: false, Description: none)
  - **webhook_url**: `string,null` (Nullable: false, Description: none)

### PaymentSchema
Type: object
Properties:
  - **amount_raw**: `string` (Nullable: false, Description: Raw transferred amount in minimal indivisible units (e.g., Wei). Passed as a string to prevent precision loss.)
  - **block_hash**: `string` (Nullable: false, Description: The hash of the block containing the transaction.)
  - **block_number**: `integer` (Nullable: false, Description: The block number in which the transaction was included.)
  - **created_at**: `string` (Nullable: false, Description: none)
  - **from**: `string` (Nullable: false, Description: The sender's wallet address.)
  - **id**: `string` (Nullable: false, Description: none)
  - **log_index**: `integer,null` (Nullable: false, Description: The log index of the event within the block (for EVM-compatible chains).)
  - **network**: `string` (Nullable: false, Description: The canonical name of the blockchain network.)
  - **status**: `#/components/schemas/PaymentStatusSchema` (Nullable: false, Description: none)
  - **to**: `string` (Nullable: false, Description: The receiver's wallet address (usually the invoice address).)
  - **token**: `string` (Nullable: false, Description: The ticker symbol of the transferred token.)
  - **tx_hash**: `string` (Nullable: false, Description: The transaction hash on the blockchain.)

### WebhookSchema
Type: object
Properties:
  - **attempts**: `integer` (Nullable: false, Description: The current number of delivery attempts made.)
  - **created_at**: `string` (Nullable: false, Description: none)
  - **id**: `string` (Nullable: false, Description: none)
  - **invoice_id**: `string` (Nullable: false, Description: The ID of the invoice that triggered this webhook.)
  - **max_retries**: `integer` (Nullable: false, Description: The maximum number of retries allowed before permanently failing.)
  - **next_retry**: `string` (Nullable: false, Description: Timestamp indicating when the next delivery attempt will occur (if pending/processing).)
  - **payload**: `#/components/schemas/WebhookEventSchema` (Nullable: false, Description: The event data payload.)
  - **status**: `#/components/schemas/WebhookStatusSchema` (Nullable: false, Description: none)
  - **url**: `string` (Nullable: false, Description: The destination URL where the webhook payload is sent.)

### ApiKeyRecordSchema
Type: object
Properties:
  - **created_at**: `string` (Nullable: false, Description: Timestamp indicating when the key was created.)
  - **id**: `string` (Nullable: false, Description: The unique identifier (UUID) of the API key record.)
  - **is_active**: `boolean` (Nullable: false, Description: Indicates whether the key is currently active and can be used for authentication.)
  - **name**: `string` (Nullable: false, Description: Human-readable identifier for this key.)
  - **permissions**: `#/components/schemas/PermissionSchema[]` (Nullable: false, Description: List of permissions granted to this key.)
  - **prefix**: `string` (Nullable: false, Description: The environment prefix for the key.)

### CreateKeyReqSchema
Type: object
Properties:
  - **name**: `string` (Nullable: false, Description: Human-readable identifier for this key.)
  - **permissions**: `#/components/schemas/PermissionSchema[]` (Nullable: false, Description: List of permissions granted to this key. Publishable keys (`pk_live`) can only have `public_read`.)
  - **prefix**: `#/components/schemas/ApiKeyPrefixSchema` (Nullable: false, Description: The environment prefix for the key (secret or publishable).)

### CreateKeyResSchema
Type: object
Properties:
  - **key_id**: `string` (Nullable: false, Description: The UUID of the generated key record.)
  - **raw_key**: `string` (Nullable: false, Description: The raw secret API key. **Store this securely, it will not be shown again.**)

### ErrorResponseSchema
Type: object
Properties:
  - **error**: `#/components/schemas/ErrorObjectSchema` (Nullable: false, Description: The error object containing details about the failure.)

### ErrorObjectSchema
Type: object
Properties:
  - **code**: `string,null` (Nullable: false, Description: A short code indicating the specific error.)
  - **err_type**: `string` (Nullable: false, Description: The type of error returned.)
  - **message**: `string` (Nullable: false, Description: A human-readable message providing more details about the error.)
  - **param**: `string,null` (Nullable: false, Description: The parameter that caused the error, if applicable.)

