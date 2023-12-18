# Sysdig Secure Task Extension for Azure DevOps Pipelines

Sysdig Secure is a container security platform that brings together Docker image 
scanning and run-time protection to identify vulnerabilities, block threats, enforce 
compliance, and audit activity across your microservices.

This extension provides integration with Sysdig Secure to scan container images
within the Azure DevOps pipeline.

**ONLY the image report is sent to Sysdig on completion of the scan.**

## Pre-requisites
You will require a valid Sysdig Secure API token.

## Task usage

#### Default behaviour

By default, the task will simply scan a local image using Sysdig Secure
Inline Scanning Engine (https://docs.sysdig.com/en/integrate-with-ci-cd-tools.html).

The task will output the policy results of the scan as well as send the reports to 
Sysdig Secure for review.

Under default behavior, the pipeline will not fail when the container does not pass 
the Sysdig Secure policy scan.

Example yaml:

```
- task: Sysdig@0
  displayName: Sysdig Image Scan
  inputs:
    apikey: '$(secureApiKey)'
    image: '$(imageName):$(tags)'
```


### Failing the pipeline

In order to fail the pipeline when Sysdig Secure returns a `fail` based on the 
results of the Sysdig Secure scan, set the `failBuild` option to `true`.

Example yaml:

```
- task: Sysdig@0
  displayName: Sysdig Image Scan
  inputs:
    apikey: '$(secureApiKey)'
    image: '$(imageName):$(tags)'
    failBuild: true
```

## Example azure-pipelines.yaml

The below provides an example of a local image build which integrates with Sysdig Secure
to scan the image. It will also fail the build if the Sysdig Secure policy scan returns a `fail` result.

```
pool:
  vmImage: 'ubuntu-latest'

variables:
  imageName: 'docker.io/sysdigdan/dummy-vuln-app'
  tags: |
    latest
steps:
- bash: echo "Hello world"

- task: Docker@2
  displayName: Build image
  inputs:
    repository: $(imageName)
    command: build
    tags: $(tags)

- task: Sysdig@0
  displayName: Sysdig Image Scan
  inputs:
    apikey: '$(secureApiKey)'
    image: '$(imageName):$(tags)'
    failBuild: true
```

## More Information
For documentation on Sysdig Secure, including policy and capabilities see the [Sysdig Secure Documentation][1]

[1]: https://docs.sysdig.com/en/sysdig-secure.html
