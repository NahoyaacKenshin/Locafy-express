const isProduction = process.env.NODE_ENV === "production";

export function buildCookieOptions(maxAge?: number) {
  const sameSite: "strict" | "lax" = isProduction ? "strict" : "lax";
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite,
    maxAge,
    path: "/",
  };
}

export function clearCookieOptions() {
  return {
    ...buildCookieOptions(),
    maxAge: 0,
  };
}