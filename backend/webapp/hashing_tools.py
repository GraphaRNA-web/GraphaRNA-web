import hashlib
import base64

from django.conf import settings


# Hash a UUID to a shorter string suitable for URLs, with length defined in .env
def hash_uuid(data: str) -> str:
    h = hashlib.blake2b(
        digest_size=12
    )  # 12 bytes, after encoding will be 16 characters
    h.update(data.encode())
    digest = h.digest()
    b64 = base64.urlsafe_b64encode(digest).rstrip(b"=").decode()
    return b64[: settings.UUID_HASH_LENGTH]
