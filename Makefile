HOME := $(CURDIR)
TYPESCRIPT_SOURCE := $(HOME)/sysdig-cli-scan-task/
# AZURE_DEVOPS_ACCESS_TOKEN ?=

# Default target
all: build

build: 
	npm install
	cd $(TYPESCRIPT_SOURCE) && npm install && tsc

publish-release:
	tfx extension publish --manifest-globs $(HOME)/vss-extension.json --override-file $(HOME)/vss-extension-release.json \
	 --token $(AZURE_DEVOPS_ACCESS_TOKEN)

.PHONY: build publish
