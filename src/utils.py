import os
import sys

def setup_directories(base_dir):
    """Ensure that required directories (models, outputs) exist."""
    models_dir = os.path.join(base_dir, "models")
    outputs_dir = os.path.join(base_dir, "outputs")
    os.makedirs(models_dir, exist_ok=True)
    os.makedirs(outputs_dir, exist_ok=True)
    return models_dir, outputs_dir

def log_status(message, level="INFO"):
    """Format and print status messages with dynamic styling."""
    prefix = f"[{level}]"
    if level == "INFO":
        print(f"\033[94m{prefix}\033[0m {message}")
    elif level == "SUCCESS":
        print(f"\033[92m{prefix}\033[0m {message}")
    elif level == "WARNING":
        print(f"\033[93m{prefix}\033[0m {message}")
    elif level == "ERROR":
        print(f"\033[91m{prefix}\033[0m {message}", file=sys.stderr)
    else:
        print(f"{prefix} {message}")
