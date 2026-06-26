/**
 * GoogleAnalytics — reads VITE_GA_MEASUREMENT_ID from env.
 *
 * If the env variable is missing, this component renders nothing.
 * No hardcoded IDs — safe to commit to source control.
 *
 * Usage: Place <GoogleAnalytics /> inside <RootShell> in __root.tsx
 */

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;

export function GoogleAnalytics() {
  if (!GA_ID) return null;

  return (
    <>
      <script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
      />
      <script
        dangerouslySetInnerHTML={{
          __html: `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}', {
  page_path: window.location.pathname,
  send_page_view: true
});
          `.trim(),
        }}
      />
    </>
  );
}
