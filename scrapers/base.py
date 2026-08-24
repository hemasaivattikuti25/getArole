from abc import ABC, abstractmethod
from typing import List
from scrapers.models import JobListing

class BaseScraper(ABC):
    """
    Abstract Base Class for all Job Board Scrapers (Open/Closed Principle).
    """
    def __init__(self, name: str):
        self.name = name

    @abstractmethod
    async def scrape(self, query: str, location: str = "Remote", limit: int = 20) -> List[JobListing]:
        """
        Scrapes job listings for a given query and location.
        Returns a list of JobListing model objects.
        """
        pass
