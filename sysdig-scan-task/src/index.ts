import tl = require('azure-pipelines-task-lib/task');
import tr = require('azure-pipelines-task-lib/toolrunner');

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

run();
