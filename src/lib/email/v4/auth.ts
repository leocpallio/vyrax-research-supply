// Vyrax v4 auth emails: Supabase auth email templates in the card-inset look.
//
// Vyrax uses Supabase Auth on /account (signUp and signInWithPassword), so these are the
// templates to paste into Supabase (Authentication > Email Templates) or serve from a send-auth-email hook.
// Render only. Nothing here sends mail. Supabase Go-template placeholders such as
// {{ .ConfirmationURL }} are left as literal text for Supabase to fill in.
import { SITE_URL } from "../../../data/site";
import { SUPPORT_EMAIL, button, escapeHtml, wrap, type RenderedEmail } from "../templates";

export type AuthTemplateId =
  | "confirm-signup"
  | "magic-link"
  | "reset-password"
  | "email-change"
  | "invite"
  | "reauthentication"
  | "recovery";

export type AuthTemplate = RenderedEmail & { id: AuthTemplateId; placeholders: string[] };

export const CONFIRMATION_URL = "{{ .ConfirmationURL }}";
export const TOKEN = "{{ .Token }}";
export const EMAIL = "{{ .Email }}";
export const NEW_EMAIL = "{{ .NewEmail }}";

// templates.ts button() and link() only accept real store URLs, so the render uses a store-origin
// sentinel and swaps it for the literal Supabase placeholder afterwards.
const SENTINEL = `${SITE_URL}/__CONFIRMATION_URL__`;
const BRAND = "Vyrax Labs";
const NEVER_ASK = "We will never ask for your password or payment details by email.";

const linkBlock = (label: string) => ({
  html: `${button(label, SENTINEL)}<div class="mute" style="margin:0 0 24px;font-size:12.5px;line-height:1.6;color:#6B7688">If the button does not work, paste this link into your browser:<br><span class="tx" style="color:#14213D;word-break:break-all;overflow-wrap:anywhere">${escapeHtml(SENTINEL)}</span></div>`,
  text: [`${label}: ${SENTINEL}`],
});

const codeBlock = {
  html: `<div class="tint rule" style="margin:0 0 24px;padding:20px 12px;background:#EEF2F9;border:1px solid #E1E6EF;border-radius:14px;text-align:center"><div class="mute" style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#4A5568;margin:0 0 8px">Confirmation code</div><div class="tx" style="font-family:'SF Mono',Menlo,Consolas,monospace;font-size:26px;line-height:1.2;font-weight:700;letter-spacing:.16em;color:#14213D;word-break:break-all">${escapeHtml(TOKEN)}</div></div>`,
  text: [`Confirmation code: ${TOKEN}`],
};

type Spec = {
  id: AuthTemplateId;
  subject: string;
  heading: string;
  preheader: string;
  paragraphs: string[];
  label?: string; // button label; absent for the code email
  lines: string[];
};

const specs: Spec[] = [
  {
    id: "confirm-signup",
    subject: `Confirm your ${BRAND} account`,
    heading: "Confirm your email",
    preheader: "One tap to confirm your email address.",
    paragraphs: [
      "Hello,",
      `Thanks for creating a ${BRAND} account. Press the button to confirm your email address. After that you can sign in and see your orders.`,
      "The link works once and expires soon. If you did not sign up, ignore this email and nothing will happen.",
    ],
    label: "Confirm email",
    lines: [NEVER_ASK],
  },
  {
    id: "magic-link",
    subject: `Your ${BRAND} sign-in link`,
    heading: "Sign in to Vyrax Labs",
    preheader: "Your one-time sign-in link is inside.",
    paragraphs: [
      "Hello,",
      "Press the button to sign in. The link works once and expires soon.",
      "If you did not ask for it, ignore this email. Nobody can sign in without the link.",
    ],
    label: "Sign in",
    lines: [NEVER_ASK],
  },
  {
    id: "reset-password",
    subject: `Reset your ${BRAND} password`,
    heading: "Choose a new password",
    preheader: "Use the link to set a new password.",
    paragraphs: [
      "Hello,",
      `We got a request to reset the password on your ${BRAND} account. Press the button to choose a new one.`,
      "The link works once and expires soon. If you did not ask for this, ignore this email. Your password stays as it is.",
    ],
    label: "Choose new password",
    lines: [NEVER_ASK],
  },
  {
    id: "email-change",
    subject: `Confirm your new ${BRAND} email`,
    heading: "Confirm your new email",
    preheader: "Confirm the email change on your account.",
    paragraphs: [
      "Hello,",
      `We got a request to change the email on your ${BRAND} account from ${EMAIL} to ${NEW_EMAIL}. Press the button to confirm.`,
      `The link works once and expires soon. If you did not ask for this, email ${SUPPORT_EMAIL} straight away.`,
    ],
    label: "Confirm new email",
    lines: [NEVER_ASK],
  },
  {
    id: "invite",
    subject: `You are invited to ${BRAND}`,
    heading: "You are invited",
    preheader: "Accept the invitation and set a password.",
    paragraphs: [
      "Hello,",
      `You have been invited to create a ${BRAND} account. Press the button to accept and set your password.`,
      "If you were not expecting this invitation, you can ignore this email.",
    ],
    label: "Accept invitation",
    lines: [NEVER_ASK],
  },
  {
    id: "reauthentication",
    subject: `Your ${BRAND} confirmation code`,
    heading: "Your confirmation code",
    preheader: "Enter this code to confirm the change.",
    paragraphs: [
      "Hello,",
      `Enter this code to confirm the change you are making on your ${BRAND} account.`,
    ],
    lines: [
      "The code expires in a few minutes. If you did not ask for it, ignore this email and do not share the code with anyone.",
      "We will never ask for the code by email, phone or message.",
    ],
  },
  {
    id: "recovery",
    subject: `Recover your ${BRAND} account`,
    heading: "Get back into your account",
    preheader: "Use the link to recover access.",
    paragraphs: [
      "Hello,",
      `Press the button to recover access to your ${BRAND} account and set a new password.`,
      "The link works once and expires soon. If you did not ask for this, ignore this email.",
    ],
    label: "Recover account",
    lines: [NEVER_ASK],
  },
];

function build(spec: Spec): AuthTemplate {
  const code = spec.id === "reauthentication";
  const mail = wrap({
    heading: spec.heading,
    preheader: spec.preheader,
    subject: spec.subject,
    paragraphs: spec.paragraphs,
    detail: code || !spec.label ? codeBlock : linkBlock(spec.label),
    lines: spec.lines,
  });
  const swap = (s: string) => s.split(SENTINEL).join(CONFIRMATION_URL);
  return {
    id: spec.id,
    subject: mail.subject,
    html: swap(mail.html),
    text: swap(mail.text),
    placeholders: code
      ? [TOKEN]
      : spec.id === "email-change"
        ? [CONFIRMATION_URL, EMAIL, NEW_EMAIL]
        : [CONFIRMATION_URL],
  };
}

export function authTemplates(): AuthTemplate[] {
  return specs.map(build);
}

export function authTemplate(id: AuthTemplateId): AuthTemplate {
  const spec = specs.find((s) => s.id === id);
  if (!spec) throw new Error(`Unknown auth template: ${id}`);
  return build(spec);
}
