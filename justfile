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

# Update everything: flake inputs, tfx-cli, pinned actions, and the sysdig-cli-scanner versions
update:
    nix flake update
    nix develop --command just update-tfx
    nix develop --command just pin-actions
    nix develop --command just update-cli-scanner
    nix develop --command just update-oldest-cli-scanner

# (internal) Print the latest published sysdig-cli-scanner version
[private]
_latest-version:
    @curl --silent --fail --show-error --location https://download.sysdig.com/scanning/sysdig-cli-scanner/latest_version.txt | tr -d '[:space:]'

# Find the oldest sysdig-cli-scanner version still within the support window (default 365 days)
oldest-cli-scanner window_days="365":
    #!/usr/bin/env bash
    set -euo pipefail
    base="https://download.sysdig.com/scanning/bin/sysdig-cli-scanner"
    os="linux"; arch="amd64"
    cutoff=$(( $(date -u +%s) - {{window_days}} * 86400 ))
    latest=$(just _latest-version)
    major=${latest%%.*}
    minor=$(echo "$latest" | cut -d. -f2)
    oldest_ver=""; oldest_epoch=""
    for m in $(seq "$minor" -1 0); do
        minor_hit=0; misses=0
        for p in $(seq 0 30); do
            v="$major.$m.$p"
            lm=$(curl -sfI "$base/$v/$os/$arch/sysdig-cli-scanner" \
                | grep -i '^last-modified:' | sed 's/^[Ll]ast-[Mm]odified: //' | tr -d '\r' || true)
            if [ -z "$lm" ]; then
                misses=$((misses + 1)); [ "$misses" -ge 2 ] && break; continue
            fi
            misses=0
            epoch=$(date -u -d "$lm" +%s)
            if [ "$epoch" -ge "$cutoff" ]; then
                minor_hit=1
                if [ -z "$oldest_epoch" ] || [ "$epoch" -lt "$oldest_epoch" ]; then
                    oldest_epoch=$epoch; oldest_ver=$v
                fi
            fi
        done
        # Versions are chronological: once a whole minor is out of window, stop.
        [ "$minor_hit" -eq 0 ] && [ -n "$oldest_ver" ] && break
    done
    if [ -z "$oldest_ver" ]; then
        echo "No version found within the last {{window_days}} days" >&2
        exit 1
    fi
    echo >&2 "Oldest supported: $oldest_ver (released $(date -u -d "@$oldest_epoch" '+%Y-%m-%d'))"
    echo "$oldest_ver"

# (internal) Replace the version tagged with <marker>-version-marker wherever it
# appears. Markers are HTML-comment spans in Markdown and trailing `#`/`//`
# comments in YAML/TS. Target files are discovered, not hardcoded, so a new
# marker anywhere is picked up automatically. DO NOT delete those markers.
[private]
_set-version marker version:
    #!/usr/bin/env bash
    set -euo pipefail
    # Discover files carrying this marker. Skip deps, build output, and the
    # tooling/docs that only name the marker in prose.
    mapfile -t files < <(grep -rl \
        --exclude-dir=.git --exclude-dir=node_modules --exclude-dir=dist \
        --exclude=justfile --exclude=AGENTS.md \
        "{{marker}}-version-marker" . | sort)
    if [ "${#files[@]}" -eq 0 ]; then
        echo "No files found carrying {{marker}}-version-marker" >&2
        exit 1
    fi
    for f in "${files[@]}"; do
        echo "Updating $f" >&2
        # Markdown: <!-- {{marker}}-version-marker ... -->X<!-- /{{marker}}-version-marker -->
        sed -i -E "s#(<!-- {{marker}}-version-marker[^>]*-->)(\`?)[0-9][0-9.]*(\`?)(<!-- /{{marker}}-version-marker -->)#\1\2{{version}}\3\4#g" "$f"
        # YAML/TS: line carrying a `#`/`//` {{marker}}-version-marker comment
        sed -i -E "/(#|\/\/)[[:space:]]*{{marker}}-version-marker/ s/[0-9]+\.[0-9]+\.[0-9]+/{{version}}/" "$f"
    done

# Substitute the oldest supported version wherever the oldest-version-marker is placed
update-oldest-cli-scanner window_days="365":
    #!/usr/bin/env bash
    set -euo pipefail
    oldest=$(just oldest-cli-scanner {{window_days}})
    just _set-version oldest "$oldest"
    echo "Oldest supported version set to $oldest (via oldest-version-marker)"

# Update the pinned sysdig-cli-scanner version (README example) to the latest available.
# The task itself defaults to `latest` at runtime.
update-cli-scanner:
    #!/usr/bin/env bash
    set -euo pipefail
    latest=$(just _latest-version)
    just _set-version newest "$latest"
    echo "Newest version set to $latest (via newest-version-marker)"

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
    rehash() {
        local key="$1" old new
        old="$(grep -oE "${key} = \"[^\"]*\"" nix/tfx-cli.nix | head -1)"
        sd "${key} = \".*\";" "${key} = \"\";" nix/tfx-cli.nix
        new="$( (nix build -L --no-link .#tfx-cli || true) 2>&1 | sed -nE 's/.*got:[[:space:]]+([^ ]+).*/\1/p' | tail -1)"
        if [ -z "${new}" ]; then
            sd "${key} = \".*\";" "${old};" nix/tfx-cli.nix
            echo "error: could not parse a new ${key}; restored previous value" >&2
            exit 1
        fi
        sd "${key} = \"\";" "${key} = \"${new}\";" nix/tfx-cli.nix
        echo "${key} -> ${new}"
    }
    rehash hash
    rehash npmDepsHash
