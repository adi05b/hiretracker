interface JobData {
  company: string;
  role: string;
  location: string;
  job_url: string;
  source: string;
  status?: string;
  salary_text?: string;
  job_description?: string;
}

function injectStyles() {
  if (document.getElementById("hiretrack-styles")) return;
  const style = document.createElement("style");
  style.id = "hiretrack-styles";
  style.textContent = `
    #hiretrack-badge { position:fixed; bottom:80px; right:24px; z-index:999999; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; }
    .hiretrack-badge-content { background:white; border-radius:12px; box-shadow:0 4px 24px rgba(0,0,0,0.15); padding:16px; width:280px; border:1px solid #e5e7eb; }
    .hiretrack-badge-header { display:flex; align-items:center; gap:8px; margin-bottom:12px; }
    .hiretrack-badge-logo { background:#4f46e5; color:white; width:28px; height:28px; border-radius:6px; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:14px; }
    .hiretrack-badge-title { font-weight:600; font-size:14px; color:#111827; }
    .hiretrack-badge-close { margin-left:auto; background:none; border:none; font-size:20px; color:#9ca3af; cursor:pointer; padding:0 4px; }
    .hiretrack-badge-close:hover { color:#111827; }
    .hiretrack-badge-info { font-size:13px; color:#6b7280; margin:2px 0; }
    .hiretrack-badge-info strong { color:#111827; }
    .hiretrack-badge-salary { font-size:12px; color:#059669; font-weight:500; margin-top:4px; }
    .hiretrack-badge-status-label { font-size:12px; font-weight:600; margin-top:10px; text-align:center; padding:5px 0; border-radius:6px; }
    .hiretrack-status-new { background:#f3f4f6; color:#6b7280; }
    .hiretrack-status-wishlist { background:#eef2ff; color:#4f46e5; }
    .hiretrack-status-applied { background:#f0fdf4; color:#16a34a; }
    .hiretrack-btn-row { display:flex; gap:6px; margin-top:10px; }
    .hiretrack-btn { flex:1; padding:8px 10px; border-radius:8px; font-size:13px; font-weight:500; cursor:pointer; border:none; transition:all 0.15s; }
    .hiretrack-btn:disabled { opacity:0.5; cursor:not-allowed; }
    .hiretrack-btn-wishlist { background:#4f46e5; color:white; }
    .hiretrack-btn-wishlist:hover { background:#4338ca; }
    .hiretrack-btn-applied { background:#16a34a; color:white; }
    .hiretrack-btn-applied:hover { background:#15803d; }
    .hiretrack-badge-msg { font-size:12px; text-align:center; margin-top:8px; }
    .hiretrack-badge-source { display:inline-block; font-size:10px; color:#6b7280; background:#f3f4f6; padding:2px 6px; border-radius:4px; margin-top:6px; }
  `;
  document.head.appendChild(style);
}

// ─── LINKEDIN ───────────────────────────────────────────────────────────────

