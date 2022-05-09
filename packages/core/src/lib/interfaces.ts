export enum Currency {
  HUF = 'HUF',
  EUR = 'EUR',
  USD = 'USD',
}

export enum Language {
  BG = 'BG',
  CS = 'CS',
  DE = 'DE',
  EN = 'EN',
  ES = 'ES',
  FR = 'FR',
  IT = 'IT',
  HR = 'HR',
  HU = 'HU',
  PL = 'PL',
  RO = 'RO',
  RU = 'RU',
  SK = 'SK',
  TR = 'TR',
}

export enum PaymentMethod {
  WIRE = 'WIRE',
  CARD = 'CARD',
}

export enum ThreeDsReqAuthMethod {
  GUEST = '01',
  REGISTERED_AT_MERCHANT = '02',
  REGISTERED_BY_THIRD_PARTY = '05',
}

export interface SimpleOptions {
  baseUrl: string;
  merchant: string;
  saltProvider: () => string;
}

export declare type Country = string; //FIXME get country code list

export interface Delivery {
  name: string;
  company: string;
  country: Country;
  state: string;
  city: string;
  zip: string;
  address: string;
  address2: string;
  phone: string;
}

export interface Invoice {
  name: string;
  company: string;
  country: Country;
  state: string;
  city: string;
  zip: string;
  address: string;
  address2: string;
  phone: string;
  threeDSReqAuthMethod?: ThreeDsReqAuthMethod;
}

export interface Delivery {
  name: string;
  country: Country;
  state: string;
  city: string;
  zip: string;
  address: string;
  threeDSReqAuthMethod?: ThreeDsReqAuthMethod;
}

export interface Item {
  ref?: string;
  title?: string;
  description?: string;
  amount: number;
  price: number;
  tax?: number;
}

export interface StartOptionsBase {
  orderRef: string;
  currency: Currency;
  customerEmail: string;
  language: Language;
  sdkVersion: string;
  methods: PaymentMethod[];
  timeout: Date;
  url: string;
  maySelectEmail?: boolean;
  maySelectInvoice?: boolean;
  maySelectDelivery?: Country[];
  shippingCost?: number;
  discount?: number;
  customer?: string;
  urls?: {
    success: string;
    fail: string;
    cancel: string;
    timeout: string;
  };
  twoStep?: boolean;
  delivery?: Delivery;
}

export interface TotalSpecified {
  total: number;
}

export interface ItemsSpecified {
  total?: number;
  items: Item[];
}

export declare type StartOptions = StartOptionsBase &
  (ItemsSpecified | TotalSpecified);

/**
 * As stated in the specification 2.
 */
export enum PaymentStatus {
  INIT = 'INIT',
  TIMEOUT = 'TIMEOUT',
  CANCELLED = 'CANCELLED',
  NOTAUTHORIZED = 'NOTAUTHORIZED',
  INPAYMENT = 'INPAYMENT',
  INFRAUD = 'INFRAUD',
  AUTHORIZED = 'AUTHORIZED',
  FRAUD = 'FRAUD',
  REVERSED = 'REVERSED',
  REFUND = 'REFUND',
  FINISHED = 'FINISHED',
}

export enum RedirectResult {
  SUCCESS = 'SUCCESS',
  FAIL = 'FAIL',
  CANCEL = 'CANCEL',
  TIMEOUT = 'TIMEOUT',
}

export interface StartSuccessResponse {
  orderRef: string;
  currency: Currency;
  transactionId: number;
  timeout: Date;
  total: number;
  paymentUrl: string;
}

export enum ErrorCode {}
// TODO

export interface StartErrorResponse {
  errorCodes: ErrorCode[];
}

export declare type PaymentResponse = StartSuccessResponse | StartErrorResponse;

export interface IpnMessage {
  salt: string;
  orderRef: string;
  method: PaymentMethod;
  merchant: string;
  finishDate: Date;
  paymentDate: Date;
  transactionId: number;
  status: PaymentStatus;
}

export interface IpnResponse {
  orderRef: string;
  method: PaymentMethod;
  finishDate: Date;
  paymentDate: Date;
  transactionId: number;
  status: PaymentStatus;
  receiveDate: Date;
}

export interface FinishOptionsBase {
  originalTotal: number;
  approveTotal: number;
  currency: Currency;
  sdkVersion: string;
}

export interface OptionTransactionIdSpecified {
  transactionId: number;
  orderRef?: string;
}
export interface OptionOrderRefSpecified {
  transactionId?: number;
  orderRef: string;
}

export declare type FinishOptions = FinishOptionsBase &
  (OptionTransactionIdSpecified | OptionOrderRefSpecified);

export interface RefundOptionsBase {
  currency: Currency;
  refundTotal: number;
  sdkVersion: string;
}

export declare type RefundOptions = RefundOptionsBase &
  (OptionTransactionIdSpecified | OptionOrderRefSpecified);

export interface RefundResponse {
  salt: string;
  merchant: string;
  orderRef: string;
  currency: Currency;
  transactionId: number;
  refundTransactionId: number;
  refundTotal: number;
  remainingTotal: number;
  detailed?: boolean;
}

export interface QueryBaseOptions {
  salt: string;
  merchant: string;
}

export interface QueryWithOrderRefs {
  orderRefs: string[];
  transactionIds?: string[];
}

export interface QueryWithTransactionIds {
  orderRefs?: string[];
  transactionIds: string[];
}

export type QueryOptions = QueryBaseOptions &
  (QueryWithOrderRefs | QueryWithTransactionIds);

export interface TransactionStatus {
  orderRef: string;
  total: number;
  transactionId: number;
  status: PaymentStatus;
  resultCode?: string;
  remainingTotal: number;
  paymentDate: Date;
  finishDate: Date;
  method: PaymentMethod;
}

export interface QueryResponse {
  salt: string;
  merchant: string;
  transactions: TransactionStatus[];
  totalCount: number;
}

// FIXME
export type DetailedTransactionStatus = TransactionStatus;
