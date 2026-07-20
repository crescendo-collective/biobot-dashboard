const DEFAULT_BASE_URL = 'https://api.explore.biobot.io';
const DEFAULT_USER_AGENT = 'sanofi-biobot-dashboard/0.1.0';
const API_PREFIX = '/beta/data';

/** @typedef {'ai' | 'hotspots'} CountyVariant */

/**
 * @typedef {Object} BioBotClientConfig
 * @property {string} apiKey
 * @property {string} [baseUrl]
 * @property {string} [userAgent]
 * @property {typeof fetch} [fetchImpl]
 */

/**
 * @typedef {Object} BioBotPageResponse
 * @property {Array<Record<string, unknown>>} data
 * @property {string} [next_page_token]
 */

class BioBotApiError extends Error {
  /**
   * @param {string} message
   * @param {Object} details
   * @param {number} details.status
   * @param {string} details.url
   * @param {string} [details.body]
   */
  constructor(message, { status, url, body }) {
    super(message);
    this.name = 'BioBotApiError';
    this.status = status;
    this.url = url;
    this.body = body;
  }
}

/** Path suffixes from the BioBot Analytics. */
const ENDPOINTS = {
  national: 'national',
  regional: 'regional',
  state: 'state',
  zip: 'zip',
  county: {
    ai: 'county/ai',
    hotspots: 'county/hotspots',
  },
};

function normalizeTargetCode(targetCode) {
  return targetCode.toLowerCase();
}

function loadConfigFromEnv() {
  const apiKey = process.env.BIOBOT_API_KEY;
  if (!apiKey) {
    throw new Error('BIOBOT_API_KEY environment variable is required');
  }

  return {
    apiKey,
    baseUrl: process.env.BIOBOT_API_BASE_URL || DEFAULT_BASE_URL,
    userAgent: process.env.BIOBOT_USER_AGENT || DEFAULT_USER_AGENT,
  };
}

/**
 * @param {BioBotClientConfig} config
 * @returns {Record<string, string>}
 */
function buildHeaders(config) {
  /** @type {Record<string, string>} */
  return {
    Authorization: `Bearer ${config.apiKey}`,
    Accept: 'application/json',
    'User-Agent': config.userAgent || DEFAULT_USER_AGENT,
  };
}

/**
 * @param {BioBotClientConfig} config
 * @param {string} targetCode
 * @param {string} pathSuffix
 * @param {string} [pageToken]
 */
function buildUrl(config, targetCode, pathSuffix, pageToken) {
  const url = new URL(
    `${API_PREFIX}/${normalizeTargetCode(targetCode)}/${pathSuffix}`,
    config.baseUrl
  );
  if (pageToken) {
    url.searchParams.set('page_token', pageToken);
  }
  return url;
}

class BioBotClient {
  /**
   * @param {BioBotClientConfig} [config]
   */
  constructor(config = {}) {
    const envConfig = config.apiKey ? {} : loadConfigFromEnv();

    this.config = {
      fetchImpl: fetch,
      baseUrl: DEFAULT_BASE_URL,
      userAgent: DEFAULT_USER_AGENT,
      ...envConfig,
      ...config,
    };

    if (!this.config.apiKey) {
      throw new Error('BIOBOT_API_KEY environment variable is required');
    }
  }

  /**
   * @param {string} targetCode
   * @param {string} pathSuffix
   * @param {string} [pageToken]
   * @returns {Promise<BioBotPageResponse>}
   */
  async fetchPage(targetCode, pathSuffix, pageToken) {
    const url = buildUrl(this.config, targetCode, pathSuffix, pageToken);
    const fetchImpl = this.config.fetchImpl || fetch;

    const response = await fetchImpl(url.toString(), {
      headers: buildHeaders(this.config),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new BioBotApiError(`BioBot API error ${response.status}`, {
        status: response.status,
        url: url.toString(),
        body,
      });
    }

    return response.json();
  }

  /**
   * @param {string} targetCode
   * @param {string} pathSuffix
   * @returns {Promise<Array<Record<string, unknown>>>}
   */
  async fetchAllPages(targetCode, pathSuffix) {
    const allData = [];
    let pageToken;

    do {
      const payload = await this.fetchPage(targetCode, pathSuffix, pageToken);
      const rows = payload.data || [];
      allData.push(...rows);
      pageToken = payload.next_page_token || null;
    } while (pageToken);

    return allData;
  }

  /**
   * @param {string} targetCode
   * @returns {Promise<Array<Record<string, unknown>>>}
   */
  fetchNationalData(targetCode) {
    return this.fetchAllPages(targetCode, ENDPOINTS.national);
  }

  /**
   * @param {string} targetCode
   * @returns {Promise<Array<Record<string, unknown>>>}
   */
  fetchStateData(targetCode) {
    return this.fetchAllPages(targetCode, ENDPOINTS.state);
  }

  /**
   * @param {string} targetCode
   * @param {{ variant?: CountyVariant }} [options]
   * @returns {Promise<Array<Record<string, unknown>>>}
   */
  fetchCountyData(targetCode, { variant = 'ai' } = {}) {
    const pathSuffix = ENDPOINTS.county[variant];
    if (!pathSuffix) {
      throw new Error(`Unsupported county variant: ${variant}`);
    }
    return this.fetchAllPages(targetCode, pathSuffix);
  }
}

/** @type {BioBotClient | null} */
let defaultClient = null;

function getDefaultClient() {
  if (!defaultClient) {
    defaultClient = new BioBotClient();
  }
  return defaultClient;
}

/**
 * @param {BioBotClientConfig} [config]
 */
function createBioBotClient(config = {}) {
  return new BioBotClient(config);
}

async function fetchPage(targetCode, pathSuffix, pageToken) {
  return getDefaultClient().fetchPage(targetCode, pathSuffix, pageToken);
}

async function fetchAllPages(targetCode, pathSuffix) {
  return getDefaultClient().fetchAllPages(targetCode, pathSuffix);
}

async function fetchNationalData(targetCode) {
  return getDefaultClient().fetchNationalData(targetCode);
}

async function fetchStateData(targetCode) {
  return getDefaultClient().fetchStateData(targetCode);
}

async function fetchCountyData(targetCode, options) {
  return getDefaultClient().fetchCountyData(targetCode, options);
}

module.exports = {
  BioBotApiError,
  BioBotClient,
  ENDPOINTS,
  buildHeaders,
  buildUrl,
  createBioBotClient,
  fetchPage,
  fetchAllPages,
  fetchNationalData,
  fetchStateData,
  fetchCountyData,
  loadConfigFromEnv,
  normalizeTargetCode,
};
