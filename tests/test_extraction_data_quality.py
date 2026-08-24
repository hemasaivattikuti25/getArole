import os
import sys
import unittest
from datetime import datetime, timezone
from bs4 import BeautifulSoup

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from scrapers.models import JobListing
from scrapers.text_normalizer import (
    clean_text,
    decode_html_bytes,
    extract_dom_text,
    parse_salary_range,
    parse_date_string,
    validate_job_listing_assertions
)

def test_dq_1_extra_whitespace_and_newlines():
    """
    Test Case 1: Scraped HTML has extra whitespace, tabs, and newlines.
    Ensures strings are collapsed cleanly without trailing/leading blanks.
    """
    raw_html_snippets = [
        "   Senior   Backend   \n\t  Engineer   ",
        "\n\n\t  Google \r\n   LLC   \t",
        "  Remote   \n  \t -   India  "
    ]
    assert clean_text(raw_html_snippets[0]) == "Senior Backend Engineer"
    assert clean_text(raw_html_snippets[1]) == "Google LLC"
    assert clean_text(raw_html_snippets[2]) == "Remote - India"

def test_dq_2_html_entities():
    """
    Test Case 2: Target data contains single and double encoded HTML entities.
    (&amp;, &lt;, &gt;, &quot;, &#39;, &nbsp;, etc.)
    """
    raw_entities = [
        "AT&amp;T &lt;Senior DevOps &amp; Cloud Architect&gt;",
        "Developer &quot;L&#39;Or&eacute;al&quot; &amp; Co.",
        "Engineering&nbsp;&nbsp;&nbsp;Lead&nbsp;(AI/ML)",
        "Double&amp;amp;Encoded &amp;lt;Title&amp;gt;"
    ]
    assert clean_text(raw_entities[0]) == "AT&T <Senior DevOps & Cloud Architect>"
    assert clean_text(raw_entities[1]) == "Developer \"L'Oréal\" & Co."
    assert clean_text(raw_entities[2]) == "Engineering Lead (AI/ML)"
    assert clean_text(raw_entities[3]) == "Double&Encoded <Title>"

def test_dq_3_newlines_and_tabs_inside_fields():
    """
    Test Case 3: Data contains internal newlines and tabs inside field strings.
    """
    raw = "Senior\nStaff\r\nSoftware\tEngineer\n\n(Core Infra)"
    cleaned = clean_text(raw)
    assert cleaned == "Senior Staff Software Engineer (Core Infra)"
    assert "\n" not in cleaned
    assert "\t" not in cleaned
    assert "\r" not in cleaned

def test_dq_4_target_element_multiple_times_on_page():
    """
    Test Case 4: Target elements appear multiple times on the page (e.g. duplicate headers, card repeats).
    """
    html_doc = """
    <div class="job-card">
        <h2 class="title">Lead AI Engineer</h2>
        <a class="title-link">Lead AI Engineer</a>
        <div class="meta">
            <span class="company">Anthropic</span>
            <span class="company">Anthropic</span>
        </div>
    </div>
    """
    soup = BeautifulSoup(html_doc, "html.parser")
    # Finding by selector returns list; first non-empty primary is selected
    titles = [extract_dom_text(t) for t in soup.find_all(class_=["title", "title-link"])]
    unique_titles = list(dict.fromkeys(titles))
    assert len(unique_titles) == 1
    assert unique_titles[0] == "Lead AI Engineer"

def test_dq_5_target_element_missing_on_some_pages():
    """
    Test Case 5: Target elements are missing on some pages (e.g. no salary, missing city).
    Ensures safe fallbacks without throwing NoneType or unhandled exceptions.
    """
    html_doc = """
    <div class="job-card">
        <h1 class="job-title">Fullstack Developer</h1>
        <!-- No company tag or location tag -->
    </div>
    """
    soup = BeautifulSoup(html_doc, "html.parser")
    company_tag = soup.find("span", class_="company-name")
    location_tag = soup.find("span", class_="job-loc")
    
    extracted_company = extract_dom_text(company_tag) or "Company Unstated"
    extracted_loc = extract_dom_text(location_tag) or "Remote"
    
    assert extracted_company == "Company Unstated"
    assert extracted_loc == "Remote"

def test_dq_6_data_split_across_multiple_dom_elements():
    """
    Test Case 6: Data is split across multiple adjacent or nested DOM nodes.
    """
    html_doc = """
    <div class="job-header">
        <span class="badge">Senior</span>
        <span class="role">Backend Engineer</span>
        <span class="team">- Distributed Systems</span>
    </div>
    """
    soup = BeautifulSoup(html_doc, "html.parser")
    combined = extract_dom_text(soup.find("div", class_="job-header"))
    assert combined == "Senior Backend Engineer - Distributed Systems"

