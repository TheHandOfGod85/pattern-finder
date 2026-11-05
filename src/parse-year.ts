const centuryPattern = /(\d{1,2})(?:st|nd|rd|th)\s+century/i;
const yearPattern = /\d{4}/;

export function parseYear(dateText: string | null | undefined): number | null {
  if (dateText === null || dateText === undefined) {
    return null;
  }

  const centuryMatch = dateText.match(centuryPattern);

  if (centuryMatch !== null) {
    const century = Number(centuryMatch[1]);
    return (century - 1) * 100 + 50;
  }

  const yearMatch = dateText.match(yearPattern);

  if (yearMatch === null) {
    return null;
  }

  return Number(yearMatch[0]);
}
