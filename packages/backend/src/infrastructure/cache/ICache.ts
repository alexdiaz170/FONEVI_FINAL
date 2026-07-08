export interface ICache {
  get<T>(key: string): Promise<T | null> | T | null;
  set<T>(key: string, data: T, ttlMs: number): Promise<void> | void;
  clear(): Promise<void> | void;
}
