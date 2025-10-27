const ROOT_URL =
  process.env.NEXT_PUBLIC_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

/**
 * MiniApp configuration object. Must follow the Farcaster MiniApp specification.
 *
 * @see {@link https://miniapps.farcaster.xyz/docs/guides/publishing}
 */
export const minikitConfig = {
  accountAssociation: {
    header: "",
    payload: "",
    signature: "",
  },
  miniapp: {
    version: "1",
    name: "Fhenix MiniApp Demo",
    subtitle: "Confidential Computing on Chain",
    description: "Experience Fully Homomorphic Encryption powered dApps",
    screenshotUrls: [`${ROOT_URL}/screenshot-portrait.png`],
    iconUrl: `${ROOT_URL}/blue-icon.png`,
    splashImageUrl: `${ROOT_URL}/blue-hero.png`,
    splashBackgroundColor: "#07080A",
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,
    primaryCategory: "social",
    tags: ["fhenix", "fhe", "encryption", "privacy", "defi"],
    heroImageUrl: `${ROOT_URL}/blue-hero.png`,
    tagline: "Building the Future of Private DeFi",
    ogTitle: "Fhenix MiniApp Demo",
    ogDescription:
      "Experience confidential computing powered by Fully Homomorphic Encryption",
    ogImageUrl: `${ROOT_URL}/blue-hero.png`,
  },
} as const;
