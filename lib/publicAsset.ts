/**
 * When the app is hosted under a subpath in IIS (e.g. http://host:port/MyApp),
 * set NEXT_PUBLIC_BASE_PATH=/MyApp (no trailing slash) and rebuild so static
 * files and Next routes resolve correctly.
 */
export function getNextBasePath(): string | undefined {
  const raw = process.env.NEXT_PUBLIC_BASE_PATH?.trim();
  if (!raw || raw === "/") return undefined;
  const withSlash = raw.startsWith("/") ? raw : `/${raw}`;
  const trimmed = withSlash.replace(/\/+$/, "");
  return trimmed === "" ? undefined : trimmed;
}

/** URL path for a file in /public (respects NEXT_PUBLIC_BASE_PATH). */
export function publicAssetSrc(path: string): string {
  const base = getNextBasePath();
  const p = path.startsWith("/") ? path : `/${path}`;
  if (!base) return p;
  return `${base}${p}`;
}
