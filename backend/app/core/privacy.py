"""
Utilities for masking personally identifiable information (PII) for GDPR-style privacy.
"""
from __future__ import annotations

from typing import Literal, Mapping, Any

MaskPhoneMode = Literal["first2_last2", "last4"]


def mask_phone(phone: str | None, mode: MaskPhoneMode = "first2_last2") -> str | None:
    if not phone:
        return phone
    s = str(phone)
    n = len(s)
    if n <= 2:
        return "X" * n
    if mode == "last4":
        if n <= 4:
            return "X" * (n - 1) + s[-1]
        return "X" * (n - 4) + s[-4:]
    # default: first2_last2
    if n <= 4:
        return s[0] + ("X" * (n - 2)) + s[-1]
    keep_front = 2
    keep_back = 2
    mask_len = max(0, n - (keep_front + keep_back))
    return s[:keep_front] + ("X" * mask_len) + s[-keep_back:]


def mask_email(email: str | None) -> str | None:
    if not email or "@" not in email:
        return email
    local, domain = email.split("@", 1)
    # Show more of local part for recognition: keep first 2 and last 2 when possible
    L = len(local)
    if L == 0:
        masked_local = ""
    elif L == 1:
        masked_local = local[0] + ""
    elif L == 2:
        masked_local = local[0] + "X"
    elif L == 3:
        masked_local = local[0] + "X" + local[-1]
    elif L == 4:
        masked_local = local[:2] + "XX"
    else:
        masked_local = local[:2] + ("X" * (L - 4)) + local[-2:]

    # Keep domain fully visible to aid recognition (e.g., gmail.com)
    return f"{masked_local}@{domain}"


def mask_contact_dict(data: Mapping[str, Any], phone_key: str = "phone_number", email_key: str = "email") -> dict:
    d = dict(data)
    if phone_key in d:
        d[phone_key] = mask_phone(d.get(phone_key))
    if email_key in d:
        d[email_key] = mask_email(d.get(email_key))
    return d
