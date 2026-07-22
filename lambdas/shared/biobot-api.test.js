const { describe, it, mock } = require('node:test');
const assert = require('node:assert/strict');

const {
  BioBotApiError,
  ENDPOINTS,
  buildHeaders,
  buildUrl,
  createBioBotClient,
  normalizeTargetCode,
} = require('./biobot-api');

const TEST_CONFIG = {
  apiKey: 'test-api-key',
  baseUrl: 'https://api.explore.biobot.io',
  userAgent: 'test-agent/1.0',
};

describe('normalizeTargetCode', () => {
  it('lowercases target codes per Postman collection', () => {
    assert.equal(normalizeTargetCode('RSV'), 'rsv');
    assert.equal(normalizeTargetCode('rsv'), 'rsv');
  });
});

describe('buildHeaders', () => {
  it('includes Bearer auth, Accept, and User-Agent only', () => {
    const headers = buildHeaders(TEST_CONFIG);

    assert.equal(headers.Authorization, 'Bearer test-api-key');
    assert.equal(headers.Accept, 'application/json');
    assert.equal(headers['User-Agent'], 'test-agent/1.0');
    assert.equal(Object.keys(headers).length, 3);
  });
});

describe('buildUrl', () => {
  it('builds the Postman collection URL with lowercase target code', () => {
    const url = buildUrl(TEST_CONFIG, 'RSV', ENDPOINTS.national);
    assert.equal(url.toString(), 'https://api.explore.biobot.io/beta/data/rsv/national');
  });

  it('appends page_token when provided', () => {
    const url = buildUrl(TEST_CONFIG, 'RSV', ENDPOINTS.state, 'abc123');
    assert.equal(
      url.toString(),
      'https://api.explore.biobot.io/beta/data/rsv/state?page_token=abc123'
    );
  });
});

describe('BioBotClient', () => {
  it('fetchPage sends required headers and returns JSON', async () => {
    const fetchImpl = mock.fn(async () => ({
      ok: true,
      json: async () => ({ data: [{ state_abbr: 'CA' }], next_page_token: 'next' }),
    }));

    const client = createBioBotClient({ ...TEST_CONFIG, fetchImpl });
    const payload = await client.fetchPage('RSV', ENDPOINTS.national);

    assert.equal(fetchImpl.mock.callCount(), 1);
    assert.equal(
      fetchImpl.mock.calls[0].arguments[0],
      'https://api.explore.biobot.io/beta/data/rsv/national'
    );
    assert.deepEqual(fetchImpl.mock.calls[0].arguments[1].headers, buildHeaders(TEST_CONFIG));
    assert.deepEqual(payload, { data: [{ state_abbr: 'CA' }], next_page_token: 'next' });
  });

  it('fetchPage throws BioBotApiError on non-2xx responses', async () => {
    const fetchImpl = mock.fn(async () => ({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized',
    }));

    const client = createBioBotClient({ ...TEST_CONFIG, fetchImpl });

    await assert.rejects(
      () => client.fetchPage('RSV', ENDPOINTS.national),
      (err) => {
        assert.ok(err instanceof BioBotApiError);
        assert.equal(err.status, 401);
        assert.equal(err.body, 'Unauthorized');
        return true;
      }
    );
  });

  it('fetchAllPages paginates through next_page_token', async () => {
    let callCount = 0;
    const fetchImpl = mock.fn(async () => {
      callCount += 1;
      if (callCount === 1) {
        return {
          ok: true,
          json: async () => ({ data: [{ id: 1 }], next_page_token: 'page-2' }),
        };
      }
      return {
        ok: true,
        json: async () => ({ data: [{ id: 2 }] }),
      };
    });

    const client = createBioBotClient({ ...TEST_CONFIG, fetchImpl });
    const rows = await client.fetchAllPages('RSV', ENDPOINTS.state);

    assert.equal(fetchImpl.mock.callCount(), 2);
    assert.deepEqual(rows, [{ id: 1 }, { id: 2 }]);
  });

  it('fetchNationalData uses the national endpoint', async () => {
    const fetchImpl = mock.fn(async (url) => {
      assert.equal(url, 'https://api.explore.biobot.io/beta/data/rsv/national');
      return {
        ok: true,
        json: async () => ({ data: [{ country_code: 'US' }] }),
      };
    });

    const client = createBioBotClient({ ...TEST_CONFIG, fetchImpl });
    const rows = await client.fetchNationalData('RSV');
    assert.deepEqual(rows, [{ country_code: 'US' }]);
  });

  it('fetchStateData uses the state endpoint', async () => {
    const fetchImpl = mock.fn(async (url) => {
      assert.equal(url, 'https://api.explore.biobot.io/beta/data/rsv/state');
      return {
        ok: true,
        json: async () => ({ data: [{ state_abbr: 'TX' }] }),
      };
    });

    const client = createBioBotClient({ ...TEST_CONFIG, fetchImpl });
    const rows = await client.fetchStateData('RSV');
    assert.deepEqual(rows, [{ state_abbr: 'TX' }]);
  });

  it('fetchCountyData defaults to county/ai', async () => {
    const fetchImpl = mock.fn(async (url) => {
      assert.equal(url, 'https://api.explore.biobot.io/beta/data/rsv/county/ai');
      return {
        ok: true,
        json: async () => ({ data: [{ county_fips: '01001' }] }),
      };
    });

    const client = createBioBotClient({ ...TEST_CONFIG, fetchImpl });
    const rows = await client.fetchCountyData('RSV');

    assert.deepEqual(rows, [{ county_fips: '01001' }]);
  });

  it('fetchCountyData supports hotspots variant', async () => {
    const fetchImpl = mock.fn(async (url) => {
      assert.equal(url, 'https://api.explore.biobot.io/beta/data/rsv/county/hotspots');
      return {
        ok: true,
        json: async () => ({ data: [{ county_fips: '01003' }] }),
      };
    });

    const client = createBioBotClient({ ...TEST_CONFIG, fetchImpl });
    const rows = await client.fetchCountyData('RSV', { variant: 'hotspots' });

    assert.deepEqual(rows, [{ county_fips: '01003' }]);
  });
});
