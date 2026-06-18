{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };
  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = import nixpkgs {
          inherit system;
          config.allowUnfree = true;
          overlays = [ self.overlays.default ];
        };
      in
      {
        packages.tfx-cli = pkgs.tfx-cli;

        devShells.default =
          with pkgs;
          mkShell {
            packages = [
              azure-cli
              curl
              git
              jq
              just
              nodejs_22
              pinact
              sd
              tfx-cli
              typescript
            ];
          };

        formatter = pkgs.nixfmt-tree;
      }
    )
    // {
      overlays.default = final: prev: {
        tfx-cli = final.callPackage ./nix/tfx-cli.nix { };
      };
    };
}