function detectLinkedIn(): JobData | null {
  try {
    let salaryText = "";
    const salaryEl = document.querySelector(".job-details-jobs-unified-top-card__job-insight--highlight, .salary-main-rail__data-body");
    if (salaryEl) salaryText = salaryEl.textContent?.trim() || "";
    if (!salaryText) {
      const pills = document.querySelectorAll(".job-details-jobs-unified-top-card__job-insight span");
      for (const pill of pills) {
        const text = pill.textContent?.trim() || "";
        if (text.includes("$") || text.includes("/yr") || text.includes("/hr")) { salaryText = text; break; }
      }
    }

    let jobDescription = "";
    const descEl = document.querySelector(".jobs-description__content, .jobs-box__html-content, .jobs-description-content__text");
    if (descEl) jobDescription = descEl.textContent?.trim().substring(0, 5000) || "";

    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of scripts) {
      try {
        const data = JSON.parse(script.textContent || "");
        if (data["@type"] === "JobPosting") {
          if (!salaryText && data.baseSalary) {
            const sal = data.baseSalary;
            if (sal.value) salaryText = `${sal.currency || "$"} ${sal.value.minValue || ""}–${sal.value.maxValue || ""} ${sal.value.unitText || ""}`;
          }
          if (!jobDescription && data.description) jobDescription = data.description.replace(/<[^>]*>/g, " ").substring(0, 5000);
          return {
            company: typeof data.hiringOrganization === "object" ? data.hiringOrganization.name : data.hiringOrganization || "",
            role: data.title || "",
            location: typeof data.jobLocation === "object" ? data.jobLocation.address?.addressLocality || "" : "",
            job_url: window.location.href, source: "linkedin", salary_text: salaryText, job_description: jobDescription,
          };
        }
      } catch { continue; }
    }

    const titleEl = document.querySelector(".job-details-jobs-unified-top-card__job-title, .jobs-unified-top-card__job-title, .t-24");
    const companyEl = document.querySelector(".job-details-jobs-unified-top-card__company-name, .jobs-unified-top-card__company-name");
    const locationEl = document.querySelector(".job-details-jobs-unified-top-card__bullet, .jobs-unified-top-card__bullet");
    if (titleEl && companyEl) {
      return {
        company: companyEl.textContent?.trim() || "", role: titleEl.textContent?.trim() || "",
        location: locationEl?.textContent?.trim() || "", job_url: window.location.href,
        source: "linkedin", salary_text: salaryText, job_description: jobDescription,
      };
    }
    return null;
  } catch { return null; }
}

// ─── GREENHOUSE ─────────────────────────────────────────────────────────────

function detectGreenhouse(): JobData | null {
  try {
    const titleEl = document.querySelector(".app-title");
    const companyEl = document.querySelector(".company-name");
    const locationEl = document.querySelector(".location");
    const descEl = document.querySelector("#content");
    if (titleEl) {
      return {
        company: companyEl?.textContent?.trim() || new URL(window.location.href).hostname.split(".")[0],
        role: titleEl.textContent?.trim() || "", location: locationEl?.textContent?.trim() || "",
        job_url: window.location.href, source: "greenhouse",
        job_description: descEl?.textContent?.trim().substring(0, 5000) || "",
      };
    }
    return null;
  } catch { return null; }
}

// ─── LEVER ──────────────────────────────────────────────────────────────────

function detectLever(): JobData | null {
  try {
    const titleEl = document.querySelector(".posting-headline h2");
    const locationEl = document.querySelector(".posting-categories .sort-by-time");
    const companyName = new URL(window.location.href).pathname.split("/")[1] || "";
    const descEl = document.querySelector(".section-wrapper.page-full-width");
    if (titleEl) {
      return {
        company: companyName.charAt(0).toUpperCase() + companyName.slice(1),
        role: titleEl.textContent?.trim() || "", location: locationEl?.textContent?.trim() || "",
        job_url: window.location.href, source: "lever",
        job_description: descEl?.textContent?.trim().substring(0, 5000) || "",
      };
    }
    return null;
  } catch { return null; }
}

// ─── INDEED ─────────────────────────────────────────────────────────────────

