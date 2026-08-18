from pydantic import BaseModel, Field
from app.agent.llm_client import get_instructor_client, DEFAULT_MODEL

class JudgeEvaluation(BaseModel):
    is_correct: bool = Field(description="True if the Curator's score and reasoning is generally accurate and justified based on the user profile")
    ideal_score: float = Field(description="What the score SHOULD have been (0.0 - 10.0)", ge=0.0, le=10.0)
    critique: str = Field(description="Detailed critique of why the CuratorAgent was right or wrong")

JUDGE_PROMPT = """You are an impartial AI Evaluation Judge.
Your job is to evaluate another AI agent (the 'CuratorAgent') which ranks AI news articles for a specific user.

You will be provided with:
1. The User's Profile
2. The Original Article (Title and Summary)
3. The Candidate Score and Reasoning provided by the CuratorAgent

You must determine if the CuratorAgent did a good job. A 'good job' means the score is within +/- 1.5 points of what you think it should be, and the reasoning logically connects the article to the user's specific profile and interests.

Provide your evaluation containing:
1. is_correct: boolean (True if it did a good job, False if it hallucinated, missed the point, or scored poorly)
2. ideal_score: what you believe the score should be (0.0 to 10.0)
3. critique: a short explanation of your verdict."""

class JudgeAgent:
    def __init__(self, user_profile: dict):
        self.client = get_instructor_client()
        self.model = DEFAULT_MODEL
        self.user_profile = user_profile

    def _build_profile_text(self) -> str:
        interests = "\n".join(f"- {i}" for i in self.user_profile["interests"])
        prefs = "\n".join(f"- {k}: {v}" for k, v in self.user_profile["preferences"].items())
        return f"""User Profile:
Name: {self.user_profile['name']}
Background: {self.user_profile['background']}
Expertise: {self.user_profile['expertise_level']}
Interests:
{interests}
Preferences:
{prefs}"""

    def evaluate_curation(self, article: dict, candidate_score: float, candidate_reasoning: str) -> JudgeEvaluation:
        profile_text = self._build_profile_text()
        
        user_prompt = f"""Please evaluate the following curation decision.

{profile_text}

---
ARTICLE:
Title: {article.get('title', 'N/A')}
Summary: {article.get('summary', 'N/A')}

---
CURATOR'S DECISION:
Candidate Score: {candidate_score} / 10.0
Candidate Reasoning: {candidate_reasoning}
"""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": JUDGE_PROMPT},
                    {"role": "user", "content": user_prompt}
                    
                ],
                response_model=JudgeEvaluation,
                temperature=0.0, # Zero temperature for consistent judging
            )
            return response
        except Exception as e:
            print(f"Judge Agent Error: {e}")
            # Fallback evaluation
            return JudgeEvaluation(is_correct=False, ideal_score=0.0, critique=f"Error during evaluation: {e}")
