# filepath: c:\Users\priya\Projects\eDrop-UrbanHive\edrop-wms\backend\tests\utils.py
import random
import string

def random_lower_string(length: int = 8) -> str:
    """Generates a random lowercase string of a given length."""
    return "".join(random.choices(string.ascii_lowercase, k=length))

def random_email() -> str:
    """Generates a random email address."""
    return f"{random_lower_string()}@{random_lower_string()}.com"