function detectIndeed(): JobData | null {
  try {
    // Try JSON-LD first
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of scripts) {
      try {
        const data = JSON.parse(script.textContent || "");
        if (data["@type"] === "JobPosting") {
          const org = data.hiringOrganization || {};
          const loc = data.jobLocation?.[0]?.address || data.jobLocation?.address || {};
          let salaryText = "";
          if (data.baseSalary?.value) {
            const s = data.baseSalary;
            salaryText = `${s.currency || "$"} ${s.value.minValue || ""}–${s.value.maxValue || ""} ${s.value.unitText || ""}`;
          }
          return {
            company: typeof org === "object" ? org.name || "" : String(org),
            role: data.title || "",
            location: [loc.addressLocality, loc.addressRegion].filter(Boolean).join(", "),
            job_url: window.location.href, source: "indeed",
            salary_text: salaryText,
            job_description: (data.description || "").replace(/<[^>]*>/g, " ").substring(0, 5000),
          };
        }
      } catch { continue; }
    }

    // DOM fallback
    const titleEl = document.querySelector(".jobsearch-JobInfoHeader-title, h1[data-testid='jobsearch-JobInfoHeader-title'], .icl-u-xs-mb--xs");
    const companyEl = document.querySelector("[data-testid='inlineHeader-companyName'], .jobsearch-InlineCompanyRating-companyHeader, .icl-u-lg-mr--sm");
    const locationEl = document.querySelector("[data-testid='inlineHeader-companyLocation'], .jobsearch-JobInfoHeader-subtitle > div:nth-child(2), .icl-u-xs-mt--xs");
    const salaryEl = document.querySelector("#salaryInfoAndJobType, .jobsearch-JobMetadataHeader-item");
    const descEl = document.querySelector("#jobDescriptionText, .jobsearch-jobDescriptionText");

    if (titleEl) {
      return {
        company: companyEl?.textContent?.trim() || "",
        role: titleEl.textContent?.trim() || "",
        location: locationEl?.textContent?.trim() || "",
        job_url: window.location.href, source: "indeed",
        salary_text: salaryEl?.textContent?.trim() || "",
        job_description: descEl?.textContent?.trim().substring(0, 5000) || "",
      };
    }
    return null;
  } catch { return null; }
}

// ─── GLASSDOOR ──────────────────────────────────────────────────────────────

function detectGlassdoor(): JobData | null {
  try {
    const titleEl = document.querySelector("[data-test='job-title'], .job-title, h1");
    const companyEl = document.querySelector("[data-test='employerName'], .employer-name, .css-87uc0g");
    const locationEl = document.querySelector("[data-test='location'], .location, .css-56kyx5");
    const salaryEl = document.querySelector("[data-test='detailSalary'], .salary-estimate, .css-1bluz6i");
    const descEl = document.querySelector(".jobDescriptionContent, [data-test='jobDescription'], .desc");

    if (titleEl) {
      return {
        company: companyEl?.textContent?.trim().replace(/[\d.★]+$/, "").trim() || "",
        role: titleEl.textContent?.trim() || "",
        location: locationEl?.textContent?.trim() || "",
        job_url: window.location.href, source: "glassdoor",
        salary_text: salaryEl?.textContent?.trim() || "",
        job_description: descEl?.textContent?.trim().substring(0, 5000) || "",
      };
    }
    return null;
  } catch { return null; }
}

// ─── HANDSHAKE ──────────────────────────────────────────────────────────────

function detectHandshake(): JobData | null {
  try {
    const titleEl = document.querySelector("h1, [data-hook='job-title'], .style__title___");
    const companyEl = document.querySelector("[data-hook='employer-name'], a[href*='/employers/'], .style__employer___");
    const locationEl = document.querySelector("[data-hook='job-location'], .style__location___");
    const descEl = document.querySelector("[data-hook='job-description'], .style__description___");

    if (titleEl && companyEl) {
      return {
        company: companyEl.textContent?.trim() || "",
        role: titleEl.textContent?.trim() || "",
        location: locationEl?.textContent?.trim() || "",
        job_url: window.location.href, source: "handshake",
        job_description: descEl?.textContent?.trim().substring(0, 5000) || "",
      };
    }
    return null;
  } catch { return null; }
}

// ─── WORKDAY ────────────────────────────────────────────────────────────────

function detectWorkday(): JobData | null {
  try {
    // Workday uses dynamic rendering, try multiple selectors
    const titleEl = document.querySelector("[data-automation-id='jobPostingHeader'] h2, .css-1q2dra3, h2[data-automation-id='header']");
    const companyEl = document.querySelector("[data-automation-id='jobPostingHeader'] .css-1t5f0fr, dd[data-automation-id='company']");
    const locationEl = document.querySelector("[data-automation-id='locations'], dd[data-automation-id='location'], .css-cygeeu");
    const descEl = document.querySelector("[data-automation-id='jobPostingDescription'], .css-pzqv0e");

    // Fallback: get company from subdomain (company.myworkdayjobs.com)
    let company = companyEl?.textContent?.trim() || "";
    if (!company) {
      const hostname = window.location.hostname;
      const parts = hostname.split(".");
      if (parts.length > 2) {
        company = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
      }
    }

    if (titleEl) {
      return {
        company: company,
        role: titleEl.textContent?.trim() || "",
        location: locationEl?.textContent?.trim() || "",
        job_url: window.location.href, source: "workday",
        job_description: descEl?.textContent?.trim().substring(0, 5000) || "",
      };
    }
    return null;
  } catch { return null; }
}

