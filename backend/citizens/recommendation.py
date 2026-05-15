import os
import psycopg
from loguru import logger
from datetime import datetime, timedelta


SUPABASE_URL = os.getenv("SUPABASE_DATABASE_URL") or os.getenv("DATABASE_URL")
SSL_MODE = os.getenv("DATABASE_SSLMODE", "require")


def get_profile_keywords(citizen_profile) -> list[str]:
    """Extract recommendation keywords from citizen profile."""
    keywords = []

    # gender-based
    if citizen_profile.gender == "F":
        keywords.extend(["Women", "Female", "Girl", "Mother", "Widow"])
    elif citizen_profile.gender == "M":
        keywords.extend(["Male", "Men"])

    # age-based
    if citizen_profile.date_of_birth:
        age = (datetime.now().date() - citizen_profile.date_of_birth).days // 365
        if age < 18:
            keywords.extend(["Student", "Youth", "Child", "Minor"])
        elif age < 30:
            keywords.extend(["Youth", "Student", "Young"])
        elif age > 60:
            keywords.extend(["Senior Citizen", "Old Age", "Pension", "Elderly"])

    # location-based
    if citizen_profile.city:
        keywords.append(citizen_profile.city)
    if citizen_profile.state_province:
        keywords.append(citizen_profile.state_province)

    return keywords


def get_search_keywords(citizen_profile, limit: int = 20) -> list[str]:
    """Extract keywords from recent search history."""
    # Fix: Import UserSearchHistory from entities.models
    from entities.citizens import UserSearchHistory

    recent = UserSearchHistory.objects.filter(
        citizen=citizen_profile
    ).order_by("-timestamp")[:limit]

    keywords = []
    stop_words = {"what", "is", "the", "for", "how", "to", "a", "an", "in",
                  "of", "and", "or", "are", "do", "does", "can", "i", "me",
                  "my", "list", "all", "give", "tell", "show"}

    for entry in recent:
        words = entry.search_text.lower().split()
        keywords.extend([w for w in words if w not in stop_words and len(w) > 3])

    return list(set(keywords))


def recommend_schemes(citizen_profile, limit: int = 5) -> list[dict]:
    """
    Recommend schemes based on citizen profile and search history.
    Queries Supabase schemes table.
    """
    try:
        profile_keywords = get_profile_keywords(citizen_profile)
        search_keywords = get_search_keywords(citizen_profile)
        all_keywords = profile_keywords + search_keywords

        if not all_keywords:
            # fallback — return latest schemes
            return get_latest_schemes(limit)

        # build tag matching query
        tag_conditions = " OR ".join(
            [f"tags::text ILIKE %s" for _ in all_keywords]
        )
        category_conditions = " OR ".join(
            [f"categories::text ILIKE %s" for _ in all_keywords]
        )
        name_conditions = " OR ".join(
            [f"name ILIKE %s" for _ in all_keywords]
        )

        params = (
            [f"%{k}%" for k in all_keywords] +
            [f"%{k}%" for k in all_keywords] +
            [f"%{k}%" for k in all_keywords]
        )

        sql = f"""
            SELECT slug, name, ministry, level, brief_description,
                   categories, tags, application_url
            FROM schemes
            WHERE {tag_conditions}
               OR {category_conditions}
               OR {name_conditions}
            LIMIT %s
        """
        params.append(limit)

        with psycopg.connect(SUPABASE_URL, sslmode=SSL_MODE) as conn:
            with conn.cursor() as cur:
                cur.execute(sql, params)
                rows = cur.fetchall()

        schemes = []
        for row in rows:
            schemes.append({
                "slug": row[0],
                "name": row[1],
                "ministry": row[2],
                "level": row[3],
                "brief_description": row[4],
                "categories": row[5] or [],
                "tags": row[6] or [],
                "application_url": row[7],
            })

        logger.info("Recommended {} schemes for citizen {}", 
                   len(schemes), citizen_profile.user.username)
        return schemes

    except Exception as e:
        logger.error("Recommendation failed: {}", e)
        return get_latest_schemes(limit)


def get_latest_schemes(limit: int = 5) -> list[dict]:
    """Fallback — return most recently stored schemes."""
    try:
        sql = """
            SELECT slug, name, ministry, level, brief_description,
                   categories, tags, application_url
            FROM schemes
            ORDER BY last_fetched_at DESC
            LIMIT %s
        """
        with psycopg.connect(SUPABASE_URL, sslmode=SSL_MODE) as conn:
            with conn.cursor() as cur:
                cur.execute(sql, [limit])
                rows = cur.fetchall()

        return [
            {
                "slug": row[0],
                "name": row[1],
                "ministry": row[2],
                "level": row[3],
                "brief_description": row[4],
                "categories": row[5] or [],
                "tags": row[6] or [],
                "application_url": row[7],
            }
            for row in rows
        ]
    except Exception as e:
        logger.error("Fallback schemes failed: {}", e)
        return []