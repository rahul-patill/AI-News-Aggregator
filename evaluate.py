import os
import json
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

load_dotenv()

from app.database.models import Digest
from app.agent.curator_agent import CuratorAgent
from app.agent.judge_agent import JudgeAgent
from app.profiles.user_profile import USER_PROFILE

def get_db_session():
    db_url = f"postgresql://{os.getenv('POSTGRES_USER')}:{os.getenv('POSTGRES_PASSWORD')}@{os.getenv('POSTGRES_HOST')}:{os.getenv('POSTGRES_PORT')}/{os.getenv('POSTGRES_DB')}"
    engine = create_engine(db_url)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return SessionLocal()

def run_evaluation(num_samples: int = 10):
    print("=" * 60)
    print("Starting LLM-as-a-Judge Evaluation Pipeline")
    print("=" * 60)
    
    session = get_db_session()
    
    # 1. Fetch random digests from the database
    print(f"\nFetching {num_samples} random articles from the database...")
    from sqlalchemy.sql.expression import func
    digests = session.query(Digest).order_by(func.random()).limit(num_samples).all()
    
    if not digests:
        print("Error: No digests found in the database. Please run the main pipeline first.")
        return
        
    print(f"Found {len(digests)} articles. Initializing Agents...\n")
    
    curator = CuratorAgent(USER_PROFILE)
    judge = JudgeAgent(USER_PROFILE)
    
    results = []
    correct_count = 0
    
    for i, digest in enumerate(digests, 1):
        print(f"[{i}/{len(digests)}] Evaluating: {digest.title[:60]}...")
        
        article_data = {
            "id": digest.id,
            "title": digest.title,
            "summary": digest.summary,
            "article_type": digest.article_type
        }
        
        # 2. Run the Candidate (CuratorAgent)
        ranked_list = curator.rank_digests([article_data])
        if not ranked_list:
            print("  -> Failed to rank. Skipping.")
            continue
            
        candidate_score = ranked_list[0].relevance_score
        candidate_reasoning = ranked_list[0].reasoning
        
        # 3. Run the Judge (JudgeAgent)
        eval_result = judge.evaluate_curation(
            article=article_data,
            candidate_score=candidate_score,
            candidate_reasoning=candidate_reasoning
        )
        
        is_correct = eval_result.is_correct
        if is_correct:
            correct_count += 1
            print(f"  ✅ PASS | Curator Score: {candidate_score} | Judge Ideal: {eval_result.ideal_score}")
        else:
            print(f"  ❌ FAIL | Curator Score: {candidate_score} | Judge Ideal: {eval_result.ideal_score}")
            print(f"     Critique: {eval_result.critique}")
            
        results.append({
            "digest_id": digest.id,
            "curator_score": candidate_score,
            "curator_reasoning": candidate_reasoning,
            "judge_ideal_score": eval_result.ideal_score,
            "is_correct": is_correct,
            "critique": eval_result.critique
        })

    # 4. Calculate Final Metric
    accuracy = (correct_count / len(results)) * 100 if results else 0.0
    
    print("\n" + "=" * 60)
    print("Evaluation Complete!")
    print("=" * 60)
    print(f"Total Articles Evaluated : {len(results)}")
    print(f"Judge Agreed (Pass)      : {correct_count}")
    print(f"Judge Disagreed (Fail)   : {len(results) - correct_count}")
    print(f"Final Accuracy Score     : {accuracy:.1f}%")
    print("=" * 60)
    
    # Save detailed report
    with open("eval_report.json", "w") as f:
        json.dump(results, f, indent=2)
    print("Detailed report saved to 'eval_report.json'")

if __name__ == "__main__":
    run_evaluation(num_samples=10)
