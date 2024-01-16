# Sysdig Secure Task Extension for Azure DevOps Pipelines

[Sysdig Secure](https://sysdig.com/products/platform/) is a CNAPP Cloud Security Platform covering the following use cases
* Cloud, Kuberenets & Container Detection and Response
* Vulnerability Management
* Posture Management
* Permission & Entitlements

This extension provides integration with Sysdig Secure to scan container images for vulnerabilities within the Azure DevOps pipeline.

**ONLY the image report is sent to Sysdig on completion of the scan.**

## Pre-requisites
You will require a valid Sysdig Secure API token.

## Task usage

#### Default behaviour

By default, the task will simply scan a local image using [Sysdig Secure CLI](https://docs.sysdig.com/en/docs/sysdig-secure/vulnerabilities/pipeline/).

The task will output the policy results of the scan as well as send the reports to Sysdig Secure for review.

Under default behavior, the pipeline will not fail when the container does not pass the Sysdig Secure policy scan.

Example yaml:

```
- task: Sysdig-CLI-Scan@1
  inputs:
    sysdigurl: 'https://app.us4.sysdig.com'
    apikey: $(SYSDIG_API_TOKEN)
    image: $(imageName)
```


### Failing the pipeline

In order to fail the pipeline when Sysdig Secure returns a `fail` based on the 
results of the Sysdig Secure scan, set the `failBuild` option to `true`.

Example yaml:

```
- task: Sysdig-CLI-Scan@1
  inputs:
    sysdigurl: 'https://app.us4.sysdig.com'
    apikey: $(SYSDIG_API_TOKEN)
    image: $(imageName)
    verbose: true
    failBuild: true
```

## Example azure-pipelines.yaml

The below provides an example of a local image build which integrates with Sysdig Secure
to scan the image. It will also fail the build if the Sysdig Secure policy scan returns a `fail` result.

```
trigger:
- master

pool:
  vmImage: ubuntu-latest

variables:
- name: imageName
  value: 'nginx:latest'
  readonly: true
- group: sysdig

steps:
- task: DockerInstaller@0
  inputs:
    dockerVersion: '17.09.0-ce'

- script:  docker pull $(imageName)
  ## workingDirectory: $(Build.SourcesDirectory)/front-end/myAppFront/
  displayName: 'Docker Pull'

- task: Sysdig-CLI-Scan@1
  displayName: Sysdig CLI Scan
  inputs:
    sysdigurl: 'https://app.us4.sysdig.com'
    apikey: $(SYSDIG_API_TOKEN)
    image: $(imageName)
    verbose: true
    jsonOutput: true
    jsonOutputFile: 'sysdig-cli-scan-output.json'
    sysdigCliScannerVersion: '1.6.0'

- task: PublishBuildArtifacts@1
  inputs:
    PathtoPublish: '$(System.DefaultWorkingDirectory)/output.html' # Path to the file or folder
    ArtifactName: 'html_report' # Name of the artifact
    publishLocation: 'Container' # Options: container, filePath

- task: PublishBuildArtifacts@1
  inputs:
    PathtoPublish: '$(System.DefaultWorkingDirectory)/sysdig-cli-scan-output.json' # Path to the file or folder
    ArtifactName: 'json_report' # Name of the artifact
    publishLocation: 'Container' # Options: container, filePath
```

## More Information
For documentation on Sysdig Secure, including policy and capabilities see the [Sysdig Secure Documentation](https://docs.sysdig.com/en/docs/sysdig-secure/)
