# Generated by Django 1.11.29 on 2021-03-03 22:11

import django.db.models.deletion
from django.db import migrations, models

import sentry.db.models.fields.bounded
import sentry.db.models.fields.foreignkey


class Migration(migrations.Migration):
    # This flag is used to mark that a migration shouldn't be automatically run in
    # production. We set this to True for operations that we think are risky and want
    # someone from ops to run manually and monitor.
    # General advice is that if in doubt, mark your migration as `is_dangerous`.
    # Some things you should always mark as dangerous:
    # - Large data migrations. Typically we want these to be run manually by ops so that
    #   they can be monitored. Since data migrations will now hold a transaction open
    #   this is even more important.
    # - Adding columns to highly active tables, even ones that are NULL.
    is_dangerous = True

    # This flag is used to decide whether to run this migration in a transaction or not.
    # By default we prefer to run in a transaction, but for migrations where you want
    # to `CREATE INDEX CONCURRENTLY` this needs to be set to False. Typically you'll
    # want to create an index concurrently when adding one to an existing table.
    # You'll also usually want to set this to `False` if you're writing a data
    # migration, since we don't want the entire migration to run in one long-running
    # transaction.
    atomic = False

    dependencies = [
        ("sentry", "0169_delete_organization_integration_from_projectcodeowners"),
    ]

    operations = [
        migrations.CreateModel(
            name="Actor",
            fields=[
                (
                    "id",
                    sentry.db.models.fields.bounded.BoundedBigAutoField(
                        primary_key=True, serialize=False
                    ),
                ),
                (
                    "type",
                    models.PositiveSmallIntegerField(
                        choices=[
                            (0, "team"),
                            (1, "user"),
                        ]
                    ),
                ),
            ],
            options={
                "db_table": "sentry_actor",
            },
        ),
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(
                    """
                    ALTER TABLE sentry_team ADD COLUMN "actor_id" bigint NULL;
                    ALTER TABLE auth_user ADD COLUMN "actor_id" bigint NULL;
                    """,
                    reverse_sql="""
                    ALTER TABLE sentry_team DROP COLUMN "actor_id";
                    ALTER TABLE auth_user DROP COLUMN "actor_id";
                    """,
                    hints={"tables": ["sentry_team", "auth_user"]},
                ),
                migrations.RunSQL(
                    """
                    CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS sentry_team_actor_idx ON sentry_team (actor_id);
                    """,
                    reverse_sql="""
                    DROP INDEX CONCURRENTLY IF EXISTS sentry_team_actor_idx;
                    """,
                    hints={"tables": ["sentry_team"]},
                ),
                migrations.RunSQL(
                    """
                    ALTER TABLE sentry_team ADD CONSTRAINT "sentry_team_actor_idx_fk_sentry_actor_id" FOREIGN KEY ("actor_id") REFERENCES "sentry_actor" ("id") DEFERRABLE INITIALLY DEFERRED;
                    """,
                    reverse_sql="""
                    ALTER TABLE sentry_team DROP CONSTRAINT IF EXISTS sentry_team_actor_idx_fk_sentry_actor_id;
                    """,
                    hints={"tables": ["sentry_actor"]},
                ),
                migrations.RunSQL(
                    """
                    CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS auth_user_actor_idx ON auth_user (actor_id);
                    """,
                    reverse_sql="""
                    DROP INDEX CONCURRENTLY IF EXISTS auth_user_actor_idx;
                    """,
                    hints={"tables": ["auth_user"]},
                ),
                migrations.RunSQL(
                    """
                    ALTER TABLE auth_user ADD CONSTRAINT "auth_user_actor_idx_fk_sentry_actor_id" FOREIGN KEY ("actor_id") REFERENCES "sentry_actor" ("id") DEFERRABLE INITIALLY DEFERRED;
                    """,
                    reverse_sql="""
                    ALTER TABLE sentry_team DROP CONSTRAINT IF EXISTS auth_user_actor_idx_fk_sentry_actor_id;
                    """,
                    hints={"tables": ["sentry_team"]},
                ),
            ],
            state_operations=[
                migrations.AddField(
                    model_name="team",
                    name="actor",
                    field=sentry.db.models.fields.foreignkey.FlexibleForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.PROTECT,
                        to="sentry.Actor",
                        unique=True,
                    ),
                ),
                migrations.AddField(
                    model_name="user",
                    name="actor",
                    field=sentry.db.models.fields.foreignkey.FlexibleForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.PROTECT,
                        to="sentry.Actor",
                        unique=True,
                    ),
                ),
            ],
        ),
    ]
