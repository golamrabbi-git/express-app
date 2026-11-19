import jwt from 'jsonwebtoken';
import config from '../config/index.js';

// Cookie transport for admin refresh tokens (used by the admin panel).
//
// A client opts in with the header `X-Auth-Mode: cookie`. Then the refresh token is set as an
// httpOnly cookie (unreadable by page scripts) and left out of the JSON body. Without the
// header, tokens stay in the JSON body as before (Postman, scripts, mobile apps).
//
// The cookie is only read when that header is present. A custom header can't be sent
// cross-site without passing CORS, so other websites can't use the cookie (CSRF protection).

const { name, sameSite, secure } = config.adminCookie;
const PATH = '/api/admin/auth'; // the cookie is only sent to the admin auth endpoints

export const wantsCookie = (req) => req.get('x-auth-mode') === 'cookie';

const baseOptions = { httpOnly: true, secure, sameSite, path: PATH };

/** Sends a token pair: refresh token as a cookie (cookie mode) or in the body. */
export const sendTokens = (req, res, { refreshToken, ...rest }, status = 200) => {
  if (!wantsCookie(req)) return res.status(status).json({ ...rest, refreshToken });
  const { exp } = jwt.decode(refreshToken);
  res.cookie(name, refreshToken, { ...baseOptions, maxAge: exp * 1000 - Date.now() });
  return res.status(status).json(rest);
};

/** The refresh token from the body, or from the cookie in cookie mode. */
export const refreshTokenFrom = (req) =>
  req.body?.refreshToken || (wantsCookie(req) ? req.cookies?.[name] : undefined);

export const clearRefreshCookie = (res) => res.clearCookie(name, baseOptions);
