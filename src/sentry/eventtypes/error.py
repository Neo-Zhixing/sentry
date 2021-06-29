from sentry.utils.safe import get_path, trim
from sentry.utils.strings import truncatechars

from .base import BaseEvent


def get_crash_location(data):
    from sentry.stacktraces.processing import get_crash_frame_from_event_data

    frame = get_crash_frame_from_event_data(
        data, frame_filter=lambda x: x.get("function") not in (None, "<redacted>", "<unknown>")
    )
    if frame is not None:
        from sentry.stacktraces.functions import get_function_name_for_frame

        func = get_function_name_for_frame(frame, data.get("platform"))
        return frame.get("filename") or frame.get("abs_path"), func


def format_title_from_tree_label(tree_label):
    return " | ".join(tree_label)


class ErrorEvent(BaseEvent):
    key = "error"

    def extract_metadata(self, data):
        exception = get_path(data, "exception", "values", -1)
        if not exception:
            return {}

        loc = get_crash_location(data)
        rv = {"value": trim(get_path(exception, "value", default=""), 1024)}

        # If the exception mechanism indicates a synthetic exception we do not
        # want to record the type and value into the metadata.
        if not get_path(exception, "mechanism", "synthetic"):
            rv["type"] = trim(get_path(exception, "type", default="Error"), 128)

        # Attach crash location if available
        if loc is not None:
            fn, func = loc
            if fn:
                rv["filename"] = fn
            if func:
                rv["function"] = func

        return rv

    def compute_title(self, metadata):
        if metadata.get("current_tree_label"):
            return format_title_from_tree_label(metadata["current_tree_label"])

        if metadata.get("finest_tree_label"):
            return format_title_from_tree_label(metadata["finest_tree_label"])

        ty = metadata.get("type")
        if ty is None:
            return metadata.get("function") or "<unknown>"
        if not metadata.get("value"):
            return ty

        return "{}: {}".format(ty, truncatechars(metadata["value"].splitlines()[0], 100))

    def get_location(self, metadata):
        return metadata.get("filename")
