"""
Server-side HTML parsing for job postings.
Used as a fallback when client-side detection fails.
"""

import json
from urllib.parse import urlparse

from bs4 import BeautifulSoup


def parse_linkedin(html: str, url: str) -> dict | None:
    """Parse a LinkedIn job posting from HTML."""
    soup = BeautifulSoup(html, "html.parser")

    for script in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(script.string or "")
            if data.get("@type") == "JobPosting":
                org = data.get("hiringOrganization", {})
                loc = data.get("jobLocation", {})
                return {
                    "company": org.get("name", "") if isinstance(org, dict) else str(org),
                    "role": data.get("title", ""),
                    "location": loc.get("address", {}).get("addressLocality", "") if isinstance(loc, dict) else "",
                    "job_url": url,
                    "source": "linkedin",
                }
        except (json.JSONDecodeError, AttributeError):
            continue

    return None


def parse_greenhouse(html: str, url: str) -> dict | None:
    """Parse a Greenhouse job posting from HTML."""
    soup = BeautifulSoup(html, "html.parser")

    title_el = soup.select_one(".app-title")
    company_el = soup.select_one(".company-name")
    location_el = soup.select_one(".location")

    if title_el:
        domain = urlparse(url).hostname or ""
        fallback_company = domain.split(".")[0] if domain else ""
        return {
            "company": (company_el.get_text(strip=True) if company_el else fallback_company),
            "role": title_el.get_text(strip=True),
            "location": location_el.get_text(strip=True) if location_el else "",
            "job_url": url,
            "source": "greenhouse",
        }

    return None


def parse_lever(html: str, url: str) -> dict | None:
    """Parse a Lever job posting from HTML."""
    soup = BeautifulSoup(html, "html.parser")

    title_el = soup.select_one(".posting-headline h2")
    location_el = soup.select_one(".posting-categories .sort-by-time")

    if title_el:
        # Company name is in the URL path: jobs.lever.co/acme/123
        path_parts = urlparse(url).path.strip("/").split("/")
        company_raw = path_parts[0] if path_parts else ""
        company = company_raw.capitalize()
        return {
            "company": company,
            "role": title_el.get_text(strip=True),
            "location": location_el.get_text(strip=True) if location_el else "",
            "job_url": url,
            "source": "lever",
        }

    return None


def parse_job_html(html: str, url: str) -> dict | None:
    """
    Detect the source from the URL and parse accordingly.
    Returns a dict with company, role, location, job_url, source — or None.
    """
    if "linkedin.com" in url:
        return parse_linkedin(html, url)
    elif "greenhouse.io" in url:
        return parse_greenhouse(html, url)
    elif "lever.co" in url:
        return parse_lever(html, url)

    return None