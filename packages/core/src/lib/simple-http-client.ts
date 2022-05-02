export interface SimpleCallResult {
  body: string;
  signature: string;
}

export interface SimpleHttpClient {
  post(url: string, body: string, signature: string): Promise<SimpleCallResult>;
}
