import litellm
import instructor
import os

# Set global LiteLLM settings for Langfuse tracing
# Litellm automatically detects the LANGFUSE_PUBLIC_KEY, LANGFUSE_SECRET_KEY, 
# and LANGFUSE_HOST from the environment variables.
litellm.success_callback = ["langfuse"]
litellm.failure_callback = ["langfuse"]

# Set the default model for all agents.
# To switch models (e.g. to Claude), simply change the LLM_MODEL env var to "anthropic/claude-3-5-sonnet-20240620"
DEFAULT_MODEL = os.getenv("LLM_MODEL", "gemini/gemini-2.5-flash")

def get_instructor_client():
    """
    Returns an instructor-patched LiteLLM completion client.
    This allows us to seamlessly request Pydantic structured output from any model.
    """
    # instructor.from_litellm automatically wraps the standard litellm.completion method
    return instructor.from_litellm(litellm.completion)
