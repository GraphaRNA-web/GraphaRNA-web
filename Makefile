.PHONY: run restart

run:
    @echo "[MAKE] Starting application…"
    @bash ./start_app.sh

restart:
    @echo "[MAKE] Restarting application…"
    @bash ./restart_app.sh
