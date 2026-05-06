/// <reference types="@cloudflare/workers-types" />

declare interface D1Database {
  prepare(sql: string): D1PreparedStatement;
  batch(statements: D1PreparedStatement[]): Promise<D1Result[]>;
  exec(sql: string): Promise<D1ExecResult>;
}

declare interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  first(): Promise<Record<string, any> | null>;
  all(): Promise<D1Result>;
  run(): Promise<D1Result>;
}

declare interface D1Result {
  success: boolean;
  error?: string;
  results?: Record<string, any>[];
  meta?: {
    duration: number;
    internal_stats?: string;
    served_by?: string;
    served_time?: number;
  };
}

declare interface D1ExecResult {
  success: boolean;
  count: number;
  duration: number;
  error?: string;
  results?: D1Result[];
}