def test_dq_7_encoding_issues_and_mojibake():
    """
    Test Case 7: Encoding variations (UTF-8, ISO-8859-1, Windows-1252, Mojibake).
    """
    # 1. Windows-1252 smart quotes and dashes
    raw_win1252 = b"L\x92Or\xe9al \x96 Senior Software Engineer \x93AI\x94"
    decoded_win = decode_html_bytes(raw_win1252, declared_encoding="windows-1252")
    assert clean_text(decoded_win) == "L'Oréal – Senior Software Engineer \"AI\""
    
    # 2. ISO-8859-1 German umlauts
    raw_iso = b"M\xfcnchen Backend Entwickler"
    decoded_iso = decode_html_bytes(raw_iso, declared_encoding="iso-8859-1")
    assert clean_text(decoded_iso) == "München Backend Entwickler"
    
    # 3. Mojibake strings
    mojibake = "Senior Engineer â€“ AI Platform â€˜Coreâ€™"
    assert clean_text(mojibake) == "Senior Engineer - AI Platform 'Core'"

def test_dq_8_number_and_salary_format_diversity():
    """
    Test Case 8: Number and salary format variations ($1,000 vs $1.000 vs 1000 vs 12 LPA).
    """
    res1 = parse_salary_range("$1,000 / month")
    assert res1["min"] == 1000
    assert res1["currency"] == "USD"
    assert res1["period"] == "monthly"
    
    res2 = parse_salary_range("$1.000 / month")
    assert res2["min"] == 1000
    
    res3 = parse_salary_range("₹25,000 - ₹50,000 per month")
    assert res3["min"] == 25000
    assert res3["max"] == 50000
    assert res3["currency"] == "INR"
    
    res4 = parse_salary_range("12 - 18 LPA")
    assert res4["min"] == 1200000
    assert res4["max"] == 1800000
    assert res4["period"] == "yearly"
    
    res5 = parse_salary_range("1.5L - 2.5L")
    assert res5["min"] == 150000
    assert res5["max"] == 250000

def test_dq_9_multi_format_date_parsing():
    """
    Test Case 9: Dates in multiple formats across pages.
    """
    ref_time = datetime(2026, 8, 25, 4, 0, 0, tzinfo=timezone.utc)
    
    # Relative formats
    d_just_now = parse_date_string("Just now", reference_time=ref_time)
    assert "2026-08-25T04:00:00" in d_just_now
    
    d_2_days = parse_date_string("2 days ago", reference_time=ref_time)
    assert "2026-08-23T04:00:00" in d_2_days
    
    # ISO 8601 format
    d_iso = parse_date_string("2026-08-24T18:30:00Z")
    assert "2026-08-24T18:30:00" in d_iso
    
    # Human dates
    d_human = parse_date_string("August 24, 2026")
    assert "2026-08-24" in d_human
    
    d_slash = parse_date_string("24/08/2026")
    assert "2026-08-24" in d_slash

def test_dq_10_special_characters_in_product_and_company_names():
    """
    Test Case 10: Special characters in technical skills and company names (C++, C#, AT&T, Yahoo!, Node.js).
    """
    tokens = [
        "C++ Core Developer",
        "C# / .NET Senior Architect",
        "Node.js & React Fullstack",
        "AT&T Global Network Engineer",
        "Yahoo! Search Platform",
        "3M Material Science Researcher"
    ]
    for token in tokens:
        cleaned = clean_text(token)
        assert cleaned == token
        assert "C++" in cleaned if "C++" in token else True
        assert "C#" in cleaned if "C#" in token else True
        assert "AT&T" in cleaned if "AT&T" in token else True
        assert "Yahoo!" in cleaned if "Yahoo!" in token else True

def test_dq_11_field_validation_assertions_for_every_field():
    """
    Test Case 11: Validation assertions for every single extraction field.
    """
    valid_job = JobListing(
        id="job_valid_12345",
        title="Senior Python & C++ Engineer",
        company="Google LLC",
        location="Bengaluru, India",
        city="Bengaluru",
        platform="Enterprise",
        url="https://careers.google.com/jobs/results/12345",
        workplace_type="Hybrid",
        employment_type="Full-Time",
        stipend_or_salary="₹25,00,000 - ₹35,00,000",
        stipend_amount_min=2500000,
        description="Core infrastructure engineering for distributed systems.",
        skills=["Python", "C++", "Distributed Systems"]
    )
    
    assertions = validate_job_listing_assertions(valid_job)
    assert assertions["title_present"] is True
    assert assertions["title_no_raw_html"] is True
    assert assertions["title_no_html_entities"] is True
    assert assertions["title_no_excessive_whitespace"] is True
    assert assertions["company_present"] is True
    assert assertions["company_no_control_chars"] is True
    assert assertions["location_present"] is True
    assert assertions["city_normalized"] is True
    assert assertions["url_valid_http"] is True
    assert assertions["workplace_type_valid"] is True
    assert assertions["employment_type_valid"] is True
    assert assertions["description_sanitized"] is True
    assert assertions["all_assertions_passed"] is True

