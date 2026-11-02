export function isConverterFileUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password &&
      (!url.port || url.port === "443") && /(^|\.)cnvmp3\.(com|online|site)$/i.test(url.hostname);
  } catch { return false; }
}