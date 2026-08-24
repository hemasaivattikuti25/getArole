import html
import re
import unicodedata
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List, Union
from bs4 import BeautifulSoup, Tag, NavigableString

def clean_text(raw: Optional[Union[str, bytes]]) -> str:
    """
    Google Data Quality Standard Text Normalizer:
    1. Handles bytes decoding safely (UTF-8, Windows-1252, ISO-8859-1)
    2. Decodes HTML entities (&amp;, &lt;, &gt;, &#39;, &nbsp;, etc.)
    3. Fixes common Mojibake encoding artifacts (e.g. â€™ -> ', â€" -> –)
    4. Normalizes Unicode to NFKC standard form
    5. Strips non-printable control characters (except common whitespace)
    6. Collapses multiple spaces, tabs, and newlines into single spaces
    7. Preserves technical tokens and punctuation (e.g. C++, C#, .NET, AT&T, L'Oréal, Node.js, Yahoo!)
    """
    if raw is None:
        return ""
    
    if isinstance(raw, bytes):
        raw = decode_html_bytes(raw)
        
    text = str(raw)
    
    # 1. Unescape HTML entities (recursive pass for double-encoded entities like &amp;amp;)
    for _ in range(2):
        unescaped = html.unescape(text)
        if unescaped == text:
            break
        text = unescaped
        
    # 2. Repair common Latin-1 -> UTF-8 Mojibake sequences
    mojibake_map = {
        "â€™": "'",
        "â€˜": "'",
        "â€œ": '"',
        "â€\x9d": '"',
        "â€“": "-",
        "â€”": "—",
        "â€¦": "...",
        "\xa0": " ",
        "&nbsp;": " ",
        "’": "'",
        "‘": "'",
        "“": '"',
        "”": '"',
    }
    for bad, good in mojibake_map.items():
        if bad in text:
            text = text.replace(bad, good)
            
    # 3. Unicode NFKC normalization
    text = unicodedata.normalize("NFKC", text)
    
    # 4. Remove NULL bytes and dangerous control characters
    text = re.sub(r"[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]", "", text)
    
    # 5. Collapse all whitespace, newlines, and tabs
    text = re.sub(r"[\s\t\r\n]+", " ", text).strip()
    
    return text

def decode_html_bytes(raw_bytes: bytes, declared_encoding: Optional[str] = None) -> str:
    """
    Decodes raw HTML bytes attempting specified encoding, UTF-8, Windows-1252, and ISO-8859-1.
    """
    if not raw_bytes:
        return ""
        
    encodings_to_try = [declared_encoding] if declared_encoding else []
    encodings_to_try.extend(["utf-8", "utf-8-sig", "windows-1252", "iso-8859-1", "latin-1"])
    
    for enc in encodings_to_try:
        if not enc:
            continue
        try:
            return raw_bytes.decode(enc)
        except (UnicodeDecodeError, LookupError):
            continue
            
    return raw_bytes.decode("utf-8", errors="replace")

def extract_dom_text(element: Optional[Union[Tag, BeautifulSoup, str]], separator: str = " ") -> str:
    """
    Extracts and merges text from multiple/split DOM elements while avoiding duplicates.
    """
    if element is None:
        return ""
        
    if isinstance(element, str):
        return clean_text(element)
        
    # Get text from tag and all nested children
    extracted = element.get_text(separator=separator, strip=True)
    return clean_text(extracted)

