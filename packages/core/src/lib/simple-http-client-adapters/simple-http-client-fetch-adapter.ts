import { RequestInfo, RequestInit, Response } from 'node-fetch';
import { SimpleCallResult, SimpleHttpClient } from '../simple-http-client';

export class SimpleHttpClientFetchAdapter implements SimpleHttpClient {
  constructor(
    private fetch: (
      url: RequestInfo,
      init?: RequestInit | undefined
    ) => Promise<Response>
  ) {}

  async post(
    url: string,
    body: string,
    signature: string
  ): Promise<SimpleCallResult> {
    const response = await this.fetch(url, {
      method: 'POST',
      body: body,
      headers: {
        'Content-Type': 'application/json',
        Signature: signature,
      },
    }); // TODO integrity check
    const bodyText = await response.text();
    const responseSignature = response.headers.get('Signature');
    if (!responseSignature) {
      throw new Error('No signature found in response');
    }
    return {
      body: bodyText,
      signature: responseSignature,
    };
  }
}
