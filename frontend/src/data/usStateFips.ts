// us-atlas's state features only expose full names via `.properties.name`
// (e.g. "Massachusetts") — there's no abbreviation anywhere in that
// topology. This is the standard, stable 2-digit state FIPS code, which
// IS available on every state/county feature via `.id` (a county's FIPS
// is its 2-digit state prefix + 3-digit county code), so keying off FIPS
// rather than parsing the name string is the reliable way to get a
// 2-letter abbreviation.
const STATE_FIPS_TO_ABBR: Record<string, string> = {
  '01': 'AL',
  '02': 'AK',
  '04': 'AZ',
  '05': 'AR',
  '06': 'CA',
  '08': 'CO',
  '09': 'CT',
  '10': 'DE',
  '11': 'DC',
  '12': 'FL',
  '13': 'GA',
  '15': 'HI',
  '16': 'ID',
  '17': 'IL',
  '18': 'IN',
  '19': 'IA',
  '20': 'KS',
  '21': 'KY',
  '22': 'LA',
  '23': 'ME',
  '24': 'MD',
  '25': 'MA',
  '26': 'MI',
  '27': 'MN',
  '28': 'MS',
  '29': 'MO',
  '30': 'MT',
  '31': 'NE',
  '32': 'NV',
  '33': 'NH',
  '34': 'NJ',
  '35': 'NM',
  '36': 'NY',
  '37': 'NC',
  '38': 'ND',
  '39': 'OH',
  '40': 'OK',
  '41': 'OR',
  '42': 'PA',
  '44': 'RI',
  '45': 'SC',
  '46': 'SD',
  '47': 'TN',
  '48': 'TX',
  '49': 'UT',
  '50': 'VT',
  '51': 'VA',
  '53': 'WA',
  '54': 'WV',
  '55': 'WI',
  '56': 'WY',
  // Territories — us-atlas's counties-10m topology doesn't include
  // these, but harmless to have on hand if that ever changes.
  '60': 'AS',
  '66': 'GU',
  '69': 'MP',
  '72': 'PR',
  '78': 'VI',
}

/** county_fips is state FIPS (2 digits) + county FIPS (3 digits). */
export function stateAbbrFromCountyFips(countyFips: string): string {
  return STATE_FIPS_TO_ABBR[countyFips.slice(0, 2)] ?? '??'
}
