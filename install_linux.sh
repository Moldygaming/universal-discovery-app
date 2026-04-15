#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$SCRIPT_DIR"
VENV_DIR="$APP_DIR/.venv"
ENV_FILE="$APP_DIR/.env"
ENV_EXAMPLE_FILE="$APP_DIR/.env.example"
DATA_DIR="$APP_DIR/data"
PORT="8080"

INSTALL_SYSTEMD="0"
INSTALL_OS_PACKAGES="1"

log_info() {
  echo "[INFO] $*"
}

log_warn() {
  echo "[WARN] $*"
}

log_error() {
  echo "[ERROR] $*" >&2
}

usage() {
  cat <<EOF
Usage: ./install_linux.sh [options]

Options:
  --systemd           Install and start a systemd service after setup.
  --port <port>       Port for uvicorn (default: 8080).
  --no-os-packages    Skip OS package installation.
  -h, --help          Show this help.

Examples:
  ./install_linux.sh
  ./install_linux.sh --systemd --port 8080
EOF
}

require_linux() {
  if [[ "$(uname -s)" != "Linux" ]]; then
    log_error "This installer supports Linux only."
    exit 1
  fi
}

run_as_root_or_sudo() {
  if [[ "$(id -u)" -eq 0 ]]; then
    "$@"
  elif command -v sudo >/dev/null 2>&1; then
    sudo "$@"
  else
    log_error "Root privileges are required but sudo is not available."
    exit 1
  fi
}

install_os_packages() {
  if [[ "$INSTALL_OS_PACKAGES" != "1" ]]; then
    log_info "Skipping OS package installation (--no-os-packages)."
    return
  fi

  log_info "Installing required OS packages if needed..."

  if command -v apt-get >/dev/null 2>&1; then
    run_as_root_or_sudo apt-get update
    run_as_root_or_sudo apt-get install -y python3 python3-venv python3-pip iputils-ping
    return
  fi

  if command -v dnf >/dev/null 2>&1; then
    run_as_root_or_sudo dnf install -y python3 python3-pip iputils
    return
  fi

  if command -v yum >/dev/null 2>&1; then
    run_as_root_or_sudo yum install -y python3 python3-pip iputils
    return
  fi

  if command -v zypper >/dev/null 2>&1; then
    run_as_root_or_sudo zypper --non-interactive install python3 python3-pip iputils
    return
  fi

  if command -v pacman >/dev/null 2>&1; then
    run_as_root_or_sudo pacman -Sy --noconfirm python python-pip iputils
    return
  fi

  log_warn "No supported package manager found. Install python3, python3-venv, python3-pip, and ping utility manually."
}

ensure_python() {
  if ! command -v python3 >/dev/null 2>&1; then
    log_error "python3 not found. Install Python 3.10+ and rerun."
    exit 1
  fi
}

setup_venv() {
  if [[ ! -d "$VENV_DIR" ]]; then
    log_info "Creating virtual environment at $VENV_DIR"
    python3 -m venv "$VENV_DIR"
  else
    log_info "Using existing virtual environment at $VENV_DIR"
  fi

  "$VENV_DIR/bin/python" -m pip install --upgrade pip
  "$VENV_DIR/bin/pip" install -r "$APP_DIR/requirements.txt"
}

initialize_env_file() {
  if [[ -f "$ENV_FILE" ]]; then
    log_info "Environment file already exists at $ENV_FILE"
    return
  fi

  if [[ -f "$ENV_EXAMPLE_FILE" ]]; then
    cp "$ENV_EXAMPLE_FILE" "$ENV_FILE"
    log_info "Created $ENV_FILE from .env.example"
  else
    cat > "$ENV_FILE" <<EOF
UDA_APP_NAME=Universal Discovery Server
UDA_JWT_SECRET=change-me-in-production
UDA_JWT_EXP_MIN=120
UDA_DB_URL=sqlite:///./data/discovery.db
UDA_BOOTSTRAP_ADMIN=admin
UDA_DEFAULT_ADMIN_PASSWORD=Admin123!
EOF
    log_info "Created minimal $ENV_FILE"
  fi
}

set_random_jwt_secret_if_default() {
  local current_value
  current_value="$(grep -E '^UDA_JWT_SECRET=' "$ENV_FILE" | head -n 1 | cut -d'=' -f2- || true)"

  if [[ "$current_value" != "change-me-in-production" ]]; then
    return
  fi

  local new_secret
  new_secret="$("$VENV_DIR/bin/python" - <<'PY'
import secrets
print(secrets.token_urlsafe(48))
PY
)"

  "$VENV_DIR/bin/python" - "$ENV_FILE" "$new_secret" <<'PY'
import pathlib
import re
import sys

env_path = pathlib.Path(sys.argv[1])
new_secret = sys.argv[2]
content = env_path.read_text(encoding="utf-8")
content = re.sub(r"^UDA_JWT_SECRET=.*$", f"UDA_JWT_SECRET={new_secret}", content, flags=re.MULTILINE)
env_path.write_text(content, encoding="utf-8")
PY

  log_info "Replaced default JWT secret in $ENV_FILE"
}

ensure_data_dir() {
  mkdir -p "$DATA_DIR"
}

install_systemd_service() {
  if [[ "$INSTALL_SYSTEMD" != "1" ]]; then
    return
  fi

  if ! command -v systemctl >/dev/null 2>&1; then
    log_error "systemd not found (systemctl missing), cannot install service."
    exit 1
  fi

  local run_user
  run_user="${SUDO_USER:-$(id -un)}"

  local service_file
  service_file="/etc/systemd/system/universal-discovery.service"

  log_info "Installing systemd service at $service_file"

  run_as_root_or_sudo tee "$service_file" >/dev/null <<EOF
[Unit]
Description=Universal Discovery Server
After=network.target

[Service]
Type=simple
User=$run_user
WorkingDirectory=$APP_DIR
EnvironmentFile=$ENV_FILE
ExecStart=$VENV_DIR/bin/uvicorn app.main:app --host 0.0.0.0 --port $PORT
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

  run_as_root_or_sudo systemctl daemon-reload
  run_as_root_or_sudo systemctl enable --now universal-discovery.service
  run_as_root_or_sudo systemctl status universal-discovery.service --no-pager || true
}

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --systemd)
        INSTALL_SYSTEMD="1"
        shift
        ;;
      --port)
        if [[ $# -lt 2 ]]; then
          log_error "--port requires a value"
          exit 1
        fi
        PORT="$2"
        shift 2
        ;;
      --no-os-packages)
        INSTALL_OS_PACKAGES="0"
        shift
        ;;
      -h|--help)
        usage
        exit 0
        ;;
      *)
        log_error "Unknown argument: $1"
        usage
        exit 1
        ;;
    esac
  done
}

main() {
  parse_args "$@"
  require_linux
  install_os_packages
  ensure_python
  setup_venv
  initialize_env_file
  set_random_jwt_secret_if_default
  ensure_data_dir
  install_systemd_service

  log_info "Install complete."

  if [[ "$INSTALL_SYSTEMD" == "1" ]]; then
    log_info "Service is running via systemd: universal-discovery.service"
    log_info "Open: http://localhost:$PORT"
    return
  fi

  cat <<EOF

Run the app manually:
  source "$VENV_DIR/bin/activate"
  cd "$APP_DIR"
  uvicorn app.main:app --host 0.0.0.0 --port $PORT

Then open:
  http://localhost:$PORT
EOF
}

main "$@"
