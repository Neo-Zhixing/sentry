from typing import Any, Mapping, Tuple

from .base import ActivityNotification


class UnassignedActivityNotification(ActivityNotification):
    def get_activity_name(self) -> str:
        return "Unassigned"

    def get_description(self) -> Tuple[str, Mapping[str, Any], Mapping[str, Any]]:
        return "{author} unassigned {an issue}", {}, {}

    def get_category(self) -> str:
        return "unassigned_activity_email"

    @property
    def is_message_issue_unfurl(self) -> bool:
        return True

    def get_notification_title(self) -> str:
        user = self.activity.user
        if user:
            author = user.name or user.email
        else:
            author = "Sentry"
        return f"Issue unassigned by {author}"
