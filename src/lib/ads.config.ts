/**
 * Centralized Advertisement Configuration
 * ========================================
 *
 * Controls whether advertising is enabled across the public website.
 *
 * HOW TO ENABLE ADS (when AdSense is approved):
 * ------------------------------------------------
 * 1. Add to .env:
 *      VITE_ADSENSE_PUBLISHER_ID=ca-pub-XXXXXXXXXXXXXXXX
 *      VITE_ADSENSE_SLOT_DEFAULT=XXXXXXXXXX        (optional default slot)
 *
 * 2. Set adsEnabled = true below.
 *
 * 3. Set adProvider = "google_adsense".
 *
 * The AdSlot component reads this config and renders nothing while adsEnabled
 * is false. No ad scripts are loaded, no placeholders are shown.
 *
 * IMPORTANT:
 * - Keep adsEnabled = false until a real ad provider is approved and configured.
 * - Do NOT show placeholders or empty containers while adsEnabled is false.
 * - The /admin section must never render ads regardless of this config.
 * - Do not load third-party scripts while adsEnabled is false (performance).
 */

export type AdProvider = "none" | "google_adsense" | "alternative_network";

export interface AdsConfig {
  /**
   * Master switch — set to true only when a real ad provider is configured.
   * While false, AdSlot renders nothing (no placeholder, no empty box, no script).
   */
  adsEnabled: boolean;

  /**
   * The ad network to use when adsEnabled is true.
   * "none"               → render nothing (same as adsEnabled=false)
   * "google_adsense"     → use AdSense publisher ID from env
   * "alternative_network"→ placeholder for future providers
   */
  adProvider: AdProvider;
}

export const adsConfig: AdsConfig = {
  // ─── CURRENTLY DISABLED ───────────────────────────────────────────────────
  // Ads are OFF. The public website shows no advertisement UI of any kind.
  // Change to true + configure adProvider when an ad network is approved.
  adsEnabled: false,

  adProvider: "none",
};
