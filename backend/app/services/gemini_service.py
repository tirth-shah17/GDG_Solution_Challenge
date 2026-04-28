import os
import logging
from typing import Optional

try:
    from google import genai
except ImportError:
    genai = None

from app.core.settings import settings

logger = logging.getLogger(__name__)

GEMINI_API_KEY = settings.GEMINI_API_KEY

client = None
if genai and GEMINI_API_KEY:
    try:
        client = genai.Client(api_key=GEMINI_API_KEY)
    except Exception as e:
        logger.error(f"Failed to configure Gemini Client: {e}")
_explanation_cache: dict[int, str] = {}

def get_fallback_explanation(similarity: float) -> str:
    if similarity > 90:
        return "This image is nearly identical to the original, indicating direct reuse."
    elif similarity > 75:
        return "This image appears to be a modified version of the original, possibly cropped or edited."
    else:
        return "This image shows partial similarity and may have been altered."

def generate_explanation(similarity: float) -> str:
    """
    Generate an AI explanation comparing two images based on similarity using Google Gemini.
    """
    cache_key = int(similarity)
    
    if cache_key in _explanation_cache:
        logger.info(f"Using cached explanation for similarity {cache_key}")
        return _explanation_cache[cache_key]

    fallback = get_fallback_explanation(similarity)

    if not client:
        logger.warning("Gemini Client not configured. Returning fallback explanation.")
        return fallback
        
    try:
        prompt = (
            f"Explain why two images with {similarity}% similarity could be considered modified copies. Keep it short."
        )
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt
        )
        
        if response and response.text:
            explanation = response.text.strip()
            _explanation_cache[cache_key] = explanation
            return explanation
            
        return fallback
        
    except Exception as e:
        logger.error(f"Error generating Gemini explanation: {e}")
        return fallback
