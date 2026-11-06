# <gen>render_docs_setup
import os

import mailslurp_client


def create_client():
    api_key = os.environ.get("MAILSLURP_API_KEY")
    if not api_key:
        raise RuntimeError("Set MAILSLURP_API_KEY")
    configuration = mailslurp_client.Configuration()
    configuration.api_key["x-api-key"] = api_key
    return mailslurp_client.ApiClient(configuration)
# </gen>


# <gen>render_docs_list_targets
def list_targets(api_client):
    # Each target is one email client on one device, for example ios_mail_physical_device.
    availability = mailslurp_client.DevicePreviewsControllerApi(
        api_client
    ).get_device_preview_native_target_availability()
    return [(t.target, t.client, t.platform, t.status) for t in availability.targets if t.enabled]
# </gen>


# <gen>render_docs_create_from_html
def render_html(api_client, html):
    # Render HTML directly, without sending it to an inbox first.
    return mailslurp_client.DevicePreviewsControllerApi(
        api_client
    ).create_device_preview_run_from_html_import(
        mailslurp_client.CreateDevicePreviewHtmlImportOptions(
            html=html,
            subject="Spring sale preview",
            options=mailslurp_client.CreateDevicePreviewOptions(
                targets=["gmail_chromium_web", "ios_mail_physical_device"]
            ),
        )
    )
# </gen>


# <gen>render_docs_create_from_email
def render_email(api_client, email_id):
    # Render an email already received by a MailSlurp inbox, for example from your ESP.
    return mailslurp_client.DevicePreviewsControllerApi(api_client).create_device_preview_run(
        email_id,
        create_device_preview_options=mailslurp_client.CreateDevicePreviewOptions(all_targets=True),
    )
# </gen>


# <gen>render_docs_wait
def wait_for_run(api_client, run_id):
    # Each call waits on the server for up to 60 seconds, so wait in rounds.
    previews = mailslurp_client.DevicePreviewsControllerApi(api_client)
    for _ in range(5):
        result = previews.wait_for_device_preview_run(
            run_id, timeout_millis=60_000, poll_interval_millis=5_000
        )
        if not result.timed_out:
            return result.run
    raise TimeoutError(f"Render {run_id} is still running after 5 minutes")
# </gen>


# <gen>render_docs_screenshots
def screenshots(api_client, run_id):
    results = mailslurp_client.DevicePreviewsControllerApi(
        api_client
    ).get_device_preview_run_results(run_id)
    # access_url is an authenticated image URL for each captured screenshot.
    return [(shot.title, shot.access_url) for shot in results.screenshots]
# </gen>
