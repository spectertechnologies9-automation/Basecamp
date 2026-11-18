declare module 'sql.js' {
  export interface Database {
    run(sql: string, params?: any[]): void;
    exec(sql: string, params?: any[]): Array<{ columns: string[]; values: any[][] }>;
    prepare(sql: string, params?: any[]): any;
    export(): Uint8Array;
    close(): void;
  }

  export interface SqlJsStatic {
    Database: new (data?: ArrayLike<number> | Buffer | null) => Database;
  }

  export interface InitSqlJsOptions {
    locateFile?: (url: string) => string;
    wasmBinary?: ArrayBuffer;
  }

  export default function initSqlJs(options?: InitSqlJsOptions): Promise<SqlJsStatic>;
}
