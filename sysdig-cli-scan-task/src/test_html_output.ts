import path = require("path");
import { downloadFile } from './Download';
import { SysdigScan, generateHTMLTableFromSysdigJSON } from './ReportGenerator';

async function testDownload() {
  var version = "1.8.5"
  console.log("[INFO] Downloading Sysdig Scanning Engine. Version: ", version);
  var strUrl = `https://download.sysdig.com/scanning/bin/sysdig-cli-scanner/${version}/linux/amd64/sysdig-cli-scanner`;

  var strTargetFilename = 'sysdig-cli-scanner';
  var authType = 'noAuth';
  var ignoreCertificateChecks = true;
  var catchResponse = true;
  var output = path.join(__dirname, strTargetFilename)

  console.log("[INFO] Source download url : '" + strUrl + "'");
  console.log("[INFO] Target output file : '" + output + "'");

  await downloadFile(strUrl, ignoreCertificateChecks, authType, output, catchResponse);
}

async function generateHtmlFile() {
    //const fetch: InputFetch = new InputFetch();

    console.log('[INFO] Starting Sysdig Scanning Engine (Tech Preview)');

    // runScanningEngine(scanningEngine);
    var jsonData: SysdigScan = JSON.parse(fs.readFileSync("sysdig-cli-scan-output.json", 'utf8'));
    var htmlTable = generateHTMLTableFromSysdigJSON(jsonData);
    fs.writeFileSync('output.html', htmlTable);
    console.log('[INFO] HTML report generated successfully');
  }

generateHtmlFile();
testDownload();
