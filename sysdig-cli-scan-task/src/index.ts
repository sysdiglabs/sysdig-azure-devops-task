import tl = require('azure-pipelines-task-lib');
import tr = require('azure-pipelines-task-lib/toolrunner');
import fs = require('fs');

import { InputFetch } from './InputFetch';
import { getScanningEngine, buildScanningEngineArg, runScanningEnginev2 } from './ScanningEngine';
import { SysdigScan, generateHTMLTableFromSysdigJSON } from './ReportGenerator';
// import { publishArtifact } from './PublishArtifact';

async function run(this: any) {
  try {
    const fetch: InputFetch = new InputFetch();

    const binaryPath: string = await getScanningEngine();
    const scanningEngine: tr.ToolRunner = buildScanningEngineArg(binaryPath);
    tl.setVariable('SECURE_API_TOKEN', fetch.apikey);
    console.log('[INFO] Starting Sysdig CLI Scanner');

    setProxy();

    // runScanningEngine(scanningEngine);
    await runScanningEnginev2(scanningEngine);
    if (fs.existsSync(fetch.jsonOutputFile)) {
      console.log('[INFO] Generating HTML report');
      var jsonData: SysdigScan = JSON.parse(fs.readFileSync(fetch.jsonOutputFile, 'utf8'));
      var htmlTable = generateHTMLTableFromSysdigJSON(jsonData);
      fs.writeFileSync('output.html', htmlTable);
      console.log('[INFO] HTML report generated successfully');
    } else {
      console.log('File not found:', fetch.jsonOutputFile);
    }
    if (fetch.autoPublishArtifacts == true) {
      console.log('[INFO] Auto publish artifacts not available in this version. Please follow instructions provided on README.md to configure your own publishing mechanism.');
      // publishArtifact('html_report', 'output.html');
    }
  }
  catch (err) {
    let errorMessage = "[DEBUG] Something went wrong. Check console logs";
    if (err instanceof Error) {
      errorMessage = err.message;
    }
    tl.setResult(tl.TaskResult.Failed, errorMessage);
  }
}

function setProxy() {
  const httpProxy = tl.getVariable("http_proxy") || tl.getVariable("HTTP_PROXY");
  const httpsProxy = tl.getVariable("https_proxy") || tl.getVariable("HTTPS_PROXY");
  const noProxy = tl.getVariable("no_proxy") || tl.getVariable("NO_PROXY");
  if (httpProxy) {
    process.env.HTTP_PROXY = httpProxy;
    tl.setVariable("http_proxy", httpProxy);
    console.log(`[INFO] Using HTTP_PROXY to ${httpProxy}`);
  }
  if (httpsProxy) {
    process.env.HTTPS_PROXY = httpsProxy;
    tl.setVariable("https_proxy", httpsProxy);
    console.log(`[INFO] Using HTTPS_PROXY to ${httpsProxy}`);
  }
  if (noProxy) {
    tl.setVariable("no_proxy", noProxy);
    process.env.NO_PROXY = noProxy;
    console.log(`[INFO] Using NO_PROXY to ${noProxy}`);
  }
}

run();