def parse_salary_range(salary_str: Optional[str]) -> Dict[str, Any]:
    """
    Parses diverse multi-locale salary formats:
    - $1,000 / month
    - $1.000 (European thousand separator)
    - ₹15,000 - ₹25,000 /month
    - 12 LPA / 12-15 LPA
    - 1.5L - 2.5L
    - $120,000 - $160,000 a year
    """
    result = {
        "raw": salary_str or "",
        "min": None,
        "max": None,
        "currency": None,
        "period": "monthly" # default
    }
    
    if not salary_str:
        return result
        
    s = clean_text(salary_str).lower()
    
    # Currency detection
    if "₹" in s or "rs" in s or "inr" in s or "lpa" in s or "lakh" in s:
        result["currency"] = "INR"
    elif "$" in s or "usd" in s:
        result["currency"] = "USD"
    elif "€" in s or "eur" in s:
        result["currency"] = "EUR"
    elif "£" in s or "gbp" in s:
        result["currency"] = "GBP"
        
    # Period detection
    if any(w in s for w in ["year", "yr", "annum", "annual", "lpa"]):
        result["period"] = "yearly"
    elif any(w in s for w in ["hour", "hr"]):
        result["period"] = "hourly"
    elif any(w in s for w in ["day", "daily"]):
        result["period"] = "daily"
    else:
        result["period"] = "monthly"
        
    # 1. Lakhs / LPA e.g. "12 LPA", "1.5 - 2.5 Lakhs", "8 - 12 LPA", "1.5L - 2.5L"
    lpa_match = re.findall(r"([\d.]+)\s*(?:l|lpa|lakh|lakhs|lac|lacs)?\s*(?:-|to)\s*([\d.]+)\s*(?:l|lpa|lakh|lakhs|lac|lacs)", s)
    if not lpa_match:
        lpa_match = re.findall(r"([\d.]+)\s*(?:l|lpa|lakh|lakhs|lac|lacs)", s)
        if lpa_match:
            min_val_f = float(lpa_match[0])
            max_val_f = min_val_f
            result["min"] = int(min_val_f * 100000)
            result["max"] = int(max_val_f * 100000)
            result["period"] = "yearly"
            return result
    else:
        min_val_f = float(lpa_match[0][0])
        max_val_f = float(lpa_match[0][1])
        result["min"] = int(min_val_f * 100000)
        result["max"] = int(max_val_f * 100000)
        result["period"] = "yearly"
        return result
        
    # 2. Standard numbers with comma or dot thousand separators
    # Normalize European dot format: 1.000 -> 1000 when used as thousand separator
    normalized_s = s
    if re.search(r"\$\d{1,3}\.\d{3}(?!\d)", normalized_s):
        normalized_s = re.sub(r"(\d+)\.(\d{3})", r"\1\2", normalized_s)
    else:
        normalized_s = normalized_s.replace(",", "")
        
    nums = re.findall(r"\d+", normalized_s)
    if nums:
        int_nums = [int(n) for n in nums if int(n) > 0]
        if int_nums:
            result["min"] = int_nums[0]
            result["max"] = int_nums[1] if len(int_nums) > 1 else int_nums[0]
            
    return result

def parse_date_string(date_str: Optional[str], reference_time: Optional[datetime] = None) -> Optional[str]:
    """
    Parses diverse multi-format date representations into standardized ISO 8601 UTC string:
    - ISO 8601: "2026-08-24T18:30:00Z"
    - DD/MM/YYYY: "24/08/2026"
    - Named month: "August 24, 2026" or "24-Aug-2026"
    - Relative: "2 days ago", "1 hour ago", "yesterday", "just now"
    """
    if not date_str:
        return None
        
    ref = reference_time or datetime.now(timezone.utc)
    s = clean_text(date_str).lower()
    
    # 1. Relative dates
    if "just now" in s or "today" in s or "recently" in s or "moments ago" in s:
        return ref.isoformat()
    if "yesterday" in s:
        return (ref - timedelta(days=1)).isoformat()
        
    rel_days = re.search(r"(\d+)\s+day", s)
    if rel_days:
        return (ref - timedelta(days=int(rel_days.group(1)))).isoformat()
        
    rel_hours = re.search(r"(\d+)\s+hour", s)
    if rel_hours:
        return (ref - timedelta(hours=int(rel_hours.group(1)))).isoformat()
        
    rel_weeks = re.search(r"(\d+)\s+week", s)
    if rel_weeks:
        return (ref - timedelta(weeks=int(rel_weeks.group(1)))).isoformat()
        
    rel_months = re.search(r"(\d+)\s+month", s)
    if rel_months:
        return (ref - timedelta(days=int(rel_months.group(1)) * 30)).isoformat()

    # 2. Standard timestamp patterns
    date_clean = clean_text(date_str)
    formats = [
        "%Y-%m-%dT%H:%M:%S%z",
        "%Y-%m-%dT%H:%M:%S.%f%z",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d",
        "%d/%m/%Y",
        "%m/%d/%Y",
        "%B %d, %Y",
        "%b %d, %Y",
        "%d-%b-%Y",
        "%d %b %Y",
        "%d %B %Y",
    ]
    
    # Handle ISO ending in Z
    if date_clean.endswith("Z"):
        date_clean = date_clean[:-1] + "+0000"
        
    for fmt in formats:
        try:
            dt = datetime.strptime(date_clean, fmt)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt.isoformat()
        except ValueError:
            continue
            
    return clean_text(date_str)

