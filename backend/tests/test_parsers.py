"""Tests for the parser service — feed sample HTML, verify extracted data."""

from app.parser_service import parse_greenhouse, parse_lever, parse_linkedin


SAMPLE_LINKEDIN_HTML = """
<html>
<head>
<script type="application/ld+json">
{
  "@type": "JobPosting",
  "title": "Software Engineer",
  "hiringOrganization": {"name": "Google"},
  "jobLocation": {"address": {"addressLocality": "Mountain View"}}
}
</script>
</head>
<body></body>
</html>
"""

SAMPLE_GREENHOUSE_HTML = """
<html>
<body>
  <div class="company-name">Stripe</div>
  <h1 class="app-title">Backend Engineer</h1>
  <div class="location">San Francisco, CA</div>
</body>
</html>
"""

SAMPLE_LEVER_HTML = """
<html>
<body>
  <div class="posting-headline"><h2>Full Stack Developer</h2></div>
  <div class="posting-categories">
    <div class="sort-by-time">New York, NY</div>
  </div>
</body>
</html>
"""


def test_parse_linkedin():
    result = parse_linkedin(SAMPLE_LINKEDIN_HTML, "https://www.linkedin.com/jobs/view/123")
    assert result is not None
    assert result["company"] == "Google"
    assert result["role"] == "Software Engineer"
    assert result["location"] == "Mountain View"
    assert result["source"] == "linkedin"


def test_parse_greenhouse():
    result = parse_greenhouse(SAMPLE_GREENHOUSE_HTML, "https://boards.greenhouse.io/stripe/jobs/123")
    assert result is not None
    assert result["company"] == "Stripe"
    assert result["role"] == "Backend Engineer"
    assert result["location"] == "San Francisco, CA"
    assert result["source"] == "greenhouse"


def test_parse_lever():
    result = parse_lever(SAMPLE_LEVER_HTML, "https://jobs.lever.co/acme/123")
    assert result is not None
    assert result["company"] == "Acme"
    assert result["role"] == "Full Stack Developer"
    assert result["location"] == "New York, NY"
    assert result["source"] == "lever"


def test_parse_empty_html():
    result = parse_linkedin("<html><body></body></html>", "https://linkedin.com/jobs/view/1")
    assert result is None


def test_parse_greenhouse_no_company():
    html = '<html><body><h1 class="app-title">SWE</h1></body></html>'
    result = parse_greenhouse(html, "https://boards.greenhouse.io/acme/jobs/1")
    assert result is not None
    assert result["company"] == "boards"
    assert result["role"] == "SWE"