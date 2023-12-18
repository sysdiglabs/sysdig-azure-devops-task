import tl = require('azure-pipelines-task-lib/task');
import tr = require('azure-pipelines-task-lib/toolrunner');

import { InputFetch } from './InputFetch';
import { ScanArgs } from './ScanArgs';

export function dockerComandArg(): string {
  // Default docker command
  const docker: string = 'run --rm -v /var/run/docker.sock:/var/run/docker.sock';

  const fetch: InputFetch = new InputFetch();
  // Configure privileged options
  if (fetch.privileged) {
    console.log('Privileged Options Enabled:', fetch.privileged);
    const docker: string = 'run --user root --privileged --userns=host --rm -v /var/run/docker.sock:/var/run/docker.sock';
    console.log('Docker Command: ', docker);
    return docker;
  }

  return docker;
}

export function scanningImage(): string {
  const fetch: InputFetch = new InputFetch();
  const image: string = 'quay.io/sysdig/secure-inline-scan:2.4';

  if (fetch.internalRegistry != "") {
    console.log('Override - Sysdig Inline Scanning Image: ', fetch.internalRegistry);
    return fetch.internalRegistry
  }

  return image;
}

export function buildInlineScanCommand(docker: string, image: string): string {
  const fetch: InputFetch = new InputFetch();
  let command: ScanArgs = new ScanArgs(docker);

  // Add Sysdig scanning annotation
  command.add(['-e SYSDIG_ADDED_BY=cicd-inline-scan']);

  // Add Sysdig inline scanning image
  command.add([image]);

  // Add Sysdig URL
  if (fetch.sysdigurl) {
    command.add(['--sysdig-url', fetch.sysdigurl]);
  }

  // Add Sysdig Token
  if (fetch.apikey) {
    command.add(['--sysdig-token', fetch.apikey]);
  }

  // Get image from docker daemon
  command.add(['--storage-type docker-daemon']);

  // Use docker socket storage path
  command.add(['--storage-path /var/run/docker.sock']);

  // Scan image for malware
  if (fetch.malware) {
    command.add(['--malware-scan-enable']);
  }

  // Determine malware failure behaviour
  if (fetch.malware && !fetch.failbuild) {
    command.add(['--malware-fail-fast false']);
  }

  // Skip TLS verification on Sysdig enpoints
  if (fetch.skipTLS) {
    command.add(['--sysdig-skip-tls']);
  }

  // Configure verbose logging
  if (fetch.verbose) {
    command.add(['--verbose']);
  }

  // Add image to be scanned
  command.add([fetch.image]);

  console.log('Scanning: ', fetch.image);

  return command.args;
}

export function runInlineScanner(inlineScanArg: string) {
  const fetch: InputFetch = new InputFetch();

  tl.which('docker', true);
  let docker = tl.which('docker');

  let inlinescan: tr.ToolRunner = tl.tool(docker).line(inlineScanArg);
  let result: tr.IExecSyncResult = inlinescan.execSync();

  console.log('Result Exit Code: ', result.code);
  console.log('Fail Job: ', fetch.failbuild);

  if (fetch.failbuild && result.code != 0) {
    if (result.code == 1) {
      throw new Error("Sysdig Secure policy scan returned 'fail' result");
    }

    if (result.code == 2 || result.code == 3) {
      throw new Error('Sysdig Inline Scan command failed. Check parameters (i.e. no API token)');
    }

    console.log("[DEBUG] - Error",result.stderr);
    console.log("[DEBUG] - Error",result.error);
    throw new Error('Sysdig Inline Scan command failed with error');
  }
}