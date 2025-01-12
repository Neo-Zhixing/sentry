from collections import defaultdict
from typing import (
    AbstractSet,
    Any,
    Iterable,
    Mapping,
    MutableMapping,
    MutableSequence,
    Optional,
    Sequence,
    Set,
)

from django.db.models import Count

from sentry import roles
from sentry.api.serializers import Serializer, register, serialize
from sentry.app import env
from sentry.auth.superuser import is_active_superuser
from sentry.models import (
    ExternalActor,
    InviteStatus,
    OrganizationAccessRequest,
    OrganizationMember,
    OrganizationMemberTeam,
    ProjectStatus,
    ProjectTeam,
    Team,
    TeamAvatar,
    User,
)
from sentry.scim.endpoints.constants import SCIM_SCHEMA_GROUP
from sentry.utils.compat import zip
from sentry.utils.json import JSONData
from sentry.utils.query import RangeQuerySetWrapper


def get_team_memberships(team_list: Sequence[Team], user: User) -> Iterable[int]:
    """Get memberships the user has in the provided team list"""
    if not user.is_authenticated:
        return []

    team_ids: Iterable[int] = OrganizationMemberTeam.objects.filter(
        organizationmember__user=user, team__in=team_list
    ).values_list("team", flat=True)
    return team_ids


def get_member_totals(team_list: Sequence[Team], user: User) -> Mapping[str, int]:
    """Get the total number of members in each team"""
    if not user.is_authenticated:
        return {}

    query = (
        Team.objects.filter(
            id__in=[t.pk for t in team_list],
            organizationmember__invite_status=InviteStatus.APPROVED.value,
        )
        .annotate(member_count=Count("organizationmemberteam"))
        .values("id", "member_count")
    )
    return {item["id"]: item["member_count"] for item in query}


def get_org_roles(org_ids: Set[int], user: User) -> Mapping[int, str]:
    """Get the role the user has in each org"""
    if not user.is_authenticated:
        return {}

    # map of org id to role
    return {
        om["organization_id"]: om["role"]
        for om in OrganizationMember.objects.filter(
            user=user, organization__in=set(org_ids)
        ).values("role", "organization_id")
    }


def get_access_requests(item_list: Sequence[Team], user: User) -> AbstractSet[Team]:
    if user.is_authenticated:
        return frozenset(
            OrganizationAccessRequest.objects.filter(
                team__in=item_list, member__user=user
            ).values_list("team", flat=True)
        )
    return frozenset()


@register(Team)
class TeamSerializer(Serializer):  # type: ignore
    def get_attrs(
        self, item_list: Sequence[Team], user: User, **kwargs: Any
    ) -> MutableMapping[Team, MutableMapping[str, Any]]:
        request = env.request
        org_ids = {t.organization_id for t in item_list}

        org_roles = get_org_roles(org_ids, user)

        member_totals = get_member_totals(item_list, user)
        memberships = get_team_memberships(item_list, user)
        access_requests = get_access_requests(item_list, user)

        avatars = {a.team_id: a for a in TeamAvatar.objects.filter(team__in=item_list)}

        is_superuser = request and is_active_superuser(request) and request.user == user
        result: MutableMapping[Team, MutableMapping[str, Any]] = {}

        for team in item_list:
            is_member = team.id in memberships
            org_role = org_roles.get(team.organization_id)
            if is_member:
                has_access = True
            elif is_superuser:
                has_access = True
            elif team.organization.flags.allow_joinleave:
                has_access = True
            elif org_role and roles.get(org_role).is_global:
                has_access = True
            else:
                has_access = False
            result[team] = {
                "pending_request": team.id in access_requests,
                "is_member": is_member,
                "has_access": has_access,
                "avatar": avatars.get(team.id),
                "member_count": member_totals.get(team.id, 0),
            }
        return result

    def serialize(
        self, obj: Team, attrs: Mapping[str, Any], user: Any, **kwargs: Any
    ) -> MutableMapping[str, JSONData]:
        if attrs.get("avatar"):
            avatar = {
                "avatarType": attrs["avatar"].get_avatar_type_display(),
                "avatarUuid": attrs["avatar"].ident if attrs["avatar"].file_id else None,
            }
        else:
            avatar = {"avatarType": "letter_avatar", "avatarUuid": None}
        return {
            "id": str(obj.id),
            "slug": obj.slug,
            "name": obj.name,
            "dateCreated": obj.date_added,
            "isMember": attrs["is_member"],
            "hasAccess": attrs["has_access"],
            "isPending": attrs["pending_request"],
            "memberCount": attrs["member_count"],
            "avatar": avatar,
        }


