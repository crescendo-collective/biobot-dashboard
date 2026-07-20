const BASE_URL = process.env.BIOBOT_API_BASE_URL || 'https://api.explore.biobot.io';

async function fetchPage(targetCode, pathSuffix, pageToken) {
  const apiKey = process.env.BIOBOT_API_KEY;
  if (!apiKey) {
    throw new Error('BIOBOT_API_KEY environment variable is required');
  }

  const url = new URL(`/beta/data/${targetCode}/${pathSuffix}`, BASE_URL);
  if (pageToken) {
    url.searchParams.set('page_token', pageToken);
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`BioBot API error ${response.status}: ${text}`);
  }

  return response.json();
}

async function fetchAllPages(targetCode, pathSuffix) {
  const allData = [];
  let pageToken;

  do {
    const payload = await fetchPage(targetCode, pathSuffix, pageToken);
    const rows = payload.data || [];
    allData.push(...rows);
    pageToken = payload.next_page_token || null;
  } while (pageToken);

  return allData;
}

module.exports = { fetchPage, fetchAllPages };
