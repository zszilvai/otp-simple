export class SimplePaymentError extends Error {
  constructor(public errorCodes: number[], public response: any) {
    super(errorCodes.join(', '));
  }

  getErrorStrings(localizedErrorMessages: { [key: number]: string }): string[] {
    return this.errorCodes.map((code) => localizedErrorMessages[code]);
  }
}
