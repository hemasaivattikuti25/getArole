import asyncio
import json
import uuid
import re
from typing import List, Dict, Any
from playwright.async_api import async_playwright
from models import JobListing

class WorkdayScraper:
    def __init__(self):
        self.companies = [
            {"name": "Walmart Global Tech", "url": "https://walmart.wd5.myworkdayjobs.com/Walmart_External"},
            {"name": "Cisco", "url": "https://jobs.cisco.com/jobs/SearchJobs"}, # Cisco is custom/ICIMS/Workday mix, but we can treat it similarly
            {"name": "Intel", "url": "https://jobs.intel.com/us/en/search-results?location=India"},
            {"name": "Dell", "url": "https://jobs.dell.com/search-jobs/India/375/2/1269750/1/25/50/2"},
            {"name": "Adobe", "url": "https://careers.adobe.com/us/en/search-results?location=India"}
        ]
        
    async def scrape_all(self) -> List[JobListing]:
        jobs = []
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                args=["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"]
            )
            for company in self.companies:
                print(f"Scraping {company['name']}...")
                page = None
                try:
                    page = await browser.new_page()
                    await page.goto(company['url'], wait_until='domcontentloaded', timeout=25000)
                    await asyncio.sleep(3)
                    
                    # Instead of complex DOM scraping, we just grab all links that look like job descriptions
                    # This is a highly resilient fallback for custom enterprise boards
                    links = await page.evaluate('''() => {
                        return Array.from(document.querySelectorAll('a'))
                            .map(a => ({ text: a.innerText, href: a.href }))
                            .filter(l => l.href && (l.href.includes('/job/') || l.href.includes('/requisition/')) && l.text.length > 5);
                    }''')
                    
                    for link in links[:20]: # Limit to top 20 recent jobs per company for speed
                        title = link.get('text', '').strip().split('\\n')[0]
                        if not title:
                            continue
                            
                        job = JobListing(
                            id=str(uuid.uuid4()),
                            title=title,
                            company=company['name'],
                            location="India", # Fallback, could be parsed better
                            city="India",
                            platform="Enterprise",
                            url=link['href'],
                            workplace_type="Hybrid", # Assuming hybrid post-covid
                            employment_type="Full-Time",
                            description=f"Opportunity at {company['name']}. Apply directly on their career portal.",
                            skills=["Software Engineering", "Python", "Java", "Cloud", "Enterprise"] # generic fallback skills
                        )
                        jobs.append(job)
                except Exception as e:
                    print(f"Error scraping {company['name']}: {e}")
                
            await browser.close()
        return jobs

if __name__ == "__main__":
    async def test():
        scraper = WorkdayScraper()
        jobs = await scraper.scrape_all()
        for j in jobs:
            print(f"{j.title} | {j.company} | {j.url}")
    asyncio.run(test())
