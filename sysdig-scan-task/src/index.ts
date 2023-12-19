import tl = require('azure-pipelines-task-lib/task');
import tr = require('azure-pipelines-task-lib/toolrunner');
import fs = require('fs');

import { InputFetch } from './InputFetch';
import { getScanningEngine, buildScanningEngineArg, runScanningEngine, runScanningEnginev2 } from './ScanningEngine';
import { dockerComandArg, scanningImage, buildInlineScanCommand, runInlineScanner } from './InlineScanner';

async function run() {
  try {
    const fetch: InputFetch = new InputFetch();

    if (fetch.techpreview == true) {
      const binaryPath: string = await getScanningEngine();
      const scanningEngine: tr.ToolRunner = buildScanningEngineArg(binaryPath);

      console.log('[INFO] Starting Sysdig Scanning Engine (Tech Preview)');
      tl.setVariable('SECURE_API_TOKEN', fetch.apikey);

      // runScanningEngine(scanningEngine);
      await runScanningEnginev2(scanningEngine);

      console.log('[INFO] Generating HTML report');
      var jsonData = JSON.parse(fs.readFileSync(fetch.jsonOutputFile, 'utf8'));
      var htmlTable = generateHTMLTableFromJSON(jsonData);
      fs.writeFileSync('output.html', htmlTable);

      console.log('[INFO] HTML report generated successfully');
    }
    else {
      console.log('[INFO] Starting Sysdig Inline Scanner');
      const docker: string = dockerComandArg();
      const image: string = scanningImage();
      const inlineScanCommand: string = buildInlineScanCommand(docker, image);

      runInlineScanner(inlineScanCommand);
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

// We treat jsonData as any so we can have flexibility in the JSON structure
function generateHTMLTableFromJSON(jsonData: any) {
  var packages = jsonData.result.packages.filter(function (pkg: any) { return pkg.suggestedFix; });
  var htmlContent = '<table><tr><th>Package Name</th><th>Package Type</th><th>Version</th><th>Suggested Fix</th></tr>';
  packages.forEach(function (pkg: any) {
      htmlContent += "<tr>\n            <td>".concat(pkg.name, "</td>\n            <td>").concat(pkg.type, "</td>\n            <td>").concat(pkg.version, "</td>\n            <td>").concat(pkg.suggestedFix, "</td>\n        </tr>");
  });
  htmlContent += '</table>';
  return htmlContent;
}

run();