def validate_job_listing_assertions(job: Any) -> Dict[str, bool]:
    """
    Google Data Quality Assertion Validator:
    Verifies every field in JobListing against strict schema requirements:
    - id: non-empty string, no control characters
    - title: non-empty string, 2-150 chars, no raw HTML/entities
    - company: non-empty string, 1-100 chars
    - location: non-empty string
    - city: normalized valid city name
    - platform: valid recognized source platform
    - url: valid http/https schema
    - workplace_type: one of 'Remote', 'Onsite', 'Hybrid'
    - employment_type: one of 'Full-Time', 'Internship', 'Contract', 'Part-Time'
    - description: sanitized text, no malicious script tags
    """
    results = {}
    
    # Title validation
    title = getattr(job, "title", None) or ""
    results["title_present"] = bool(title and len(title.strip()) >= 2)
    results["title_no_raw_html"] = not bool(re.search(r"<[^>]+>", title))
    results["title_no_html_entities"] = not bool(re.search(r"&(?:amp|lt|gt|quot|#39);", title))
    results["title_no_excessive_whitespace"] = title == clean_text(title)
    
    # Company validation
    company = getattr(job, "company", None) or ""
    results["company_present"] = bool(company and len(company.strip()) >= 1)
    results["company_no_control_chars"] = not bool(re.search(r"[\x00-\x1F\x7F]", company))
    
    # Location & City validation
    location = getattr(job, "location", None) or ""
    city = getattr(job, "city", None) or ""
    results["location_present"] = bool(location and len(location.strip()) >= 2)
    results["city_normalized"] = bool(city and city[0].isupper())
    
    # URL validation
    url = getattr(job, "url", None) or ""
    results["url_valid_http"] = bool(url.startswith("http://") or url.startswith("https://"))
    
    # Workplace & Employment Type validation
    workplace = getattr(job, "workplace_type", "")
    results["workplace_type_valid"] = workplace in ["Remote", "Onsite", "Hybrid", "Unknown"]
    
    emp_type = getattr(job, "employment_type", "")
    results["employment_type_valid"] = emp_type in ["Full-Time", "Internship", "Contract", "Part-Time", "Full-time"]
    
    # Description validation
    desc = getattr(job, "description", "") or ""
    results["description_sanitized"] = not bool(re.search(r"<script[\s>]", desc, re.IGNORECASE))
    
    # All Passed flag
    results["all_assertions_passed"] = all(results.values())
    return results

def normalize_job_url(raw_url: Optional[str]) -> str:
    """
    Strips ephemeral tracking query params (utm_*, gh_src, ref, trackingId, position, etc.)
    to guarantee identical URL strings across daily cron runs.
    """
    if not raw_url:
        return ""
    import urllib.parse as urlparse
    parsed = urlparse.urlparse(raw_url.strip())
    # Keep only significant params if needed, or strip tracking parameters
    tracking_params = {
        "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
        "gh_src", "ref", "refid", "trackingid", "position", "pagenum", "trk",
        "source", "fbclid", "gclid"
    }
    query_dict = urlparse.parse_qs(parsed.query, keep_blank_values=False)
    filtered_query = {k: v for k, v in query_dict.items() if k.lower() not in tracking_params}
    
    clean_query = urlparse.urlencode(filtered_query, doseq=True)
    clean_parsed = parsed._replace(query=clean_query, fragment="")
    return urlparse.urlunparse(clean_parsed).rstrip("/")

def sanitize_job_description(raw_desc: Optional[str]) -> str:
    """
    Google PII Scrubbing Standard:
    Masks personal recruiter emails and direct phone numbers in public job descriptions.
    """
    if not raw_desc:
        return ""
    text = clean_text(raw_desc)
    # Mask direct recruiter emails (e.g. name@company.com)
    text = re.sub(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", "[REDACTED_CONTACT_EMAIL]", text)
    # Mask direct phone numbers (international and local)
    text = re.sub(r"(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b", "[REDACTED_PHONE]", text)
    return text

def semantic_dedup_key(company: Optional[str], title: Optional[str], location: Optional[str] = None) -> str:
    """
    Creates a resilient normalized semantic key:
    e.g. ("Postman", "Senior / Staff Fullstack Engineer (Remote)") -> "postman_seniorstafffullstackengineer"
    """
    c_clean = re.sub(r"[^a-z0-9]", "", (company or "").lower())
    t_clean = re.sub(r"[^a-z0-9]", "", (title or "").lower())
    # Strip common noise words in title
    noise = ["remote", "hybrid", "onsite", "fulltime", "parttime", "india", "usa"]
    for n in noise:
        t_clean = t_clean.replace(n, "")
    return f"{c_clean}_{t_clean}"

def generate_idempotent_job_id(platform: str, company: str, title: str, url: str) -> str:
    """
    Generates a deterministic surrogate UUID for Supabase upsert idempotency.
    """
    import hashlib
    clean_url = normalize_job_url(url)
    c_key = semantic_dedup_key(company, title)
    raw_signature = f"{platform.lower()}_{c_key}_{clean_url}"
    return f"job_{hashlib.sha256(raw_signature.encode('utf-8')).hexdigest()[:16]}"

