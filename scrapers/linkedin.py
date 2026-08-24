import asyncio
import hashlib
from typing import List, Optional
import httpx
from bs4 import BeautifulSoup
from .models import JobListing
from .greenhouse import normalize_city

SEARCH_QUERIES = [
    ("Software Engineer", "India"),
    ("Backend Engineer", "Bengaluru"),
    ("AI Engineer", "Hyderabad"),
    ("Python Developer", "India"),
]

async def scrape_single_linkedin_query(client: httpx.AsyncClient, keywords: str, location: str) -> List[JobListing]:
    """Scrapes LinkedIn guest job search API without requiring login/bun dependencies."""
    listings: List[JobListing] = []
    url = f"https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords={keywords}&location={location}&f_TPR=r86400&start=0"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    }
    
    try:
        response = await client.get(url, headers=headers, timeout=8.0)
        if response.status_code != 200 or not response.text.strip():
            return listings
        
        soup = BeautifulSoup(response.text, "html.parser")
        cards = soup.find_all("li")
        
        for card in cards:
            title_tag = card.find("h3", class_="base-search-card__title")
            company_tag = card.find("h4", class_="base-search-card__subtitle")
            location_tag = card.find("span", class_="job-search-card__location")
            link_tag = card.find("a", class_="base-card__full-link")
            
            if not title_tag or not company_tag:
                continue
                
            title = title_tag.get_text(strip=True)
            company = company_tag.get_text(strip=True)
            loc = location_tag.get_text(strip=True) if location_tag else location
            job_url = link_tag["href"] if link_tag and "href" in link_tag.attrs else f"https://www.linkedin.com/jobs/search?keywords={keywords}"
            
            job_id_hash = hashlib.md5(f"linkedin_{company}_{title}_{loc}".encode()).hexdigest()[:12]
            
            listings.append(JobListing(
                id=f"li_{job_id_hash}",
                title=title,
                company=company,
                location=loc,
                city=normalize_city(loc),
                platform="LinkedIn",
                url=job_url,
                workplace_type="Remote" if "remote" in loc.lower() or "remote" in location.lower() else "Onsite",
                employment_type="Internship" if any(w in title.lower() for w in ["intern", "trainee"]) else "Full-Time",
                description=f"Live LinkedIn opening: {title} at {company} in {loc}."
            ))
    except Exception as e:
        print(f"[LinkedIn Scraper Warning] Exception during scraping: {e}")
    return listings

async def scrape_all_linkedin_jobs() -> List[JobListing]:
    all_jobs: List[JobListing] = []
    async with httpx.AsyncClient(follow_redirects=True) as client:
        tasks = [
            scrape_single_linkedin_query(client, q, loc)
            for q, loc in SEARCH_QUERIES
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        for res in results:
            if isinstance(res, list):
                all_jobs.extend(res)
    return all_jobs
