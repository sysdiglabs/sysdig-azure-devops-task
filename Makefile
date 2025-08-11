HOME := $(CURDIR)
TYPESCRIPT_SOURCE := $(HOME)/sysdig-cli-scan-task/
AZURE_DEVOPS_ACCESS_TOKEN ?=

# Default target
all: build

build: 
	npm ci
	cd $(TYPESCRIPT_SOURCE) && npm ci && tsc

publish-local: build
	tfx extension publish \
	--manifest-globs vss-extension-test.json \
	--publisher IgorEulalio \
	--extension-id b52fe4a2-0476-4973-bc50-cc44e9032e11 \
	--share-with sysdigtest \
	--token $(AZURE_DEVOPS_ACCESS_TOKEN) 

publish-release:
	tfx extension publish --manifest-globs $(HOME)/vss-extension.json --override-file $(HOME)/vss-extension-release.json \
	 --token $(AZURE_DEVOPS_ACCESS_TOKEN)

.PHONY: build publish
