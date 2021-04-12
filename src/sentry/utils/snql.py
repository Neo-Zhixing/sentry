import random
from typing import Optional

from sentry import options

snql_referrers = {
    "sessions.stability-sort",
    "sessions.crash-free-breakdown",
    "sessions.get-adoption",
    "sessions.health-data-check",
    "sessions.oldest-data-backfill",
    "sessions.release-adoption-list",
    "sessions.release-adoption-total-users-and-sessions",
    "sessions.release-overview",
    "sessions.release-sessions-time-bounds",
    "sessions.release-stats",
    "sessions.release-stats-details",
}


def should_use_snql(referrer: Optional[str]) -> bool:
    if referrer in snql_referrers:
        use_snql = options.get("snuba.snql.referrer-rate")
        assert isinstance(use_snql, float)
        return random.random() <= use_snql

    return False
