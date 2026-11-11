export type CloudflareCommandResult = {
  status: number | null;
  stdout?: string | Uint8Array | null;
  stderr?: string | Uint8Array | null;
};
export type CloudflareCommandOptions = {
  directory?: string;
  previous?: string;
  checkCurrent?: () => Promise<void>;
  execute?: (args: string[]) => CloudflareCommandResult;
  sleep?: (milliseconds: number) => Promise<void>;
};
export function runCloudflareCommand(action: 'deploy' | 'rollback', options?: CloudflareCommandOptions): Promise<void>;
