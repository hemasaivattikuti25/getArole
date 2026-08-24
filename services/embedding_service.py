import numpy as np
from typing import List, Generator
from fastembed import TextEmbedding
from core.config import settings

class EmbeddingService:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(EmbeddingService, cls).__new__(cls)
            import os
            cache_dir = os.environ.get("FASTEMBED_CACHE_DIR", "/tmp/fastembed_cache")
            try:
                cls._instance.model = TextEmbedding(model_name=settings.EMBEDDING_MODEL_NAME, cache_dir=cache_dir)
            except Exception as e:
                print(f"[EmbeddingService Warning] Custom cache_dir failed ({e}), falling back to default FastEmbed model initialization.")
                cls._instance.model = TextEmbedding(model_name=settings.EMBEDDING_MODEL_NAME)
        return cls._instance

    def embed_texts(self, texts: List[str]) -> List[np.ndarray]:
        # FastEmbed returns an iterator over numpy vectors
        return list(self.model.embed(texts))

    def compute_cosine_similarity(self, vec1: np.ndarray, vec2: np.ndarray) -> float:
        dot = np.dot(vec1, vec2)
        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)
        if norm1 == 0 or norm2 == 0:
            return 0.0
        return float(dot / (norm1 * norm2))

embedding_service = EmbeddingService()
