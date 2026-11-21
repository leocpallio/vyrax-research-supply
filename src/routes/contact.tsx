import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Clock, FileCheck2, MessageCircle, Phone } from "lucide-react";
import { StoreShell, Disclaimer, Breadcrumbs } from "@/components/Store";
import { pageHead } from "@/components/InfoPage";
import { titles } from "@/lib/seo";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { site } from "@/data/site";

export const Route = createFileRoute("/contact")({
  head: () =>
    pageHead(
      "/contact",
      titles.info("Contact Us"),
      "Contact Vyrax Labs by email or phone about peptide orders, UK delivery, returns and batch documentation.",
      { crumb: "Contact" },
    ),
  component: Contact,
});

const topics = [
  "Order or delivery",
  "Batch certificate request",
  "Product question",
  "Wholesale or institutional supply",
  "Something else",
];

function Contact() {
  const [f, setF] = useState({
    name: "",
    email: "",
    order: "",
    topic: "",
    message: "",
    website: "",
  });
  const [errors, setErrors] = useState<{ name?: string; email?: string; topic?: string; message?: string }>({});
  const [reference, setReference] = useState("");
  const [failure, setFailure] = useState("");
  const [sending, setSending] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!site.email) return;
    const next: { name?: string; email?: string; topic?: string; message?: string } = {};
    if (f.name.trim().length < 2) next.name = "Enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) next.email = "Enter a valid email address.";
    if (!f.topic) next.topic = "Choose a topic.";
    if (f.message.trim().length < 10) next.message = "Enter at least 10 characters.";
    if (f.name.length > 100 || f.email.length > 254 || f.order.length > 80 || f.message.length > 5000)
      next.message = "One or more fields are too long.";
    setErrors(next);
    if (Object.keys(next).length) {
      document.getElementById(`${Object.keys(next)[0]}-contact`)?.focus();
      return;
    }
    setSending(true);
    setFailure("");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(f),
      });
      const result: { reference?: string; error?: string } = await response.json();
      if (!response.ok || !result.reference) throw new Error(result.error || "Message could not be sent.");
      setReference(result.reference);
    } catch (error) {
      setFailure(error instanceof Error ? error.message : "Message could not be sent.");
    } finally {
      setSending(false);
    }
  };
  return (
    <StoreShell>
      <div className="container-main py-8 md:py-12 min-h-[60vh]">
        <Breadcrumbs items={[{ name: "Home", to: "/" }, { name: "Contact" }]} />
        <p className="eyebrow">GET IN TOUCH</p>
        <h1 className="page-title">Contact us</h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Email{" "}
          <a href={`mailto:${site.email}`} className="text-primary underline">
            {site.email}
          </a>{" "}
          for orders, delivery, returns or a question about documentation. For faster answers, see
          the{" "}
          <Link to="/faq" className="text-primary underline">
            FAQ
          </Link>
          . We do not give dosing advice.
        </p>
        <div className="grid lg:grid-cols-[1fr_360px] gap-12 mt-10">
          {site.email ? (
            <form onSubmit={submit} noValidate className="space-y-5 max-w-2xl">
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="block text-sm font-semibold">
                  Name
                  <Input
                    id="name-contact" name="name" autoComplete="name"
                    required
                    className="mt-2 min-h-11"
                    aria-invalid={!!errors.name} aria-describedby={errors.name ? "name-contact-error" : undefined}
                    value={f.name}
                    onChange={(e) => { setF({ ...f, name: e.target.value }); setErrors({ ...errors, name: "" }); }}
                  />
                  {errors.name && <span id="name-contact-error" className="block mt-1 text-sm text-destructive">{errors.name}</span>}
                </label>
                <label className="block text-sm font-semibold">
                  Email
                  <Input
                    id="email-contact" name="email" autoComplete="email"
                    required
                    type="email"
                    className="mt-2 min-h-11"
                    aria-invalid={!!errors.email} aria-describedby={errors.email ? "email-contact-error" : undefined}
                    value={f.email}
                    onChange={(e) => { setF({ ...f, email: e.target.value }); setErrors({ ...errors, email: "" }); }}
                  />
                  {errors.email && <span id="email-contact-error" className="block mt-1 text-sm text-destructive">{errors.email}</span>}
                </label>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="block text-sm font-semibold">
                  Topic
                  <select
                    id="topic-contact" name="topic"
                    required aria-invalid={!!errors.topic} aria-describedby={errors.topic ? "topic-contact-error" : undefined}
                    className="mt-2 w-full min-h-11 border border-border rounded-md px-3 bg-background text-base"
                    value={f.topic}
                    onChange={(e) => { setF({ ...f, topic: e.target.value }); setErrors({ ...errors, topic: "" }); }}
                  >
                    <option value="">Choose a topic</option>
                    {topics.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  {errors.topic && <span id="topic-contact-error" className="block mt-1 text-sm text-destructive">{errors.topic}</span>}
                </label>
                <label className="block text-sm font-semibold">
                  Order number (optional)
                  <Input
                    id="order-contact" name="order" autoComplete="off" className="mt-2 min-h-11"
                    value={f.order}
                    onChange={(e) => setF({ ...f, order: e.target.value })}
                  />
                </label>
              </div>
              <label className="block text-sm font-semibold">
                Message
                <Textarea
                  id="message-contact" name="message" autoComplete="off"
                  required
                  minLength={10}
                  rows={6}
                  className="mt-2"
                  aria-invalid={!!errors.message} aria-describedby={errors.message ? "message-contact-error" : undefined}
                  value={f.message}
                  onChange={(e) => { setF({ ...f, message: e.target.value }); setErrors({ ...errors, message: "" }); }}
                />
                {errors.message && <span id="message-contact-error" className="block mt-1 text-sm text-destructive">{errors.message}</span>}
                </label>
                <div className="absolute -left-[10000px]" aria-hidden="true">
                <label htmlFor="website-contact">Website</label>
                <input id="website-contact" name="website" tabIndex={-1} autoComplete="off" value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} />
                </div>
                <Button type="submit" disabled={sending || !!reference} className="rounded-full h-11 px-7">{sending ? "Sending…" : "Send message"}</Button>
                <p className="text-sm text-muted-foreground">Your details are used to answer this enquiry. Replies are handled during {site.supportHours}; no reply time is guaranteed.</p>
                {failure && <p role="alert" className="text-sm text-destructive">{failure} You can <a href={`mailto:${site.email}`} className="underline">email us instead</a>.</p>}
                {reference && <p role="status" className="text-sm">Message received. Reference: {reference}. Replies are handled during {site.supportHours}.</p>}
            </form>
          ) : (
            <div className="border border-dashed border-border rounded-2xl p-7 max-w-2xl">
              <Mail className="text-primary" />
              <h2 className="font-heading font-semibold mt-3">Contact by email</h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                The contact form is unavailable because no support address is set. Most questions
                are answered on the{" "}
                <Link to="/shipping" className="text-primary underline">
                  delivery
                </Link>
                ,{" "}
                <Link to="/returns" className="text-primary underline">
                  returns
                </Link>
                ,{" "}
                <Link to="/lab-reports" className="text-primary underline">
                  lab reports
                </Link>{" "}
                and{" "}
                <Link to="/faq" className="text-primary underline">
                  FAQ
                </Link>{" "}
                pages.
              </p>
              <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold">
                <Link
                  to="/faq"
                  className="inline-flex min-h-11 items-center text-primary underline underline-offset-2"
                >
                  Read common answers
                </Link>
                <Link
                  to="/shop"
                  className="inline-flex min-h-11 items-center text-primary underline underline-offset-2"
                >
                  Browse specifications
                </Link>
              </div>
            </div>
          )}
          <aside className="space-y-4">
            {site.email && (
              <a
                href={`mailto:${site.email}`}
                className="flex gap-4 border border-border rounded-2xl p-5 hover:border-primary"
              >
                <Mail className="text-primary shrink-0" />
                <div>
                  <p className="font-semibold">Email</p>
                  <p className="text-sm text-muted-foreground">{site.email}</p>
                </div>
              </a>
            )}
            {site.phone && (
              <a
                href={`tel:${site.phone.replace(/\s/g, "")}`}
                className="flex gap-4 border border-border rounded-2xl p-5 hover:border-primary"
              >
                <Phone className="text-primary shrink-0" />
                <div>
                  <p className="font-semibold">Customer support phone</p>
                  <p className="text-sm text-muted-foreground">{site.phone}</p>
                </div>
              </a>
            )}
            {site.whatsapp && (
              <a
                href={`https://wa.me/${site.whatsapp}`}
                className="flex gap-4 border border-border rounded-2xl p-5 hover:border-primary"
              >
                <MessageCircle className="text-primary shrink-0" />
                <div>
                  <p className="font-semibold">WhatsApp</p>
                  <p className="text-sm text-muted-foreground">Message us for order updates</p>
                </div>
              </a>
            )}
            <div className="flex gap-4 border border-border rounded-2xl p-5">
              <Clock className="text-primary shrink-0" />
              <div>
                <p className="font-semibold">Support availability</p>
                <p className="text-sm text-muted-foreground">
                  {site.email
                    ? `${site.supportHours}. We do not promise a reply time.`
                    : "Email us at the address above."}
                </p>
              </div>
            </div>
            <Link
              to="/lab-reports"
              className="flex gap-4 border border-border rounded-2xl p-5 hover:border-primary"
            >
              <FileCheck2 className="text-primary shrink-0" />
              <div>
                <p className="font-semibold">Looking for a certificate?</p>
                <p className="text-sm text-muted-foreground">
                  Search published batch reports by batch number.
                </p>
              </div>
            </Link>
          </aside>
        </div>
      </div>
      <Disclaimer />
    </StoreShell>
  );
}
