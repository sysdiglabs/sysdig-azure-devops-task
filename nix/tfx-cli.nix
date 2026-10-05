# tfx-cli is not packaged in nixpkgs; build it from the upstream
# Microsoft/tfs-cli repo so `tfx extension publish` is available.
{
  lib,
  buildNpmPackage,
  fetchFromGitHub,
}:
buildNpmPackage rec {
  pname = "tfx-cli";
  version = "0.24.2";

  src = fetchFromGitHub {
    owner = "Microsoft";
    repo = "tfs-cli";
    rev = "69cc3ea887ccb08fccc2b37ffeacc1bdb8dddb7c";
    hash = "sha256-GXi/PNSzX3RRisX7rEXahu3sVldhee9IYMmaqx0JF+s=";
  };

  npmDepsHash = "sha256-sOraxuomTy6M+ws5I7TOYzdzTpAx+nUFcRT+tg0dfAk=";

  # `npm run build` is `tsc -p .`; postbuild copies the bin entrypoint.
  npmBuildScript = "build";

  meta = {
    description = "Cross-platform CLI for Azure DevOps and Team Foundation Server";
    homepage = "https://github.com/Microsoft/tfs-cli";
    license = lib.licenses.mit;
    mainProgram = "tfx";
  };
}
