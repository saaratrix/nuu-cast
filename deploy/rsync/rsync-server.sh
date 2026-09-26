echo "Nuufluff rsync to server starting."
echo

if [[ ! -f "./rsync-variables.sh" ]]; then
    echo "rsync-variables.sh not found, please run bash rsync-setup.sh first."
    exit 1
fi

source "./rsync-variables.sh"

# cd to root of the projects.
# nuufluff
# - nuufetch
# - nuu-cast
#   - nuucast
#   - nuuwatch

EXCLUDES=(
    # main nuu-cast folder
    "--exclude=nuu-cast/.git/"
    "--exclude=nuu-cast/.idea/"
    "--exclude=nuu-cast/deploy/"
    "--exclude=nuu-cast/docs/"
    "--exclude=nuu-cast/.gitignore"
    "--exclude=nuu-cast/create-symlinks.ps1"
    "--exclude=nuu-cast/create-symlinks.sh"

    # nuucast folders
    "--exclude=nuu-cast/nuucast/media/"
    "--exclude=nuu-cast/nuucast/temp_files/"
    "--exclude=nuu-cast/nuucast/target/"

    # nuuwatch folders
    "--exclude=nuu-cast/nuuwatch/data/"
    "--exclude=nuu-cast/nuuwatch/downloads/"
    "--exclude=nuu-cast/nuuwatch/frontend/"
    "--exclude=nuu-cast/nuuwatch/target/"

    # nuufetch
    "--exclude=nuufetch/.git/"
    "--exclude=nuufetch/.gitignore"
    "--exclude=nuufetch/nuufetch/target/"
)

cd ../../../

echo "Changed working directory: $PWD"
echo "rsync -aRv --mkpath -e \"ssh -i $SSH_KEY_PATH -p $PORT\" $USERNAME@$HOSTNAME:$DESTINATION_ROOT/"

rsync -aRv \
    --info=progress2 \
    --mkpath \
    -e "ssh -i $SSH_KEY_PATH -p $PORT" \
    "${EXCLUDES[@]}" \
    ./nuu-cast \
    ./nuufetch \
    "$USERNAME@$HOSTNAME:$DESTINATION_ROOT/"


echo "**************************"
echo "Rebuilding docker, this will take a while..."

echo "Connecting to ssh... $USERNAME@$HOSTNAME"
ssh -tt -i "$SSH_KEY_PATH" -p "$PORT" "$USERNAME@$HOSTNAME" \
    "bash -c '
        set -e

        # Authenticate sudo once
        sudo -v

        cd \"$DESTINATION_ROOT/nuu-cast/nuucast\"

        echo \"Building nuucast...\"
        sudo docker compose build

        echo \"Starting nuucast...\"
        sudo docker compose up -d

        cd \"$DESTINATION_ROOT/nuu-cast/nuuwatch\"

        echo \"Building nuuwatch...\"
        sudo docker compose build

        echo \"Starting nuuwatch...\"
        sudo docker compose up -d

        echo \"Deployment successful.\"
    '"
