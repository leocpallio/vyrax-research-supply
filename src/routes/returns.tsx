import { createFileRoute, Link } from "@tanstack/react-router";
import { InfoPage, pageHead } from "@/components/InfoPage";
import { site } from "@/data/site";

export const Route = createFileRoute("/returns")({
  head: () =>
    pageHead(
      "/returns",
      "Returns and Problem Reporting | Vyrax Labs",
      `How returns, cancellations and damaged goods would be handled after an order, including a ${site.returnWindowDays}-day change-of-mind window for eligible items. A saved basket is not an order.`,
    ),
  component: Returns,
});

function Returns() {
  return (
    <InfoPage
      eyebrow="CUSTOMER CARE"
      title="Returns and refunds"
      crumb="Returns"
      updated="2026-10-06"
    >
      <p>
        This page explains what to do if you change your mind or something goes wrong with an order.
        It does not reduce your legal rights under the Consumer Rights Act 2015 and the Consumer
        Contracts Regulations 2013.
      </p>
      <h2>Changing your mind</h2>
      <p>
        You can cancel within {site.returnWindowDays} days of delivery by telling us through the{" "}
        <Link to="/contact">contact page</Link>. You then have a further {site.returnWindowDays}{" "}
        days to send the goods back. Return only unopened, sealed vials. Sealed goods that are
        opened cannot be taken back for health protection reasons, and we may reduce a refund if
        goods have been handled more than needed to inspect them.
      </p>
      <h2>Faulty, damaged or wrong items</h2>
      <p>
        Tell us as soon as you can and include your order number and photos. Keep the packaging and
        the vials until we reply. We will offer a replacement or a refund as the law requires. The{" "}
        {site.returnWindowDays}-day window above does not limit your rights for faulty or wrongly
        described goods.
      </p>
      <h2>Where to send a return</h2>
      <p>
        {site.returnsAddress
          ? `Return address: ${site.returnsAddress}. Contact us first and quote your order number.`
          : "Our returns address is being finalised. Please do not post anything back until we have confirmed an address in writing."}
      </p>
      <h2>Refunds</h2>
      <p>
        Refunds go back to the card you paid with. We refund the standard delivery charge where the
        law requires it, and we do so within the legal time limit after we receive the goods or
        proof that you sent them.
      </p>
      <h2>Research use</h2>
      <p>
        Products are for laboratory research only (see the{" "}
        <Link to="/research-use-policy">research use policy</Link>). We may cancel and refund an
        order if we believe it is not for research.
      </p>
      <h2>How to reach us</h2>
      <p>
        {site.email ? (
          <>
            Email <a href={`mailto:${site.email}`}>{site.email}</a> or use the{" "}
            <Link to="/contact">contact page</Link>. We do not promise a reply time.
          </>
        ) : (
          <>
            Use the <Link to="/contact">contact page</Link>.
          </>
        )}
      </p>
    </InfoPage>
  );
}
