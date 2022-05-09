import { getSignature, validateSignature } from './integrity';
import { URL } from 'url';
import { SimpleHttpClient } from './simple-http-client';
import { format, parseISO } from 'date-fns';
import * as cryptoRandomString from 'crypto-random-string';
import { PRODUCTION_URL } from './constants';
import { SimpleHttpClientFetchAdapter } from './simple-http-client-adapters/simple-http-client-fetch-adapter';
import * as fetch from 'node-fetch';
import { SimplePaymentError } from './simple-payment-error';

export interface SimpleConnectionClientOptions {
  /**
   * The http client used for the requests.
   * Defaults to `SimpleHttpClientFetchAdapter`
   * @default SimpleHttpClientFetchAdapter
   */
  httpClient?: SimpleHttpClient;
  /**
   * The url of the server.
   * Defaults to `PRODUCTION_URL`
   */
  baseUrl?: string;
  /**
   * The merchant id.
   */
  merchant: string;
  /**
   * The secret key.
   */
  secret: string;
  /**
   * Salt provider function. Must return a 32 character string.
   * Defaults to `cryptoRandomString` with `{length: 32, type: 'alphanumeric'}`
   */
  saltProvider?: () => Promise<string>;
}

export class SimpleConnectionClient {
  options: Required<SimpleConnectionClientOptions>;

  constructor(options: SimpleConnectionClientOptions) {
    if (!options.httpClient) {
      options.httpClient = new SimpleHttpClientFetchAdapter(fetch as any);
    }
    if (!options.baseUrl) {
      options.baseUrl = PRODUCTION_URL;
    }
    if (!options.merchant) {
      throw new Error('Missing merchant');
    }
    if (!options.secret) {
      throw new Error('Missing secret');
    }
    if (!options.saltProvider) {
      options.saltProvider = () =>
        Promise.resolve(
          cryptoRandomString({ length: 32, type: 'alphanumeric' })
        );
    }
    this.options = options as Required<SimpleConnectionClientOptions>;
  }

  /**
   * Calls the given endpoint with the given parameters using baseUrl specified in the constructor.
   * It adds the merchant, calculates the signature and adds it to the request.
   * After response, it validates the response signature.
   *
   * It also converts the date values to ISO 8601 format recognized by the server. It has
   * to be done because the server does not understand the date format used by the client if
   * the date is in GMT format (the date is followed by a Z)
   *
   *
   * @param endpoint the endpoint to call without the baseUrl
   * @param body the body of the request as a POJO (plain old javascript object)
   */
  public async request(endpoint: string, body: any) {
    const salt = await this.options.saltProvider();
    const payload = JSON.stringify(
      Object.assign(body, {
        salt,
        merchant: this.options.merchant,
      }),
      (key, value) => {
        if (key.includes('Date') || key.includes('timeout')) {
          return format(parseISO(value), "yyyy-MM-dd'T'HH:mm:ssxxxxx");
        }
        return value;
      }
    );
    const hash = getSignature(payload, this.options.secret);
    const requestUrl = new URL(endpoint, this.options.baseUrl).toString();
    const response = await this.options.httpClient.post(
      requestUrl,
      payload,
      hash
    );
    const isValid = validateSignature(
      response.body,
      this.options.secret,
      response.signature
    );
    if (!isValid) {
      throw new Error('Invalid signature');
    }

    const result = JSON.parse(response.body);
    if (result.errorCodes && result.errorCodes.length > 0) {
      throw new SimplePaymentError(result.errorCodes, result);
    }
    return result;
  }

  /**
   * Allows access to validate an incoming request data
   * @param message the request body in string format
   * @param signature the signature of the request
   */
  public validateMessage(message: string, signature: string) {
    return validateSignature(message, signature, this.options.secret);
  }
}