// ─── SIMPLYHIRED ────────────────────────────────────────────────────────────

function detectSimplyHired(): JobData | null {
  try {
    const titleEl = document.querySelector("h1[data-testid='viewJobTitle'], h2.viewjob-jobTitle, h1");
    const companyEl = document.querySelector("[data-testid='viewJobCompanyName'], .viewjob-labelWithIcon, .jobposting-company");
    const locationEl = document.querySelector("[data-testid='viewJobCompanyLocation'], .viewjob-labelWithIcon:nth-child(2), .jobposting-location");
    const salaryEl = document.querySelector("[data-testid='viewJobBodyJobCompensation'], .viewjob-salary");
    const descEl = document.querySelector("[data-testid='viewJobBody'], .viewjob-jobDescription");

    if (titleEl) {
      return {
        company: companyEl?.textContent?.trim() || "",
        role: titleEl.textContent?.trim() || "",
        location: locationEl?.textContent?.trim() || "",
        job_url: window.location.href, source: "simplyhired",
        salary_text: salaryEl?.textContent?.trim() || "",
        job_description: descEl?.textContent?.trim().substring(0, 5000) || "",
      };
    }
    return null;
  } catch { return null; }
}

// ─── MAIN DETECT ────────────────────────────────────────────────────────────

function detect(): JobData | null {
  const url = window.location.href;
  if (url.includes("linkedin.com")) return detectLinkedIn();
  if (url.includes("greenhouse.io")) return detectGreenhouse();
  if (url.includes("lever.co")) return detectLever();
  if (url.includes("indeed.com")) return detectIndeed();
  if (url.includes("glassdoor.com")) return detectGlassdoor();
  if (url.includes("joinhandshake.com")) return detectHandshake();
  if (url.includes("myworkdayjobs.com")) return detectWorkday();
  if (url.includes("simplyhired.com")) return detectSimplyHired();
  return null;
}

// ─── BADGE (unchanged) ─────────────────────────────────────────────────────

