lint:
	mypy .   --exclude '/(venv|migrations|.venv|Scripts)/'
	ruff check .
	black --check .

format:
	black .   --exclude '/(venv|migrations|.venv)/'
	pycln .   --exclude venv --exclude migrations --exclude .venv