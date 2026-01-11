// src/utils/fetchWithRetry.ts

export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = 3,
  backoff = 300
) {
  try {
    const res = await fetch(url, options);

    if (!res.ok) {
      if (retries > 0) {
        await new Promise((r) => setTimeout(r, backoff));
        return fetchWithRetry(url, options, retries - 1, backoff * 2);
      }
      throw new Error(`Fetch failed: ${res.status}`);
    }

    return res.json();
  } catch (err) {
    if (retries > 0) {
      await new Promise((r) => setTimeout(r, backoff));
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    console.error("Fetch error:", err);
    return null;
  }
}
