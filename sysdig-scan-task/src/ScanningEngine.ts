import tl = require('azure-pipelines-task-lib/task');
import tr = require('azure-pipelines-task-lib/toolrunner');

import path = require("path");
import { InputFetch } from './InputFetch';
import { downloadFile, getVersion, filePermission } from './Download';

export async function getScanningEngine(): Promise<string> {
  console.log("[INFO] Downloading Sysdig Scanning Engine (Tech Preview)");

  const version: string = getVersion();
  var strUrl = `https://download.sysdig.com/scanning/bin/sysdig-cli-scanner/${version}/linux/amd64/sysdig-cli-scanner`;

  var strTargetFilename = 'sysdig-cli-scanner';
  var authType = 'noAuth';
  var ignoreCertificateChecks = true;
  var catchResponse = true;
  var output = path.join(__dirname, strTargetFilename)

  console.log("[INFO] Source download url : '" + strUrl + "'");
  console.log("[INFO] Target output file : '" + output + "'");

  try {
    console.log("[INFO] Starting downloading ...");
    await downloadFile(strUrl, ignoreCertificateChecks, authType, output, catchResponse);

    console.log("[INFO] Setting execution permissions ...");
    filePermission(output);
  } catch (e) {
    let errorMessage = "Failed to download latest binary";
    if (e instanceof Error) {
      errorMessage = e.message;
    }
    tl.setResult(tl.TaskResult.Failed, errorMessage);
  }

  return output;
}

export function buildScanningEngineArg(binaryPath: string): tr.ToolRunner {
  const fetch: InputFetch = new InputFetch();

  let scanningEngine: tr.ToolRunner = tl.tool(path.resolve(binaryPath));

  // Sysdig Secure API base URL
  if (fetch.sysdigurl) {
    scanningEngine.arg(['--apiurl', fetch.sysdigurl]);
  }

  // Set log level to debug
  if (fetch.verbose) {
    scanningEngine.arg('--loglevel=debug');
    scanningEngine.arg('--console-log');
    scanningEngine.arg('--full-vulns-table');
  }

  // Skip TLS verification on Sysdig enpoints
  if (fetch.skipTLS) {
    scanningEngine.arg(['--skiptlsverify']);
  }

  // Add image to be scanned
  scanningEngine.arg(fetch.image);

  return scanningEngine;
}

export async function runScanningEnginev2(scanningEngine: tr.ToolRunner) {
  const fetch: InputFetch = new InputFetch();
  let result = await scanningEngine.exec({ ignoreReturnCode: true});

  console.log('Result Exit Code: ', result);
  console.log('Fail Job: ', fetch.failbuild);

  if (fetch.failbuild && result != 0) {
    if (result == 1) {
      throw new Error("Sysdig Scanning Engine policy returned 'fail' result");
    }

    if (result == 2) {
      throw new Error("Sysdig Scanning Engine command failed. Check parameters (i.e. no API token)");
    }

    if (result == 3) {
      throw new Error("Sysdig Scanning Engine Execution Error (i.e. backend error)");
    }

    console.log("[DEBUG] - Unknown Error", result);
    throw new Error('Sysdig Scanning Engine command failed with error');
  }
}

export function runScanningEngine(scanningEngine: tr.ToolRunner) {
  const fetch: InputFetch = new InputFetch();

  let result: tr.IExecSyncResult = scanningEngine.execSync();

  console.log('Result Exit Code: ', result.code);
  console.log('Fail Job: ', fetch.failbuild);

  if (fetch.failbuild && result.code != 0) {
    if (result.code == 1) {
      throw new Error("Sysdig Scanning Engine policy returned 'fail' result");
    }

    if (result.code == 2) {
      throw new Error("Sysdig Scanning Engine command failed. Check parameters (i.e. no API token)");
    }

    if (result.code == 3) {
      throw new Error("Sysdig Scanning Engine Execution Error (i.e. backend error)");
    }

    console.log("[DEBUG] - Error", result.stderr);
    console.log("[DEBUG] - Error", result.error);
    throw new Error('Sysdig Scanning Engine command failed with error');
  }


}