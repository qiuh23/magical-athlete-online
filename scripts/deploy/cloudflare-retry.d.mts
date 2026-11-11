export type RetryResponse = {
  status: number;
  headers?: { get(name: string): string | null };
  body?: { cancel(): Promise<unknown> | unknown } | null;
};
export type RetryOptions = {
  attempts?: number;
  sleep?: (milliseconds: number) => Promise<void>;
  beforeAttempt?: (attempt: number) => Promise<void>;
  onRetry?: (attempt: number) => void;
};
export function transientFailure(text: string): boolean;
export function retryCloudflare<T extends RetryResponse | null | undefined>(operation: () => Promise<T>, options?: RetryOptions): Promise<T>;
