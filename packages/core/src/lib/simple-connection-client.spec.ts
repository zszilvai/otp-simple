import { SimpleConnectionClient } from './simple-connection-client';
import { PRODUCTION_URL, TEST_MERCHANT_CONFIG, TEST_URL } from './constants';
import { SimpleHttpClientFetchAdapter } from './simple-http-client-adapters/simple-http-client-fetch-adapter';
import * as fetch from 'node-fetch';
import { SimpleCallResult } from './simple-http-client';
import { SimplePaymentError } from './simple-payment-error';
import { getSignature } from './integrity';

describe('SimpleConnectionClient', () => {
  it('Should default input parameters to Fetch client, crypto-random-string and production url', async () => {
    const client = new SimpleConnectionClient({
      merchant: TEST_MERCHANT_CONFIG.hufMerchantId,
      secret: TEST_MERCHANT_CONFIG.hufSecretKey,
    });
    expect(client.options).toMatchObject({
      merchant: expect.any(String),
      secret: expect.any(String),
      baseUrl: PRODUCTION_URL,
      httpClient: expect.any(SimpleHttpClientFetchAdapter),
    });
    const salt = await client.options.saltProvider();
    expect(salt).toMatch(/^[a-zA-Z0-9]{32}$/);
  });

  it('Should use custom http client', async () => {
    const client = new SimpleConnectionClient({
      merchant: TEST_MERCHANT_CONFIG.hufMerchantId,
      secret: TEST_MERCHANT_CONFIG.hufSecretKey,
      httpClient: new SimpleHttpClientFetchAdapter(fetch as any),
    });
    expect(client.options).toMatchObject({
      merchant: expect.any(String),
      secret: expect.any(String),
      baseUrl: PRODUCTION_URL,
      httpClient: expect.any(SimpleHttpClientFetchAdapter),
    });
    const salt = await client.options.saltProvider();
    expect(salt).toMatch(/^[a-zA-Z0-9]{32}$/);
  });

  it('Should convert any field containing `Date` to ISO8601 format with time zone during serialization', async () => {
    let json = null;
    const client = new SimpleConnectionClient({
      merchant: TEST_MERCHANT_CONFIG.hufMerchantId,
      secret: TEST_MERCHANT_CONFIG.hufSecretKey,
      baseUrl: TEST_URL,
      httpClient: {
        post(
          url: string,
          body: string,
          signature: string
        ): Promise<SimpleCallResult> {
          json = body;
          return Promise.resolve({ body, signature });
        },
      },
    });
    const payload = {
      testDate: new Date(),
      other: 'other',
    };
    await client.request('test', payload);
    expect(json).toMatch(
      /testDate":"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}/
    );
  });

  it('Should add salt and merchant to payload', async () => {
    const client = new SimpleConnectionClient({
      merchant: TEST_MERCHANT_CONFIG.hufMerchantId,
      secret: TEST_MERCHANT_CONFIG.hufSecretKey,
      baseUrl: TEST_URL,
      httpClient: {
        post(
          url: string,
          body: string,
          signature: string
        ): Promise<SimpleCallResult> {
          return Promise.resolve({ body, signature });
        },
      },
    });
    const payload = {
      testDate: new Date(),
      other: 'other',
    };
    const result = await client.request('test', payload);
    expect(result.merchant).toBe(TEST_MERCHANT_CONFIG.hufMerchantId);
    expect(result.salt).toMatch(/^[a-zA-Z0-9]{32}$/);
  });

  it('Should throw error when invalid signature is received', async () => {
    const client = new SimpleConnectionClient({
      merchant: TEST_MERCHANT_CONFIG.hufMerchantId,
      secret: TEST_MERCHANT_CONFIG.hufSecretKey,
      baseUrl: TEST_URL,
      httpClient: {
        post(url: string, body: string): Promise<SimpleCallResult> {
          return Promise.resolve({ body, signature: 'invalid' });
        },
      },
    });
    const payload = {
      testDate: new Date(),
      other: 'other',
    };
    await expect(client.request('test', payload)).rejects.toThrowError(
      /Invalid signature/
    );
  });

  it('Should throw error when error response is received', async () => {
    const client = new SimpleConnectionClient({
      merchant: TEST_MERCHANT_CONFIG.hufMerchantId,
      secret: TEST_MERCHANT_CONFIG.hufSecretKey,
      baseUrl: TEST_URL,
      httpClient: {
        post(): Promise<SimpleCallResult> {
          const payload = {
            errorCodes: [5000],
          };
          const body = JSON.stringify(payload);
          const signature = getSignature(
            body,
            TEST_MERCHANT_CONFIG.hufSecretKey
          );
          return Promise.resolve({ body, signature });
        },
      },
    });
    const payload = {};
    await expect(client.request('test', payload)).rejects.toThrow(
      SimplePaymentError
    );
  });

  it('Should validate the signature for a request', async () => {
    const client = new SimpleConnectionClient({
      merchant: TEST_MERCHANT_CONFIG.hufMerchantId,
      secret: TEST_MERCHANT_CONFIG.hufSecretKey,
    });
    const payload = {
      field: 'value',
    };
    const message = JSON.stringify(payload);
    const signature = getSignature(message, TEST_MERCHANT_CONFIG.hufSecretKey);
    const result = await client.validateMessage(message, signature);
    expect(result).toBeTruthy();
  });
});
