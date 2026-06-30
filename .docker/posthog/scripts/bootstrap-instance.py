"""
Bootstrap a local PostHog org/project and personal API key for TradeJournal dev.

Run inside the PostHog web container:
  python manage.py shell < /compose/scripts/bootstrap-instance.py

Prints a single JSON line prefixed with POSTHOG_PROVISION_JSON: for the host provisioner.
"""
import json

from django.utils import timezone

from posthog.models import OrganizationMembership, PersonalAPIKey, Team, User
from posthog.models.utils import generate_random_token_personal, hash_key_value, mask_key_value

DEV_EMAIL = "tradejournal-dev@local.posthog"
DEV_PASSWORD = "tradejournal-local-dev-only"
ORG_NAME = "TradeJournal"
TEAM_NAME = "TradeJournal"
PAT_LABEL = "TradeJournal Platform (local dev)"
PAT_SCOPES = ["query:read", "insight:read", "project:read"]


def get_or_create_setup():
    user = User.objects.filter(email=DEV_EMAIL).first()
    if user:
        org_ids = OrganizationMembership.objects.filter(user=user).values_list(
            "organization_id", flat=True
        )
        team = (
            Team.objects.filter(organization_id__in=org_ids).order_by("id").first()
            or Team.objects.order_by("id").first()
        )
        if team is None:
            raise RuntimeError("PostHog user exists but no project/team was found")
        return user, team, False

    if User.objects.exists():
        user = User.objects.order_by("pk").first()
        team = Team.objects.order_by("id").first()
        if team is None:
            raise RuntimeError("PostHog has users but no projects/teams")
        return user, team, False

    _org, team, user = User.objects.bootstrap(
        organization_name=ORG_NAME,
        email=DEV_EMAIL,
        password=DEV_PASSWORD,
        first_name="TradeJournal",
        is_staff=True,
        team_fields={"name": TEAM_NAME, "completed_snippet_onboarding": True},
    )
    if user.credentials_reviewed_at is None:
        user.credentials_reviewed_at = timezone.now()
        user.save(update_fields=["credentials_reviewed_at"])
    return user, team, True


def get_or_create_pat(user, team):
    existing = PersonalAPIKey.objects.filter(user=user, label=PAT_LABEL).first()
    if existing:
        return None

    api_key_value = generate_random_token_personal()
    PersonalAPIKey.objects.create(
        user=user,
        label=PAT_LABEL,
        secure_value=hash_key_value(api_key_value),
        mask_value=mask_key_value(api_key_value),
        scopes=PAT_SCOPES,
        scoped_teams=[team.id],
        scoped_organizations=[str(team.organization_id)],
    )
    return api_key_value


user, team, created_user = get_or_create_setup()
pat = get_or_create_pat(user, team)

result = {
    "project_id": str(team.id),
    "project_api_key": team.api_token,
    "personal_api_key": pat,
    "pat_exists": pat is None,
    "user_email": user.email,
    "created_user": created_user,
}
print("POSTHOG_PROVISION_JSON:" + json.dumps(result))
