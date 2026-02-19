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
  `;
  document.head.appendChild(style);
}

function detectLinkedIn(): JobData | null {
  try {
    // Grab salary text from the page
    let salaryText = "";
    const salaryEl = document.querySelector(".job-details-jobs-unified-top-card__job-insight--highlight, .salary-main-rail__data-body");
    if (salaryEl) {
      salaryText = salaryEl.textContent?.trim() || "";
    }
    // Fallback: look for salary in the insight pills
    if (!salaryText) {
      const pills = document.querySelectorAll(".job-details-jobs-unified-top-card__job-insight span");
      for (const pill of pills) {
        const text = pill.textContent?.trim() || "";
        if (text.includes("$") || text.includes("/yr") || text.includes("/hr")) {
          salaryText = text;
          break;
        }
      }
    }

    // Grab job description
    let jobDescription = "";
    const descEl = document.querySelector(".jobs-description__content, .jobs-box__html-content, .jobs-description-content__text");
    if (descEl) {
      jobDescription = descEl.textContent?.trim().substring(0, 5000) || "";
    }

    // Try JSON-LD first
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of scripts) {
      try {
        const data = JSON.parse(script.textContent || "");
        if (data["@type"] === "JobPosting") {
          if (!salaryText && data.baseSalary) {
            const sal = data.baseSalary;
            if (sal.value) {
              salaryText = `${sal.currency || "$"} ${sal.value.minValue || ""}–${sal.value.maxValue || ""} ${sal.value.unitText || ""}`;
            }
          }
          if (!jobDescription && data.description) {
            jobDescription = data.description.replace(/<[^>]*>/g, " ").substring(0, 5000);
          }
          return {
            company: typeof data.hiringOrganization === "object" ? data.hiringOrganization.name : data.hiringOrganization || "",
            role: data.title || "",
            location: typeof data.jobLocation === "object" ? data.jobLocation.address?.addressLocality || "" : "",
            job_url: window.location.href,
            source: "linkedin",
            salary_text: salaryText,
            job_description: jobDescription,
          };
        }
      } catch { continue; }
    }

    // Fallback: DOM scraping
    const titleEl = document.querySelector(".job-details-jobs-unified-top-card__job-title, .jobs-unified-top-card__job-title, .t-24");
    const companyEl = document.querySelector(".job-details-jobs-unified-top-card__company-name, .jobs-unified-top-card__company-name");
    const locationEl = document.querySelector(".job-details-jobs-unified-top-card__bullet, .jobs-unified-top-card__bullet");

    if (titleEl && companyEl) {
      return {
        company: companyEl.textContent?.trim() || "",
        role: titleEl.textContent?.trim() || "",
        location: locationEl?.textContent?.trim() || "",
        job_url: window.location.href,
        source: "linkedin",
        salary_text: salaryText,
        job_description: jobDescription,
      };
    }
    return null;
  } catch { return null; }
}

function detectGreenhouse(): JobData | null {
  try {
    const titleEl = document.querySelector(".app-title");
    const companyEl = document.querySelector(".company-name");
    const locationEl = document.querySelector(".location");
    const descEl = document.querySelector("#content");
    if (titleEl) {
      return {
        company: companyEl?.textContent?.trim() || new URL(window.location.href).hostname.split(".")[0],
        role: titleEl.textContent?.trim() || "",
        location: locationEl?.textContent?.trim() || "",
        job_url: window.location.href,
        source: "greenhouse",
        job_description: descEl?.textContent?.trim().substring(0, 5000) || "",
      };
    }
    return null;
  } catch { return null; }
}

function detectLever(): JobData | null {
  try {
    const titleEl = document.querySelector(".posting-headline h2");
    const locationEl = document.querySelector(".posting-categories .sort-by-time");
    const companyName = new URL(window.location.href).hostname.split(".")[0] || "";
    const descEl = document.querySelector(".section-wrapper.page-full-width");
    if (titleEl) {
      return {
        company: companyName.charAt(0).toUpperCase() + companyName.slice(1),
        role: titleEl.textContent?.trim() || "",
        location: locationEl?.textContent?.trim() || "",
        job_url: window.location.href,
        source: "lever",
        job_description: descEl?.textContent?.trim().substring(0, 5000) || "",
      };
    }
    return null;
  } catch { return null; }
}

function detect(): JobData | null {
  const url = window.location.href;
  if (url.includes("linkedin.com")) return detectLinkedIn();
  if (url.includes("greenhouse.io")) return detectGreenhouse();
  if (url.includes("lever.co")) return detectLever();
  return null;
}

function createBadge(jobData: JobData, existingStatus: string | null, existingId: number | null) {
  if (document.getElementById("hiretrack-badge")) return;

  const badge = document.createElement("div");
  badge.id = "hiretrack-badge";

  let statusHtml = "";
  let buttonsHtml = "";
  const salaryLine = jobData.salary_text
    ? `<p class="hiretrack-badge-salary">${jobData.salary_text}</p>`
    : `<p class="hiretrack-badge-salary" style="color:#9ca3af;">Salary: Not disclosed</p>`;

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

function init() {
  injectStyles();
  const jobData = detect();
  if (jobData && jobData.company && jobData.role) {
    chrome.runtime.sendMessage({ type: "CHECK_JOB", url: jobData.job_url }, (response) => {
      if (response?.exists) {
        createBadge(jobData, response.status, response.id);
      } else {
        createBadge(jobData, null, null);
      }
    });
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