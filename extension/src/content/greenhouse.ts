import type { JobData } from "./linkedin";

export function detectGreenhouse(): JobData | null {
  try {
    const titleEl = document.querySelector(".app-title");
    const companyEl = document.querySelector(".company-name");
    const locationEl = document.querySelector(".location");

    if (titleEl) {
      return {
        company:
          companyEl?.textContent?.trim() ||
          new URL(window.location.href).hostname.split(".")[0],
        role: titleEl.textContent?.trim() || "",
        location: locationEl?.textContent?.trim() || "",
        job_url: window.location.href,
        source: "greenhouse",
      };
    }

    return null;
  } catch {
    return null;
  }
}