import { useState } from "react";
import type { ChainConfigSchema, PartialChainUpdateSchema } from "@/types/chain";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Info,
  Cpu,
  Coins,
  Hash,
  Key,
  Globe,
  Layers,
  ShieldCheck,
  ChevronsUp,
  Image,
  Plus,
  X,
} from "lucide-react";

interface ChainInfoFieldsProps {
  chain: ChainConfigSchema;
  draft: PartialChainUpdateSchema;
  onChange: (patch: PartialChainUpdateSchema) => void;
}

function FieldRow({
  icon: Icon,
  label,
  tooltip,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  tooltip: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-muted-foreground" />
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">
          {label}
        </Label>
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" className="text-muted-foreground/60 hover:text-muted-foreground">
              <Info className="size-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">{tooltip}</TooltipContent>
        </Tooltip>
      </div>
      {children}
    </div>
  );
}

export function ChainInfoFields({ chain, draft, onChange }: ChainInfoFieldsProps) {
  const [newRpc, setNewRpc] = useState("");

  const rpcUrls = draft.rpc_urls ?? chain.rpc_urls;
  const xpub = draft.xpub ?? chain.xpub;
  const blockLag = draft.block_lag ?? chain.block_lag;
  const requiredConfirmations = draft.required_confirmations ?? chain.required_confirmations;
  const lastProcessedBlock = draft.last_processed_block ?? chain.last_processed_block;
  const logoUrl = draft.logo_url !== undefined ? (draft.logo_url ?? "") : (chain.logo_url ?? "");

  function handleRpcRemove(index: number) {
    const next = [...rpcUrls];
    next.splice(index, 1);
    onChange({ ...draft, rpc_urls: next });
  }

  function handleRpcAdd() {
    const trimmed = newRpc.trim();
    if (!trimmed) return;
    onChange({ ...draft, rpc_urls: [...rpcUrls, trimmed] });
    setNewRpc("");
  }

  function handleRpcChange(index: number, value: string) {
    const next = [...rpcUrls];
    next[index] = value;
    onChange({ ...draft, rpc_urls: next });
  }

  return (
    <div className="space-y-5">
      {/* Read-only fields */}
      <FieldRow icon={Cpu} label="Chain Type" tooltip="The blockchain virtual machine type (e.g. EVM). Cannot be changed after creation.">
        <Badge variant="secondary">{chain.chain_type}</Badge>
      </FieldRow>

      <FieldRow icon={Coins} label="Native Symbol" tooltip="The native coin ticker of this chain (e.g. ETH, POL). Set at creation time.">
        <p className="text-sm font-medium">{chain.native_symbol}</p>
      </FieldRow>

      <FieldRow icon={Hash} label="Decimals" tooltip="Number of decimal places for the native coin. Set at creation time.">
        <p className="text-sm font-medium">{chain.decimals}</p>
      </FieldRow>

      {/* Editable fields */}
      <FieldRow icon={Key} label="xpub" tooltip="Extended public key used to derive unique deposit addresses for each invoice.">
        <Input
          value={xpub}
          onChange={(e) => onChange({ ...draft, xpub: e.target.value })}
          className="font-mono text-xs"
          placeholder="xpub..."
        />
      </FieldRow>

      <FieldRow icon={Globe} label="RPC URLs" tooltip="List of RPC node endpoints used to interact with this blockchain. At least one is required.">
        <div className="space-y-2">
          {rpcUrls.map((url, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <Input
                value={url}
                onChange={(e) => handleRpcChange(i, e.target.value)}
                className="font-mono text-xs"
                placeholder="https://rpc-node..."
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => handleRpcRemove(i)}
                className="shrink-0 text-destructive hover:text-destructive"
              >
                <X className="size-3" />
              </Button>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <Input
              value={newRpc}
              onChange={(e) => setNewRpc(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleRpcAdd();
                }
              }}
              className="font-mono text-xs"
              placeholder="Add new RPC URL..."
            />
            <Button
              type="button"
              variant="outline"
              size="icon-xs"
              onClick={handleRpcAdd}
              className="shrink-0"
            >
              <Plus className="size-3" />
            </Button>
          </div>
        </div>
      </FieldRow>

      <FieldRow icon={Layers} label="Block Lag" tooltip="Number of blocks behind the chain head to start scanning. Helps avoid reorgs.">
        <Input
          type="number"
          min={0}
          value={blockLag}
          onChange={(e) => onChange({ ...draft, block_lag: Number(e.target.value) })}
        />
      </FieldRow>

      <FieldRow icon={ShieldCheck} label="Required Confirmations" tooltip="Number of block confirmations needed before a payment is considered confirmed.">
        <Input
          type="number"
          min={0}
          value={requiredConfirmations}
          onChange={(e) => onChange({ ...draft, required_confirmations: Number(e.target.value) })}
        />
      </FieldRow>

      <FieldRow icon={ChevronsUp} label="Last Processed Block" tooltip="The last block number processed by the scanner. Set to 0 to start from the latest block in the blockchain.">
        <Input
          type="number"
          min={0}
          value={lastProcessedBlock}
          onChange={(e) => onChange({ ...draft, last_processed_block: Number(e.target.value) })}
        />
      </FieldRow>

      <FieldRow icon={Image} label="Logo URL" tooltip="URL to the chain's logo image. Displayed in the admin panel.">
        <Input
          value={logoUrl}
          onChange={(e) => onChange({ ...draft, logo_url: e.target.value || null })}
          placeholder="https://..."
        />
      </FieldRow>
    </div>
  );
}
