import { SimpleHttpClient } from './simple-http-client';
import { SimpleConnectionClient } from '@otp-simple/core';
import {
  FinishOptions,
  IpnMessage,
  IpnResponse,
  StartOptions,
  PaymentResponse,
  StartSuccessResponse,
  RefundOptions,
  RefundResponse,
  QueryOptions,
  QueryResponse,
} from './interfaces';
import { validateSignature } from './integrity';
import { format } from 'date-fns';
import addDate from 'date-fns/add';

export interface SimpleClientOptionsWithConnectionClient {
  connectionClient: SimpleConnectionClient;
}

export interface SimpleClientOptionsWithParameters {
  baseUrl: string;
  merchant: string;
  secret: string;
  saltProvider: () => Promise<string>;
  httpClient?: SimpleHttpClient;
}

function isSimpleClientOptionsWithConnectionClient(
  options:
    | SimpleClientOptionsWithConnectionClient
    | SimpleClientOptionsWithParameters
): options is SimpleClientOptionsWithConnectionClient {
  return (
    (options as SimpleClientOptionsWithConnectionClient).connectionClient !==
      undefined &&
    // tslint:disable-next-line:no-unnecessary-type-assertion (type assertion is necessary here because of this is a type guard)
    (options as SimpleClientOptionsWithConnectionClient)
      .connectionClient instanceof SimpleConnectionClient
  );
}

export class SimpleClient {
  private connectionClient: SimpleConnectionClient;

  constructor(
    protected options:
      | SimpleClientOptionsWithConnectionClient
      | SimpleClientOptionsWithParameters
  ) {
    if (isSimpleClientOptionsWithConnectionClient(options)) {
      this.connectionClient = options.connectionClient;
    } else {
      this.connectionClient = new SimpleConnectionClient({
        baseUrl: options.baseUrl,
        merchant: options.merchant,
        saltProvider: options.saltProvider,
        secret: options.secret,
        httpClient: options.httpClient, // TODO default to SimpleHttpClient
      });
    }
  }

  start(params: StartOptions): Promise<PaymentResponse> {
    return this.connectionClient.request('start', params);
  }

  validateIpnMessage(ipnMessage: string, signature: string): boolean {
    return this.connectionClient.validateMessage(ipnMessage, signature);
  }

  getIpnMessage(ipnMessage: string, signature: string): IpnMessage {
    if (this.validateIpnMessage(ipnMessage, signature)) {
      return JSON.parse(ipnMessage);
    }
    throw new Error('Invalid signature');
  }

  getIpnMessageResponse(ipnMessage: IpnMessage): IpnResponse;
  getIpnMessageResponse(ipnMessage: string, signature: string): IpnResponse;
  getIpnMessageResponse(
    ipnMessage: string | IpnMessage,
    signature?: string
  ): IpnResponse {
    // TODO handle errors
    let message: IpnMessage;
    if (typeof ipnMessage !== 'string') {
      message = ipnMessage;
    } else if (!signature) {
      throw new Error('Signature is required');
    } else {
      message = this.getIpnMessage(ipnMessage, signature);
    }

    const receiveDate = new Date();
    return {
      ...message,
      receiveDate,
    };
  }

  finish(params: FinishOptions): Promise<PaymentResponse> {
    return this.connectionClient.request('finish', params);
  }

  refund(params: RefundOptions): Promise<RefundResponse> {
    return this.connectionClient.request('refund', params);
  }

  query(params: QueryOptions): Promise<QueryResponse> {
    return this.connectionClient.request('query', params);
  }
}
