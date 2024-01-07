TYPESCRIPT_SOURCE:= $(pwd)/sysdig-scan-task/
HOME:= $(pwd)
# Default target
all: build

build: 
	cd $(TYPESCRIPT_SOURCE) && tsc


# Run the application
publish: build
	node $(DIST_DIR)/app.js

.PHONY: all install build clean run
