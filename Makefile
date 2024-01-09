HOME := $(CURDIR)
TYPESCRIPT_SOURCE := $(HOME)/sysdig-scan-task/
AZURE_DEVOPS_ACCESS_TOKEN ?=

# Default target
all: build

build: 
	npm install
	cd $(TYPESCRIPT_SOURCE) && npm install && tsc

publish: build
	chmod +x $(HOME)/bump_version.sh
	$(HOME)/bump_version.sh
	tfx extension publish --manifest-globs $(HOME)/vss-extension.json \
	 --token $(AZURE_DEVOPS_ACCESS_TOKEN)

.PHONY: build publish