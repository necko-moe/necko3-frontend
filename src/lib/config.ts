interface AppConfig {
  PAYMENT_URL: string;
}

export function getConfig(): AppConfig {
  const runtime = (window as unknown as Record<string, unknown>)
    .__APP_CONFIG__ as Partial<AppConfig> | undefined;
  return {
    PAYMENT_URL:
      runtime?.PAYMENT_URL ||
      (import.meta.env.VITE_PAYMENT_URL as string) ||
      "",
  };
}
