export interface JobData {
    company: string;
    role: string;
    location: string;
    job_url: string;
    source: string;
  }
  
  export function detectLinkedIn(): JobData | null {
    try {
      // Try JSON-LD first (most reliable)
      const jsonLdScripts = document.querySelectorAll(
        'script[type="application/ld+json"]'
      );
      for (const script of jsonLdScripts) {
        try {
          const data = JSON.parse(script.textContent || "");
          if (data["@type"] === "JobPosting") {
            return {
              company:
                typeof data.hiringOrganization === "object"
                  ? data.hiringOrganization.name
                  : data.hiringOrganization || "",
              role: data.title || "",
              location:
                typeof data.jobLocation === "object"
                  ? data.jobLocation.address?.addressLocality || ""
                  : "",
              job_url: window.location.href,
              source: "linkedin",
            };
          }
        } catch {
          continue;
        }
      }
  
      // Fallback: scrape from DOM
      const titleEl = document.querySelector(
        ".job-details-jobs-unified-top-card__job-title, .jobs-unified-top-card__job-title, .t-24.job-details-jobs-unified-top-card__job-title"
      );
      const companyEl = document.querySelector(
        ".job-details-jobs-unified-top-card__company-name, .jobs-unified-top-card__company-name"
      );
      const locationEl = document.querySelector(
        ".job-details-jobs-unified-top-card__bullet, .jobs-unified-top-card__bullet"
      );
  
      if (titleEl && companyEl) {
        return {
          company: companyEl.textContent?.trim() || "",
          role: titleEl.textContent?.trim() || "",
          location: locationEl?.textContent?.trim() || "",
          job_url: window.location.href,
          source: "linkedin",
        };
      }
  
      return null;
    } catch {
      return null;
    }
  }