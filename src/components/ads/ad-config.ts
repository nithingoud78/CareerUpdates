/**
 * Centralized Configuration for Monetag Ads
 */
export const adConfig = {
  // Whether ads are enabled globally. Default to true if VITE_MONETAG_ENABLED is not explicitly "false".
  enabled: import.meta.env.VITE_MONETAG_ENABLED !== "false",
  
  // The global Monetag zone ID. Defaulting to 275042 as per existing script.
  zoneId: import.meta.env.VITE_MONETAG_ZONE_ID || "275042",
  
  // The Monetag script URL.
  scriptUrl: import.meta.env.VITE_MONETAG_SCRIPT_URL || "https://quge5.com/88/tag.min.js",
  
  // Placement toggles
  placements: {
    homeTop: true,
    homeMiddle: true,
    jobsList: true,
    jobDetail: true,
    blogList: true,
    blogDetail: true,
  },
};
