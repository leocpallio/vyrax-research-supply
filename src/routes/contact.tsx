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
    topic: topics[0] ?? "",
    message: "",
  });
  const [sent, setSent] = useState(false);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!site.email) return;
    const subject = `${f.topic}${f.order ? ` (order ${f.order})` : ""}`;
    const body = `${f.message}\n\nName: ${f.name}\nEmail: ${f.email}${f.order ? `\nOrder: ${f.order}` : ""}`;
    window.location.href = `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
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
            <form onSubmit={submit} className="space-y-5 max-w-2xl">
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="block text-sm font-semibold">
                  Name
                  <Input
                    required
                    className="mt-2"
                    value={f.name}
                    onChange={(e) => setF({ ...f, name: e.target.value })}
                  />
                </label>
                <label className="block text-sm font-semibold">
                  Email
                  <Input
                    required
                    type="email"
                    className="mt-2"
                    value={f.email}
                    onChange={(e) => setF({ ...f, email: e.target.value })}
                  />
                </label>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="block text-sm font-semibold">
                  Topic
                  <select
                    className="mt-2 w-full h-9 border border-border rounded-md px-3 bg-background text-sm"
                    value={f.topic}
                    onChange={(e) => setF({ ...f, topic: e.target.value })}
                  >
                    {topics.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-semibold">
                  Order number (optional)
                  <Input
                    className="mt-2"
                    value={f.order}
                    onChange={(e) => setF({ ...f, order: e.target.value })}
                  />
                </label>
              </div>
              <label className="block text-sm font-semibold">
                Message
                <Textarea
                  required
                  minLength={10}
                  rows={6}
                  className="mt-2"
                  value={f.message}
                  onChange={(e) => setF({ ...f, message: e.target.value })}
                />
              </label>
              <Button className="rounded-full h-11 px-7">Send message</Button>
              {sent && (
                <p role="status" className="text-sm">
                  Your email app should now open with the message ready. Press send there to deliver
                  it.
                </p>
              )}
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
