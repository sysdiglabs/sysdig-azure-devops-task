# tfx-cli is not packaged in nixpkgs; build it from the upstream
# Microsoft/tfs-cli repo so `tfx extension publish` is available.
{
  lib,
  buildNpmPackage,
  fetchFromGitHub,
}:
buildNpmPackage rec {
  pname = "tfx-cli";
  version = "0.23.3";

  src = fetchFromGitHub {
    owner = "Microsoft";
    repo = "tfs-cli";
    rev = "3c12ccb53f3fd700224d0db4490ebc0613df0b7e";
    hash = "sha256-gnADqxXmaweeaDzV3BTwVzHGjm7qZ4/QNWpx60iJLJ8=";
  };

  npmDepsHash = "sha256-wZS8UZNmiuk68NKe8FJzHgqtY9Fs7oZEZALtuB6HRS0=";

  # `npm run build` is `tsc -p .`; postbuild copies the bin entrypoint.
  npmBuildScript = "build";

  meta = {
    description = "Cross-platform CLI for Azure DevOps and Team Foundation Server";
    homepage = "https://github.com/Microsoft/tfs-cli";
    license = lib.licenses.mit;
    mainProgram = "tfx";
  };
}
