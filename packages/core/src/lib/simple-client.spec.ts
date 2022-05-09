import { TEST_MERCHANT_CONFIG, TEST_URL } from './constants';
import { SimpleClient } from './simple-client';
import { SimpleConnectionClient } from './simple-connection-client';
import { Currency, Language, PaymentMethod, StartOptions } from './interfaces';
import { add as addDate } from 'date-fns';
import fetch from 'node-fetch';
import { SimplePaymentError } from './simple-payment-error';

function getTestClient(): SimpleClient {
  return new SimpleClient({
    baseUrl: TEST_URL,
    merchant: TEST_MERCHANT_CONFIG.hufMerchantId,
    secret: TEST_MERCHANT_CONFIG.hufSecretKey,
  });
}

function getValidStartOptions(): StartOptions {
  return {
    currency: Currency.HUF,
    customerEmail: 'test@mailinator.com',
    url: 'https://www.example.com',
    language: Language.HU,
    total: 1000,
    methods: [PaymentMethod.CARD],
    orderRef: 'test-order-ref',
    sdkVersion: 'test-sdk-version', // TODO: add version to package.json
    timeout: addDate(new Date(), { minutes: 15 }),
  };
}

function getExpiredTimeoutStartOptions(): StartOptions {
  return {
    currency: Currency.HUF,
    customerEmail: 'test@mailinator.com',
    url: 'https://www.example.com',
    language: Language.HU,
    total: 1000,
    methods: [PaymentMethod.CARD],
    orderRef: 'test-order-ref',
    sdkVersion: 'test-sdk-version', // TODO: add version to package.json
    timeout: addDate(new Date(), { minutes: -15 }),
  };
}

describe('Simple Client', () => {
  it('should be initialized using merchant parameters', () => {
    const options = {
      merchant: TEST_MERCHANT_CONFIG.hufMerchantId,
      secret: TEST_MERCHANT_CONFIG.hufSecretKey,
    };
    const client = new SimpleClient(options);
    expect(client['connectionClient']).toBeInstanceOf(SimpleConnectionClient);
  });

  it('should be initialized using custom simple client', () => {
    const client = new SimpleConnectionClient({
      merchant: TEST_MERCHANT_CONFIG.hufMerchantId,
      secret: TEST_MERCHANT_CONFIG.hufSecretKey,
    });
    const simpleClient = new SimpleClient({ connectionClient: client });
    expect(simpleClient['connectionClient']).toBe(client);
  });

  it('should start one-time payment successfully for good params', async () => {
    const client = getTestClient();
    const response = await client.start(getValidStartOptions());
    console.log(response);
    expect((response as any).transactionId).toBeDefined(); // TODO improve error handling
    expect((response as any).paymentUrl).toBeDefined(); // TODO improve error handling
    // For unsuccessful payments, the paymentUrl redirects to the error page specified in the merchant configuration
    // Therefore, if there is no redirect, the payment started successfully
    const paymentResult = await fetch((response as any).paymentUrl);
    expect(paymentResult.redirected).toBeFalsy();
  });

  it('should start one-time payment with sane but invalid params', async () => {
    const client = getTestClient();
    const response = await client.start(getExpiredTimeoutStartOptions());
    console.log(response);
    expect((response as any).transactionId).toBeDefined();
    expect((response as any).paymentUrl).toBeDefined();
    // For unsuccessful payments, the paymentUrl redirects to the error page specified in the merchant configuration
    // Therefore, if there is no redirect, the payment started successfully
    const paymentResult = await fetch((response as any).paymentUrl);
    expect(paymentResult.redirected).toBeTruthy();
  });

  it('should throw `SimplePaymentError` when the request is invalid', async () => {
    const client = getTestClient();
    expect(client.start({} as any)).rejects.toThrowError(SimplePaymentError);
  });
});
