import * as fetchMock from "fetch-mock";
import {SimpleHttpClientFetchAdapter} from "./simple-http-client-fetch-adapter";
import * as fetch from "node-fetch";

describe('Simple HTTP Client Fetch Adapter', () => {
  it('Should execute post requests to an URL then retrieve the body and signature', async () => {
    const body = {
      signature: 'signature',
      body: 'body'
    }
    fetchMock.mock('http://test.com/goodTest', {
      body,
      headers: {
        'Content-Type': 'application/json',
        signature: 'signature',
      }
    });
    const adapter = new SimpleHttpClientFetchAdapter(fetch as any); // TODO find a solution to avoid any
    const result = await adapter.post('http://test.com/goodTest', '{}',  'signature');
    expect(result.body).toEqual(body);
    expect(result.signature).toEqual('signature');
    fetchMock.restore();
  });
});