def test_dq_12_assertion_failure_on_corrupt_data():
    """
    Test Case 12: Ensure validator correctly fails on corrupt HTML injection and bad formatting.
    """
    corrupt_job = JobListing(
        id="bad_job_999",
        title="<script>alert(1)</script> &amp; Senior   Developer",
        company="", # Empty company
        location="",
        city="lowercase_city",
        platform="UnknownPlatform",
        url="ftp://invalid-url.com",
        workplace_type="InvalidWorkplace",
        employment_type="InvalidEmpType",
        description="<script src='evil.js'></script>"
    )
    assertions = validate_job_listing_assertions(corrupt_job)
    assert assertions["title_no_raw_html"] is False
    assert assertions["title_no_html_entities"] is False
    assert assertions["company_present"] is False
    assert assertions["city_normalized"] is False
    assert assertions["url_valid_http"] is False
    assert assertions["workplace_type_valid"] is False
    assert assertions["description_sanitized"] is False
    assert assertions["all_assertions_passed"] is False

def test_dq_13_url_normalization_and_tracking_strip():
    """
    Test Case 13: URL normalization strips tracking params (utm, gh_src, ref) to guarantee idempotency.
    """
    from scrapers.text_normalizer import normalize_job_url
    raw_url = "https://job-boards.greenhouse.io/postman/jobs/12345?utm_source=linkedin&utm_medium=job_board&gh_src=custom123&ref=apply#overview"
    clean_url = normalize_job_url(raw_url)
    assert clean_url == "https://job-boards.greenhouse.io/postman/jobs/12345"
    assert "utm_" not in clean_url
    assert "gh_src" not in clean_url

def test_dq_14_pii_sanitization_in_descriptions():
    """
    Test Case 14: Masking recruiter emails and personal phone numbers in job descriptions.
    """
    from scrapers.text_normalizer import sanitize_job_description
    raw_desc = "Exciting opening at Stripe! Contact our lead talent partner at recruiter.jane@stripe.com or +1 (415) 555-2671 for fast track."
    cleaned = sanitize_job_description(raw_desc)
    assert "[REDACTED_CONTACT_EMAIL]" in cleaned
    assert "[REDACTED_PHONE]" in cleaned
    assert "recruiter.jane@stripe.com" not in cleaned
    assert "555-2671" not in cleaned

def test_dq_15_semantic_dedup_and_idempotency():
    """
    Test Case 15: Semantic key matching and deterministic surrogate ID generation.
    """
    from scrapers.text_normalizer import semantic_dedup_key, generate_idempotent_job_id
    key1 = semantic_dedup_key("Postman", "Senior Backend Engineer (Remote)")
    key2 = semantic_dedup_key("Postman Inc.", "Senior Backend Engineer - Remote / India")
    # Clean keys both normalize to company and core title words
    assert "postman" in key1
    assert "seniorbackendengineer" in key1
    
    id1 = generate_idempotent_job_id("Greenhouse", "Postman", "Senior Engineer", "https://job-boards.greenhouse.io/postman/jobs/123")
    id2 = generate_idempotent_job_id("Greenhouse", "Postman", "Senior Engineer", "https://job-boards.greenhouse.io/postman/jobs/123?utm_source=feed")
    assert id1 == id2 # Identical surrogate key regardless of tracking parameters!

if __name__ == "__main__":
    test_dq_1_extra_whitespace_and_newlines()
    test_dq_2_html_entities()
    test_dq_3_newlines_and_tabs_inside_fields()
    test_dq_4_target_element_multiple_times_on_page()
    test_dq_5_target_element_missing_on_some_pages()
    test_dq_6_data_split_across_multiple_dom_elements()
    test_dq_7_encoding_issues_and_mojibake()
    test_dq_8_number_and_salary_format_diversity()
    test_dq_9_multi_format_date_parsing()
    test_dq_10_special_characters_in_product_and_company_names()
    test_dq_11_field_validation_assertions_for_every_field()
    test_dq_12_assertion_failure_on_corrupt_data()
    test_dq_13_url_normalization_and_tracking_strip()
    test_dq_14_pii_sanitization_in_descriptions()
    test_dq_15_semantic_dedup_and_idempotency()
    print("✅ ALL 15 GOOGLE DATA QUALITY & PIPELINE HARDENING TESTS PASSED GREEN!")
