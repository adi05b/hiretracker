import type { JobData } from "./linkedin";

export function detectLever(): JobData | null {
  try {
    const titleEl = document.querySelector(".posting-headline h2");
    const locationEl = document.querySelector(
      ".posting-categories .sort-by-time"
    );
    const companyName =
      new URL(window.location.href).hostname.split(".")[0] || "";

    if (titleEl) {
      return {
        company: companyName.charAt(0).toUpperCase() + companyName.slice(1),
        role: titleEl.textContent?.trim() || "",
        location: locationEl?.textContent?.trim() || "",
        job_url: window.location.href,
        source: "lever",
      };
    }

    return null;
  } catch {
    return null;
  }
}