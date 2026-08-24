import asyncio
import json
import uuid
import re
from typing import List, Dict, Any
from playwright.async_api import async_playwright
from models import JobListing

class IndianITScraper:
    def __init__(self):
        self.companies = [
            {"name": "TCS", "url": "https://www.tcs.com/careers/india"},
            {"name": "Infosys", "url": "https://www.infosys.com/careers/apply.html"},
            {"name": "Wipro", "url": "https://careers.wipro.com/careers-home/"},
            {"name": "HCLTech", "url": "https://www.hcltech.com/careers"},
            {"name": "Tech Mahindra", "url": "https://careers.techmahindra.com/"},
            {"name": "Cognizant", "url": "https://careers.cognizant.com/global/en/search-results?location=India"},
            {"name": "Capgemini", "url": "https://www.capgemini.com/in-en/careers/job-search/"},
        ]
        
    async def scrape_all(self) -> List[JobListing]:
        jobs = []
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                args=["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"]
            )
            for company in self.companies:
                print(f"Scraping IT Giant {company['name']}...")
                try:
                    page = await browser.new_page()
                    await page.goto(company['url'], wait_until='domcontentloaded', timeout=25000)
                    await asyncio.sleep(3) 
                    
                    # Heuristic scraping for Indian IT portals (looking for 'Apply', 'Job', 'Role', etc.)
                    links = await page.evaluate('''() => {
                        return Array.from(document.querySelectorAll('a'))
                            .map(a => ({ text: a.innerText, href: a.href }))
                            .filter(l => l.href && (l.href.includes('/job') || l.href.includes('/career') || l.href.includes('/role')) && l.text.length > 5);
                    }''')
                    
                    for link in links[:15]: # Limit
                        title = link.get('text', '').strip().split('\\n')[0]
                        if not title or len(title) > 60: # Avoid capturing entire paragraphs
                            continue
                            
                        job = JobListing(
                            id=str(uuid.uuid4()),
                            title=title,
                            company=company['name'],
                            location="India",
                            city="India",
                            platform="Enterprise_IT",
                            url=link['href'],
                            workplace_type="Onsite", # Typically onsite for Indian IT
                            employment_type="Full-Time",
                            description=f"Opportunity at {company['name']}. Apply directly on their career portal.",
                            skills=["Java", "C++", "SQL", "Cloud", "Testing", "Support"]
                        )
                        jobs.append(job)
                except Exception as e:
                    print(f"Error scraping {company['name']}: {e}")
                
            await browser.close()
        return jobs

if __name__ == "__main__":
    async def test():
        scraper = IndianITScraper()
        jobs = await scraper.scrape_all()
        for j in jobs:
            print(f"{j.title} | {j.company} | {j.url}")
    asyncio.run(test())
