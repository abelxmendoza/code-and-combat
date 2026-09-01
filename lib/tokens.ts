// Management tokens are always generated server-side by Postgres
// (gen_random_bytes(32) in book_appointment() / register_for_event(), see
// supabase/migrations/0008_functions.sql) — never client-side. This module
// only builds the shareable URL around a token the server already issued.

export const generateSecureLink = (
  baseUrl: string,
  appointmentId: string,
  token: string,
): string => {
  const url = new URL(`${baseUrl}/manage/${appointmentId}`);
  url.searchParams.set('token', token);
  return url.toString();
};

export const generateEventManageLink = (
  baseUrl: string,
  registrationId: string,
  token: string,
): string => {
  const url = new URL(`${baseUrl}/manage/event/${registrationId}`);
  url.searchParams.set('token', token);
  return url.toString();
};
