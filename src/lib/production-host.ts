// Exact public storefront hosts. Preview, localhost and the workers.dev debug host are test traffic.
export function isProductionHost(hostname: string): boolean {
  return hostname === "vyraxlabs.co.uk" || hostname === "www.vyraxlabs.co.uk";
}

export function checkoutIsTestMode(
  mode: string | undefined,
  requestUrl: string,
  configuredOrigin: string,
): boolean {
  return (
    mode === "test" ||
    !isProductionHost(new URL(requestUrl).hostname) ||
    !isProductionHost(new URL(configuredOrigin).hostname)
  );
}
