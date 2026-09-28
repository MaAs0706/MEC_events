"""Server-side Cloudinary storage for NEXUS media assets.

The browser never receives the Cloudinary API secret. Routes validate the
request and event ownership first, then this module uploads the approved bytes.
"""

from io import BytesIO
import os

import cloudinary
import cloudinary.uploader


class MediaStorageError(RuntimeError):
    """A safe, user-facing storage failure."""


def _configure_cloudinary() -> None:
    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")
    api_key = os.getenv("CLOUDINARY_API_KEY")
    api_secret = os.getenv("CLOUDINARY_API_SECRET")
    if not all([cloud_name, api_key, api_secret]):
        raise MediaStorageError("Image storage is not configured. Contact the administrator.")

    cloudinary.config(
        cloud_name=cloud_name,
        api_key=api_key,
        api_secret=api_secret,
        secure=True,
    )


def upload_image(contents: bytes, folder: str) -> dict[str, str]:
    """Upload validated image bytes and return its HTTPS URL and public ID."""
    _configure_cloudinary()
    stream = BytesIO(contents)
    stream.name = "nexus-upload"

    try:
        result = cloudinary.uploader.upload(
            stream,
            resource_type="image",
            folder=folder,
            overwrite=False,
            unique_filename=True,
            use_filename=False,
            tags=["nexus"],
        )
    except Exception as exc:
        raise MediaStorageError("Image upload failed. Please try again.") from exc

    secure_url = result.get("secure_url")
    public_id = result.get("public_id")
    if not secure_url or not public_id:
        raise MediaStorageError("Image storage returned an incomplete upload result.")
    return {"url": secure_url, "public_id": public_id}


def delete_image(public_id: str | None) -> None:
    """Delete an asset when it is no longer referenced by NEXUS."""
    if not public_id:
        return
    _configure_cloudinary()
    try:
        result = cloudinary.uploader.destroy(public_id, resource_type="image", invalidate=True)
    except Exception as exc:
        raise MediaStorageError("Image deletion failed. Please try again.") from exc

    if result.get("result") not in {"ok", "not found"}:
        raise MediaStorageError("Image deletion could not be confirmed.")
