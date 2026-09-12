import os
import tempfile
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger("cron_scraper.vector_engine")

class CronVectorEngine:
    """
    Lightweight, low-memory vector generation engine for cron scrapers.
    Uses FastEmbed (BAAI/bge-small-en-v1.5) to produce 384-dimensional dense embeddings
    matching public.jobs.embedding in Supabase pgvector.
    """
    _instance: Optional["CronVectorEngine"] = None

    def __init__(self, model_name: str = "BAAI/bge-small-en-v1.5"):
        self.model_name = model_name
        self.model = None
        self._init_model()

    def _init_model(self):
        try:
            from fastembed import TextEmbedding
            default_cache = os.path.join(tempfile.gettempdir(), "fastembed_cache")
            cache_dir = os.environ.get("FASTEMBED_CACHE_DIR", default_cache)
            os.makedirs(cache_dir, exist_ok=True)
            self.model = TextEmbedding(model_name=self.model_name, cache_dir=cache_dir)
            logger.info(f"[CronVectorEngine] Initialized FastEmbed model: {self.model_name}")
        except Exception as e:
            logger.warning(f"[CronVectorEngine] Primary cache init failed: {e}. Attempting default initialization.")
            try:
                from fastembed import TextEmbedding
                self.model = TextEmbedding(model_name=self.model_name)
            except Exception as e2:
                logger.error(f"[CronVectorEngine] Critical: FastEmbed model load failed: {e2}")
                self.model = None

    @classmethod
    def get_instance(cls) -> "CronVectorEngine":
        if cls._instance is None:
            cls._instance = CronVectorEngine()
        return cls._instance

    @staticmethod
    def build_canonical_job_text(record: Dict[str, Any]) -> str:
        """
        Creates a high-density, standardized text representation optimized for semantic vector retrieval.
        """
        title = record.get("title", "").strip()
        company = record.get("company", "").strip()
        location = record.get("location", "India").strip()
        workplace = record.get("workplace_type", "Onsite").strip()
        employment = record.get("employment_type", "Full-Time").strip()
        skills = record.get("skills", [])
        skills_str = ", ".join(skills) if isinstance(skills, list) else str(skills)
        desc = (record.get("description", "") or "").strip()[:600]

        return (
            f"Title: {title} | Company: {company} | Location: {location} | "
            f"Workplace: {workplace} | Type: {employment} | "
            f"Skills: {skills_str} | Overview: {desc}"
        )

    def embed_job_records(
        self,
        records: List[Dict[str, Any]],
        batch_size: int = 32
    ) -> List[Dict[str, Any]]:
        """
        Embeds a list of job record dictionaries in micro-batches.
        Attaches the 384-dimensional vector as a Python list of floats to record['embedding'].
        """
        if not records:
            return []

        if self.model is None:
            logger.warning("[CronVectorEngine] FastEmbed not available. Skipping embedding attachment.")
            for r in records:
                r["embedding"] = None
            return records

        texts = [self.build_canonical_job_text(r) for r in records]

        try:
            # FastEmbed returns an iterator over numpy arrays
            embeddings_iter = self.model.embed(texts, batch_size=batch_size)
            for idx, vec in enumerate(embeddings_iter):
                # Ensure 384 dimensions and convert numpy ndarray to Python float list for PostgreSQL
                float_list = [float(v) for v in vec]
                records[idx]["embedding"] = float_list
        except Exception as e:
            logger.error(f"[CronVectorEngine] Batch embedding failed: {e}")
            for r in records:
                if "embedding" not in r:
                    r["embedding"] = None

        return records
