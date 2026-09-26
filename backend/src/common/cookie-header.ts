export type CookieMap = Record<string, string>;

/**
 * Minimal `Cookie:` header parser.
 *
 * `cookie-parser` already parses the header for the Express/GraphQL path, but the
 * Socket.io handshake receives the raw header, so both paths share this parser to
 * keep one cookie-reading implementation in the app.
 */
export const parseCookieHeader = (
  header: string | undefined,
): CookieMap => {
  if (!header) {
    return {};
  }

  return header.split(';').reduce<CookieMap>((cookies, part) => {
    const separator = part.indexOf('=');
    if (separator < 1) {
      return cookies;
    }

    const name = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    if (name.length === 0) {
      return cookies;
    }

    try {
      cookies[name] = decodeURIComponent(value);
    } catch {
      cookies[name] = value;
    }
    return cookies;
  }, {});
};

export const readCookie = (
  cookies: Record<string, unknown> | undefined,
  name: string,
): string | null => {
  const value = cookies?.[name];
  return typeof value === 'string' && value.length > 0 ? value : null;
};
