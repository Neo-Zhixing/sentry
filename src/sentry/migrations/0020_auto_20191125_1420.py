# Generated by Django 1.9.13 on 2019-11-25 14:20

from django.db import migrations

from sentry import eventstore
from sentry.utils.query import RangeQuerySetWrapper


def backfill_group_ids(model):
    query = model.objects.filter(group_id__isnull=True)

    for attachment in RangeQuerySetWrapper(query, step=1000):
        event = eventstore.get_event_by_id(attachment.project_id, attachment.event_id)
        if event:
            model.objects.filter(id=attachment.id).update(group_id=event.group_id)


def forwards(apps, schema_editor):
    EventAttachment = apps.get_model("sentry", "EventAttachment")
    backfill_group_ids(EventAttachment)


class Migration(migrations.Migration):
    # This flag is used to mark that a migration shouldn't be automatically run in
    # production. We set this to True for operations that we think are risky and want
    # someone from ops to run manually and monitor.
    # General advice is that if in doubt, mark your migration as `is_dangerous`.
    # Some things you should always mark as dangerous:
    # - Adding indexes to large tables. These indexes should be created concurrently,
    #   unfortunately we can't run migrations outside of a transaction until Django
    #   1.10. So until then these should be run manually.
    # - Large data migrations. Typically we want these to be run manually by ops so that
    #   they can be monitored. Since data migrations will now hold a transaction open
    #   this is even more important.
    # - Adding columns to highly active tables, even ones that are NULL.
    is_dangerous = True

    dependencies = [
        ("sentry", "0019_auto_20191114_2040"),
    ]

    operations = [
        migrations.RunPython(
            forwards,
            migrations.RunPython.noop,
            hints={"tables": ["sentry_eventattachment"]},
        )
    ]
