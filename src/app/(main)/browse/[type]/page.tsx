import { redirect } from "next/navigation";

/**
 * Browse by Type — Dynamic Route
 *
 * /browse/movie, /browse/series, /browse/anime, /browse/donghua, /browse/microdrama
 *
 * Reads the `type` param and redirects to the main browse page with
 * the type set as a query parameter. This keeps all browse logic in
 * a single client component while supporting clean URL paths.
 */

const VALID_TYPES = new Set([
  "movie",
  "series",
  "anime",
  "donghua",
  "microdrama",
]);

interface PageProps {
  params: Promise<{ type: string }>;
}

export default async function BrowseTypePage({ params }: PageProps) {
  const { type } = await params;

  // Validate the type param
  if (!VALID_TYPES.has(type)) {
    redirect("/browse");
  }

  // Redirect to the main browse page with the type filter
  redirect(`/browse?type=${type}`);
}