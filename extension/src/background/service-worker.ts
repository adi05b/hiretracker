const API_BASE = "http://localhost:8000/api";

function extractJobId(url: string): string {
  try {
    const u = new URL(url);

    // linkedin.com/jobs/view/123456
    const viewMatch = u.pathname.match(/\/jobs\/view\/(\d+)/);
    if (viewMatch) return "li-" + viewMatch[1];

    // linkedin.com/jobs/search/?currentJobId=123456
    const jobId = u.searchParams.get("currentJobId");
    if (jobId) return "li-" + jobId;

    // For non-LinkedIn, use full URL without query
    return u.origin + u.pathname;
  } catch {
    return url.split("?")[0];
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "SAVE_JOB") {
    fetch(API_BASE + "/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        company: message.payload.company,
        role: message.payload.role,
        location: message.payload.location || "",
        job_url: message.payload.job_url || "",
        source: message.payload.source || "manual",
        status: message.payload.status || "wishlist",
        salary_text: message.payload.salary_text || "",
        job_description: message.payload.job_description || "",
      }),
    })
      .then((resp) => {
        if (!resp.ok) throw new Error("API error: " + resp.status);
        return resp.json();
      })
      .then((data) => sendResponse({ success: true, data }))
      .catch((err) => sendResponse({ success: false, error: err.message }));

    return true;
  }

  if (message.type === "CHECK_JOB") {
    fetch(API_BASE + "/applications")
      .then((resp) => resp.json())
      .then((apps) => {
        const currentId = extractJobId(message.url);
        const match = apps.find(
          (a: any) => a.job_url && extractJobId(a.job_url) === currentId
        );
        if (match) {
          sendResponse({ exists: true, status: match.status, id: match.id });
        } else {
          sendResponse({ exists: false });
        }
      })
      .catch(() => sendResponse({ exists: false }));

    return true;
  }

  if (message.type === "UPDATE_STATUS") {
    fetch(API_BASE + "/applications/" + message.id + "/status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: message.status }),
    })
      .then((resp) => {
        if (!resp.ok) throw new Error("API error: " + resp.status);
        return resp.json();
      })
      .then((data) => sendResponse({ success: true, data }))
      .catch((err) => sendResponse({ success: false, error: err.message }));

    return true;
  }
});