#!/usr/bin/env bash

set -e

CONFIG_FILE="rsync-variables.sh"

# Load existing configuration if available
if [[ -f "$CONFIG_FILE" ]]; then
    source "$CONFIG_FILE"
    echo
fi

echo "=== Nuufluff rsync setup ==="
echo "This script will setup nuucast rsync deploy to automatically copy files from your computer to the server."

echo "1) Set server variables for rsync-variables.sh"

# Username
DEFAULT_USERNAME="${USERNAME:-}"
read -rp "Server Username [$DEFAULT_USERNAME]: " INPUT
USERNAME="${INPUT:-$DEFAULT_USERNAME}"

# Hostname
DEFAULT_HOSTNAME="${HOSTNAME:-}"
read -rp "Hostname / IP address [$DEFAULT_HOSTNAME]: " INPUT
HOSTNAME="${INPUT:-$DEFAULT_HOSTNAME}"

# Port
DEFAULT_PORT="${PORT:-22}"
read -rp "SSH Port [$DEFAULT_PORT]: " INPUT
PORT="${INPUT:-$DEFAULT_PORT}"

# SSH key name
read -rp "SSH Key Name [nuucast]" INPUT
SSH_KEY_NAME="${INPUT:-nuucast}"

echo "Need 2 paths for SSH keys, one for your computer, one for server:"

read -rp "Your SSH Key Directory [~/.ssh/]: " SSH_KEY_DIRECTORY
SSH_KEY_DIRECTORY="${SSH_KEY_DIRECTORY:-$HOME/.ssh/}"

# Add trailing slash if missing
[[ "$SSH_KEY_DIRECTORY" != */ ]] && SSH_KEY_DIRECTORY+="/"
if [[ "$SSH_KEY_DIRECTORY" == "~/"* ]]; then
    SSH_KEY_DIRECTORY="$HOME/${SSH_KEY_DIRECTORY#~/}"
fi

read -rp "Files destination on server (eg: /var/www/nuucast/): " DESTINATION_ROOT

# ------------------------------------------------------------
# SSH key
# ------------------------------------------------------------

echo
echo "2) Create SSH key for server so we don't have to ask for password when copying files:"

SSH_KEY_PATH="$SSH_KEY_DIRECTORY$SSH_KEY_NAME"
echo "SSH key: $SSH_KEY_PATH"

SSH_KEY_EXISTED=false

if [[ -e "$SSH_KEY_PATH" || -e "${SSH_KEY_PATH}.pub" ]]; then
    read -rp "Overwrite existing SSH key? [y/N]: " OVERWRITE_KEY

    if [[ "$OVERWRITE_KEY" =~ ^[Yy]$ ]]; then
        echo "Removing old keys $SSH_KEY_PATH $SSH_KEY_PATH.pub"
        rm -f "$SSH_KEY_PATH" "${SSH_KEY_PATH}.pub"

        mkdir -p "$(dirname "$SSH_KEY_PATH")"

        echo "ssh-keygen -t ed25519  -f $SSH_KEY_PATH -C nuucast server rsync"
        ssh-keygen \
            -t ed25519 \
            -f "$SSH_KEY_PATH" \
            -C "nuucast server rsync"
    else
        echo "Keeping existing SSH key."
        SSH_KEY_EXISTED=true
    fi
else
    echo "Generating SSH key..."

    mkdir -p "$(dirname "$SSH_KEY_PATH")"

    echo "ssh-keygen -t ed25519  -f $SSH_KEY_PATH -C nuucast server rsync"
    ssh-keygen \
        -t ed25519 \
        -f "$SSH_KEY_PATH" \
        -C "nuucast server rsync"
fi

# ------------------------------------------------------------
# Install public key on remote
# ------------------------------------------------------------

echo "3) Add SSH Key to server"
# If this setup created a new key, automatically push it.
# If the key already existed, ask first.
if [[ "$SSH_KEY_EXISTED" == false ]]; then
    PUSH_KEY="Y"
else
    read -rp "Key existed, want to push the SSH public key to ${USERNAME}@${HOSTNAME}? [Y/n]: " PUSH_KEY
    PUSH_KEY="${PUSH_KEY:-Y}"
fi

if [[ "$PUSH_KEY" =~ ^[Yy]$ ]]; then
    if [[ ! -f "${SSH_KEY_PATH}.pub" ]]; then
        echo "ERROR: Public key not found:"
        echo "${SSH_KEY_PATH}.pub"
        exit 1
    fi

    echo "Installing public key on $HOSTNAME..."
    echo "You may be asked for the $USERNAME password."

    echo "ssh-copy-id -i $SSH_KEY_PATH.pub -p $PORT $USERNAME@$HOSTNAME"

    ssh-copy-id \
        -i "${SSH_KEY_PATH}.pub" \
        -p "$PORT" \
        "${USERNAME}@${HOSTNAME}"
fi

if ! ssh-add -l | grep -q "$(ssh-keygen -lf "$SSH_KEY_PATH" | awk '{print $2}')"; then
    echo "3.1) Adding automatic SSH key agent"
    echo "ssh-add $SSH_KEY_PATH..."
    ssh-add "$SSH_KEY_PATH"
fi

# ------------------------------------------------------------
# Write configuration
# ------------------------------------------------------------

echo "4) Create rsync-variables.sh"

cat > "$CONFIG_FILE" <<EOF
USERNAME=$(printf '%q' "$USERNAME")
HOSTNAME=$(printf '%q' "$HOSTNAME")
PORT=$(printf '%q' "$PORT")
DESTINATION_ROOT=$(printf '%q' "$DESTINATION_ROOT")
SSH_KEY_PATH=$(printf '%q' "$SSH_KEY_PATH")
EOF

echo "==================="
echo "rsync-setup finished, should be possible to ssh to server now."


