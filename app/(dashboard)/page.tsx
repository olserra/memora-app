import ClientHome from "./ClientHome";

export default function Page() {
  // Redirects for authenticated users are handled in `middleware.ts` to
  // perform a fast edge redirect and avoid a client-side flash. This page
  // just renders the client landing component for unauthenticated visitors.
  return <ClientHome />;
}