function createBadge(jobData: JobData, existingStatus: string | null, existingId: number | null) {
  if (document.getElementById("hiretrack-badge")) return;

  const badge = document.createElement("div");
  badge.id = "hiretrack-badge";

  let statusHtml = "";
  let buttonsHtml = "";
  const salaryLine = jobData.salary_text
    ? `<p class="hiretrack-badge-salary">${jobData.salary_text}</p>`
    : `<p class="hiretrack-badge-salary" style="color:#9ca3af;">Salary: Not disclosed</p>`;

  const sourceBadge = `<span class="hiretrack-badge-source">${jobData.source}</span>`;

  if (existingStatus === null) {
    statusHtml = `<div class="hiretrack-badge-status-label hiretrack-status-new">Not Saved</div>`;
    buttonsHtml = `
      <div class="hiretrack-btn-row">
        <button class="hiretrack-btn hiretrack-btn-wishlist" id="hiretrack-btn-wishlist">Wishlist</button>
        <button class="hiretrack-btn hiretrack-btn-applied" id="hiretrack-btn-applied">Applied</button>
      </div>`;
  } else if (existingStatus === "applied") {
    statusHtml = `<div class="hiretrack-badge-status-label hiretrack-status-applied">Already Applied</div>`;
    buttonsHtml = "";
  } else if (existingStatus === "wishlist") {
    statusHtml = `<div class="hiretrack-badge-status-label hiretrack-status-wishlist">In Wishlist</div>`;
    buttonsHtml = `
      <div class="hiretrack-btn-row">
        <button class="hiretrack-btn hiretrack-btn-applied" id="hiretrack-btn-applied" style="flex:1;">Mark Applied</button>
      </div>`;
  } else {
    statusHtml = `<div class="hiretrack-badge-status-label hiretrack-status-applied">Status: ${existingStatus}</div>`;
    buttonsHtml = "";
  }

  badge.innerHTML = `
    <div class="hiretrack-badge-content">
      <div class="hiretrack-badge-header">
        <span class="hiretrack-badge-logo">H</span>
        <span class="hiretrack-badge-title">HireTrack</span>
        <button class="hiretrack-badge-close" id="hiretrack-close">&times;</button>
      </div>
      <p class="hiretrack-badge-info"><strong>${jobData.role}</strong></p>
      <p class="hiretrack-badge-info">${jobData.company} &bull; ${jobData.location}</p>
      ${salaryLine}
      ${sourceBadge}
      ${statusHtml}
      ${buttonsHtml}
      <div class="hiretrack-badge-msg" id="hiretrack-msg"></div>
    </div>
  `;

  document.body.appendChild(badge);

  if (existingStatus === null) {
    const saveWith = (status: string) => {
      const msg = document.getElementById("hiretrack-msg")!;
      const btn1 = document.getElementById("hiretrack-btn-wishlist") as HTMLButtonElement;
      const btn2 = document.getElementById("hiretrack-btn-applied") as HTMLButtonElement;
      btn1.disabled = true;
      btn2.disabled = true;

      chrome.runtime.sendMessage(
        { type: "SAVE_JOB", payload: { ...jobData, status } },
        (response) => {
          if (response?.success) {
            msg.textContent = status === "applied" ? "Marked as applied!" : "Added to wishlist!";
            msg.style.color = "#16a34a";
            setTimeout(() => {
              badge.remove();
              createBadge(jobData, status, response.data.id);
            }, 1000);
          } else {
            msg.textContent = response?.error || "Failed to save";
            msg.style.color = "#ef4444";
            btn1.disabled = false;
            btn2.disabled = false;
          }
        }
      );
    };

    document.getElementById("hiretrack-btn-wishlist")?.addEventListener("click", () => saveWith("wishlist"));
    document.getElementById("hiretrack-btn-applied")?.addEventListener("click", () => saveWith("applied"));
  }

  if (existingStatus === "wishlist" && existingId) {
    document.getElementById("hiretrack-btn-applied")?.addEventListener("click", () => {
      const msg = document.getElementById("hiretrack-msg")!;
      const btn = document.getElementById("hiretrack-btn-applied") as HTMLButtonElement;
      btn.disabled = true;

      chrome.runtime.sendMessage(
        { type: "UPDATE_STATUS", id: existingId, status: "applied" },
        (response) => {
          if (response?.success) {
            msg.textContent = "Marked as applied!";
            msg.style.color = "#16a34a";
            setTimeout(() => {
              badge.remove();
              createBadge(jobData, "applied", existingId);
            }, 1000);
          } else {
            msg.textContent = "Failed to update";
            msg.style.color = "#ef4444";
            btn.disabled = false;
          }
        }
      );
    });
  }

  document.getElementById("hiretrack-close")?.addEventListener("click", () => {
    badge.remove();
  });
}

// ─── INIT ───────────────────────────────────────────────────────────────────

function init() {
  injectStyles();
  const jobData = detect();
  if (jobData && jobData.company && jobData.role) {
    chrome.runtime.sendMessage(
      { type: "CHECK_JOB", url: jobData.job_url, company: jobData.company, role: jobData.role },
      (response) => {
        if (response?.exists) {
          createBadge(jobData, response.status, response.id);
        } else {
          createBadge(jobData, null, null);
        }
      }
    );
  }
}

let lastUrl = window.location.href;
const observer = new MutationObserver(() => {
  if (window.location.href !== lastUrl) {
    lastUrl = window.location.href;
    document.getElementById("hiretrack-badge")?.remove();
    setTimeout(init, 2000);
  }
});

observer.observe(document.body, { childList: true, subtree: true });

setTimeout(init, 2000);