class TeamWithProjectsSerializer(TeamSerializer):
    def get_attrs(
        self, item_list: Sequence[Team], user: Any, **kwargs: Any
    ) -> MutableMapping[Team, MutableMapping[str, Any]]:
        project_teams = list(
            ProjectTeam.objects.filter(team__in=item_list, project__status=ProjectStatus.VISIBLE)
            .order_by("project__name", "project__slug")
            .select_related("project")
        )

        actor_mapping = {team.actor_id: team for team in item_list}
        external_actors = list(ExternalActor.objects.filter(actor_id__in=actor_mapping.keys()))

        # TODO(dcramer): we should query in bulk for ones we're missing here
        orgs = {i.organization_id: i.organization for i in item_list}

        for project_team in project_teams:
            project_team.project._organization_cache = orgs[project_team.project.organization_id]

        projects = [pt.project for pt in project_teams]
        projects_by_id = {
            project.id: data for project, data in zip(projects, serialize(projects, user))
        }

        project_map = defaultdict(list)
        for project_team in project_teams:
            project_map[project_team.team_id].append(projects_by_id[project_team.project_id])

        external_teams_map = defaultdict(list)
        serialized_list = serialize(external_actors, user, key="team")
        for serialized in serialized_list:
            external_teams_map[serialized["teamId"]].append(serialized)

        result = super().get_attrs(item_list, user)
        for team in item_list:
            result[team]["projects"] = project_map[team.id]
            result[team]["externalTeams"] = external_teams_map[str(team.id)]
        return result

    def serialize(
        self, obj: Team, attrs: Mapping[str, Any], user: Any, **kwargs: Any
    ) -> MutableMapping[str, JSONData]:
        d = super().serialize(obj, attrs, user)
        d["projects"] = attrs["projects"]
        d["externalTeams"] = attrs["externalTeams"]
        return d


def get_scim_teams_members(
    team_list: Sequence[Team],
) -> MutableMapping[Team, MutableSequence[MutableMapping[str, Any]]]:
    members = RangeQuerySetWrapper(
        OrganizationMember.objects.filter(teams__in=team_list)
        .select_related("user")
        .prefetch_related("teams")
        .distinct("id"),
        limit=10000,
    )
    member_map: MutableMapping[Team, MutableSequence[MutableMapping[str, Any]]] = defaultdict(list)
    for member in members:
        for team in member.teams.all():
            member_map[team].append({"value": str(member.id), "display": member.get_email()})
    return member_map


class TeamSCIMSerializer(Serializer):  # type: ignore
    def __init__(
        self,
        expand: Optional[Sequence[str]] = None,
    ) -> None:
        self.expand = expand or []

    def get_attrs(
        self, item_list: Sequence[Team], user: Any, **kwargs: Any
    ) -> MutableMapping[Team, MutableMapping[str, Any]]:

        # return the members key with a None value if we aren't expanding
        # because some SCIM specs say to set it to null
        result: MutableMapping[Team, MutableMapping[str, Any]] = {
            team: {"members": None} for team in item_list
        }

        if "members" in self.expand:
            member_map = get_scim_teams_members(item_list)
            for team in item_list:
                # if there are no members in the team, set to empty array
                result[team]["members"] = member_map.get(team, [])
        return result

    def serialize(
        self, obj: Team, attrs: Mapping[str, Any], user: Any, **kwargs: Any
    ) -> MutableMapping[str, JSONData]:
        return {
            "schemas": [SCIM_SCHEMA_GROUP],
            "id": str(obj.id),
            "displayName": obj.slug,
            "members": attrs["members"],
            "meta": {"resourceType": "Group"},
        }
