import subprocess
import sys
from pathlib import Path
from typing import Optional, List

# Ścieżki
BACKEND_DIR: Path = Path(__file__).resolve().parent
VENV_DIR: Path = BACKEND_DIR / ".venv"
REQUIREMENTS_FILE: Path = BACKEND_DIR / "requirements.txt"
MYPY_CONFIG: Path = BACKEND_DIR / "mypy.ini"

def run_command(command: List[str], cwd: Optional[Path] = None) -> None:
    """Uruchamia polecenie w subprocessie i wypisuje wynik."""
    print(f"\nRunning: {' '.join(command)}")
    result = subprocess.run(command, cwd=cwd, shell=True)
    if result.returncode != 0:
        print("Command failed.")
        sys.exit(result.returncode)

def run_mypy() -> None:
    """Uruchamia mypy z konfiguracją."""
    print("Running mypy...")
    mypy_path: Path = VENV_DIR / "Scripts" / "mypy.exe"
    run_command([str(mypy_path), str(BACKEND_DIR), "--config-file", str(MYPY_CONFIG)])

def run_ruff() -> None:
    """Uruchamia ruff linting."""
    print("Running ruff...")
    ruff_path: Path = VENV_DIR / "Scripts" / "ruff.exe"
    run_command([str(ruff_path), "check", str(BACKEND_DIR)])

def main() -> None:
    print("Starting Django code audit")
    run_mypy()
    run_ruff()
    print("\nCode audit completed successfully!")

if __name__ == "__main__":
    main()