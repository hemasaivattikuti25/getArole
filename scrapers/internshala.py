import asyncio
import hashlib
import re
from typing import List, Optional
import httpx
from bs4 import BeautifulSoup
from .models import JobListing
from .greenhouse import normalize_city

SEARCH_CATEGORIES = [
    "python-django",
    "machine-learning",
    "artificial-intelligence-ai",
    "backend-development",
    "full-stack-development",
    "software-development"
]

CITIES = ["hyderabad", "bangalore", "chennai", "work-from-home"]

def parse_stipend(stipend_str: str) -> Optional[int]:
    if not stipend_str:
        return None
    # e.g. "₹ 25,000 /month" or "₹ 15,000-25,000 /month" or "₹ 30,000 lump sum"
    nums = re.findall(r"[\d,]+", stipend_str.replace(",", ""))
    if nums:
        try:
            val = int(nums[0])
            # If annual e.g. 300000, convert to monthly
            if val > 100000:
                val = val // 12
            return val
        except ValueError:
            return None
    return None

async def scrape_internshala_category(client: httpx.AsyncClient, category: str, city: str) -> List[JobListing]:
    url = f"https://internshala.com/internships/{category}-internship-in-{city}/"
    listings: List[JobListing] = []
    
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        }
        response = await client.get(url, headers=headers, timeout=4.0)
        if response.status_code != 200:
            return listings
        
        soup = BeautifulSoup(response.text, "html.parser")
        cards = soup.find_all("div", class_="individual_internship")
        
        for card in cards:
            title_tag = card.find("h3", class_="job-internship-name") or card.find("a", class_="view_detail_button")
            if not title_tag:
                continue
            
            title = title_tag.get_text(strip=True)
            link_tag = card.find("a", class_="view_detail_button")
            rel_link = link_tag.get("href", "") if link_tag else ""
            full_url = f"https://internshala.com{rel_link}" if rel_link.startswith("/") else rel_link
            
            company_tag = card.find("p", class_="company-name") or card.find("a", class_="link_display_like_text")
            company = company_tag.get_text(strip=True) if company_tag else "Company"
            
            loc_tag = card.find("a", class_="location_link") or card.find("span", class_="location_link")
            location_name = loc_tag.get_text(strip=True) if loc_tag else city.capitalize()
            
            stipend_tag = card.find("span", class_="stipend")
            stipend_str = stipend_tag.get_text(strip=True) if stipend_tag else "Unstated"
            stipend_num = parse_stipend(stipend_str)
            
            job_id_str = f"internshala_{company}_{title}_{location_name}"
            uid = hashlib.md5(job_id_str.encode()).hexdigest()[:12]
            
            is_wfh = "work from home" in location_name.lower() or "remote" in location_name.lower() or city == "work-from-home"
            
            job_obj = JobListing(
                id=uid,
                title=title,
                company=company,
                location=location_name,
                city="Remote" if is_wfh else normalize_city(location_name),
                platform="Internshala",
                url=full_url or url,
                workplace_type="Remote" if is_wfh else "Onsite",
                employment_type="Internship",
                stipend_or_salary=stipend_str,
                stipend_amount_min=stipend_num,
                description=f"Role: {title} at {company}. Location: {location_name}. Stipend: {stipend_str}.",
                date_posted="Recently"
            )
            listings.append(job_obj)
            
    except Exception:
        pass
    
    return listings

async def scrape_all_internshala_jobs() -> List[JobListing]:
    all_jobs: List[JobListing] = []
    
    limits = httpx.Limits(max_keepalive_connections=10, max_connections=20)
    async with httpx.AsyncClient(limits=limits, follow_redirects=True) as client:
        tasks = []
        for cat in SEARCH_CATEGORIES:
            for city in CITIES:
                tasks.append(scrape_internshala_category(client, cat, city))
                
        results = await asyncio.gather(*tasks, return_exceptions=True)
        for res in results:
            if isinstance(res, list):
                all_jobs.extend(res)
                
    return all_jobs
