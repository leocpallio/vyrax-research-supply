import { createFileRoute } from "@tanstack/react-router";
import { InfoPage, pageHead } from "@/components/InfoPage";
import { titles } from "@/lib/seo";
import { site } from "@/data/site";

type Search = { email?: string; done?: string; error?: string };

export const Route = createFileRoute("/unsubscribe")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    ...(typeof s["email"] === "string" ? { email: s["email"].slice(0, 254) } : {}),
    ...(s["done"] === "1" || s["done"] === 1 ? { done: "1" } : {}),
    ...(s["error"] === "invalid" || s["error"] === "unavailable"
      ? { error: s["error"] as string }
      : {}),
  }),
  head: () =>
    pageHead(
      "/unsubscribe",
      titles.info("Unsubscribe"),
      "Stop marketing email from Vyrax Labs. Order and service messages are not affected.",
      { crumb: "Unsubscribe", noindex: true },
    ),
  component: Unsubscribe,
});

function Unsubscribe() {
  const { email, done, error } = Route.useSearch();
  return (
    <InfoPage title="Unsubscribe" crumb="Unsubscribe">
      {done ? (
        <p role="status" data-testid="unsubscribe-done">
          Done. That address will not receive marketing email from {site.name}. Order and service
          messages about an order you placed are not affected. Marketing texts are stopped
          separately: reply STOP to any text from us.
        </p>
      ) : (
        <>
          <p>
            Enter the email address you want removed from {site.name} marketing. To stop marketing
            texts, reply STOP to the text message.
          </p>
          {error === "invalid" && (
            <p role="alert" data-testid="unsubscribe-error">
              That does not look like an email address. Please check it and try again.
            </p>
          )}
          {error === "unavailable" && (
            <p role="alert" data-testid="unsubscribe-error">
              We could not save that just now. Please try again, or email{" "}
              <a href={`mailto:${site.email}`}>{site.email}</a>.
            </p>
          )}
          <form
            method="post"
            action="/api/unsubscribe"
            className="mt-4 flex max-w-md flex-col gap-3"
          >
            <label htmlFor="unsubscribe-email" className="text-sm font-medium">
              Email address
            </label>
            <input
              id="unsubscribe-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              maxLength={254}
              defaultValue={email ?? ""}
              className="h-12 rounded-md border border-input bg-white px-3 text-base"
            />
            <button
              type="submit"
              className="h-12 rounded-full bg-primary px-6 font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
            >
              Unsubscribe
            </button>
          </form>
          <p className="mt-4 text-sm text-muted-foreground">
            This stops marketing only. Order and service emails about an order you placed continue.
          </p>
        </>
      )}
    </InfoPage>
  );
}
