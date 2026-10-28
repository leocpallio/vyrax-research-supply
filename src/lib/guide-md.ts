import { guides, type Block, type Guide } from "../data/guides";
import { SITE_URL } from "../data/site";

const RUO = "Research compounds, not a licensed medicine. No dose is on the label.";

function block(b: Block): string {
  switch (b.type) {
    case "h":
      return `## ${b.text}\n`;
    case "p":
      return `${b.text}\n`;
    case "note":
      return `> ${b.text}\n`;
    case "list":
      return b.items.map((it, i) => (b.ordered ? `${i + 1}. ${it}` : `- ${it}`)).join("\n") + "\n";
    case "table":
      return (
        [
          `| ${b.head.join(" | ")} |`,
          `| ${b.head.map(() => "---").join(" | ")} |`,
          ...b.rows.map((r) => `| ${r.join(" | ")} |`),
        ].join("\n") + "\n"
      );
  }
}

/** Markdown twin of a guide page, with YAML frontmatter. */
export function buildGuideMd(g: Guide): string {
  const fm = [
    "---",
    `title: "${g.title.replace(/"/g, '\\"')}"`,
    `description: "${g.description.replace(/"/g, '\\"')}"`,
    `published: ${g.published ?? g.updated}`,
    `updated: ${g.updated}`,
    ...(g.changed ? [`changed: "${g.changed.replace(/"/g, '\\"')}"`] : []),
    `canonical: ${SITE_URL}/guides/${g.slug}`,
    `research_use_only: false`,
    "---",
    "",
  ];
  return [
    ...fm,
    `# ${g.title}`,
    "",
    g.description,
    "",
    ...g.body.map(block),
    "---",
    "",
    RUO,
    "",
    `Source: ${SITE_URL}/guides/${g.slug}`,
    "",
  ].join("\n");
}

export const guideMdBySlug = (slug: string) => {
  const g = guides.find((x) => x.slug === slug);
  return g ? buildGuideMd(g) : null;
};
