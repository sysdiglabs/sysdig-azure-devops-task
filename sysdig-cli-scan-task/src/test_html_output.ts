// ts-node sysdig-cli-scan-task/src/test.ts

import fs = require('fs');

//import { InputFetch } from './InputFetch';
//import { getScanningEngine, buildScanningEngineArg, runScanningEnginev2 } from './ScanningEngine';
import { SysdigScan, generateHTMLTableFromSysdigJSON } from './ReportGenerator';
// import { publishArtifact } from './PublishArtifact';

async function run() {
    //const fetch: InputFetch = new InputFetch();

    console.log('[INFO] Starting Sysdig Scanning Engine (Tech Preview)');

    // runScanningEngine(scanningEngine);
    var jsonData: SysdigScan = JSON.parse(fs.readFileSync("sysdig-cli-scan-output.json", 'utf8'));
    var htmlTable = generateHTMLTableFromSysdigJSON(jsonData);
    fs.writeFileSync('output.html', htmlTable);
    console.log('[INFO] HTML report generated successfully');
  }


run();
