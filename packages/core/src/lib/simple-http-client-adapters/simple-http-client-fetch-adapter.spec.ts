import * as fetchMock from 'fetch-mock'; // { sandbox } from "fetch-mock";
import { SimpleHttpClientFetchAdapter } from './simple-http-client-fetch-adapter';

describe('Simple HTTP Client Fetch Adapter', () => {
  it('Should execute post requests to an URL then retrieve the body and signature', async () => {
    const body = {
      signature: 'signature',
      body: 'body',
    };
    const fetch = fetchMock.sandbox();
    fetch.mock('http://test.com/goodTest', {
      body,
      headers: {
        'Content-Type': 'application/json',
        signature: 'signature',
      },
    });
    const adapter = new SimpleHttpClientFetchAdapter(fetch as any); // TODO find a solution to avoid any
    const result = await adapter.post(
      'http://test.com/goodTest',
      '{}',
      'signature'
    );
    expect(result.body).toEqual(JSON.stringify(body));
    expect(result.signature).toEqual('signature');
    fetch.restore();
  }, 1000);

  it('Should throw an error when there is no signature present', async () => {
    const body = {
      signature: 'signature',
      body: 'body',
    };
    const fetch = fetchMock.sandbox();
    fetch.mock('http://test.com/goodTest', {
      body,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const adapter = new SimpleHttpClientFetchAdapter(fetch as any); // TODO find a solution to avoid any
    expect(adapter.post('http://test.com/goodTest', '{}', 'signature'))
      .rejects.toThrowError('No signature found in response')
      .then(() => {
        fetch.restore();
      });
  });
});
