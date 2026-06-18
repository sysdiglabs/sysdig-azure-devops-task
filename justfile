typescript_source := justfile_directory() / "sysdig-cli-scan-task"
azure_devops_access_token := env_var_or_default("AZURE_DEVOPS_ACCESS_TOKEN", "")

# List available recipes
default:
    @just --list

# Install deps and compile the TypeScript task
build:
    npm install
    cd {{typescript_source}} && npm install && tsc

# Publish a test build shared with the sysdigtest org
publish-local: build
    tfx extension publish \
        --manifest-globs vss-extension-test.json \
        --publisher IgorEulalio \
        --extension-id b52fe4a2-0476-4973-bc50-cc44e9032e11 \
        --share-with sysdigtest \
        --token {{azure_devops_access_token}}

# Publish the release build to the marketplace
publish-release:
    tfx extension publish \
        --manifest-globs {{justfile_directory()}}/vss-extension.json \
        --overrides-file {{justfile_directory()}}/vss-extension-release.json \
        --token {{azure_devops_access_token}}

# Pin GitHub Actions to commit SHAs
pin-actions:
    pinact run -u

# Update everything: flake inputs, tfx-cli, and pinned actions
update:
    nix flake update
    nix develop --command just update-tfx
    nix develop --command just pin-actions

# Bump tfx-cli to the latest upstream commit and recompute its hashes
update-tfx:
    #!/usr/bin/env bash
    set -euo pipefail
    rev="$(git ls-remote https://github.com/Microsoft/tfs-cli HEAD | cut -f1)"
    version="$(curl -fsSL "https://raw.githubusercontent.com/Microsoft/tfs-cli/${rev}/package.json" | jq -r .version)"
    sd 'rev = ".*";' "rev = \"${rev}\";" nix/tfx-cli.nix
    sd 'version = ".*";' "version = \"${version}\";" nix/tfx-cli.nix
    just rehash-tfx
    echo "tfx-cli -> ${version} (${rev})"

# Recompute the source and npm hashes in nix/tfx-cli.nix
rehash-tfx:
    #!/usr/bin/env bash
    set -euo pipefail
    rehash() { sd "${1} = \".*\";" "${1} = \"\";" nix/tfx-cli.nix; h="$( (nix build -L --no-link .#tfx-cli || true) 2>&1 | sed -nE 's/.*got:[[:space:]]+([^ ]+).*/\1/p' | tail -1)"; [ -n "${h}" ] && sd "${1} = \"\";" "${1} = \"${h}\";" nix/tfx-cli.nix && echo "${1} -> ${h}"; }
    rehash hash
    rehash npmDepsHash
