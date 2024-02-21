import tl = require('azure-pipelines-task-lib');
import tr = require('azure-pipelines-task-lib/toolrunner');
import { InputFetch } from './InputFetch';

const url = require('url');
const https = require("https");
const fs = require('fs');
const Stream = require('stream').Transform;
const fetch: InputFetch = new InputFetch();

function displayFileSize(bytes: any) {

  if (bytes == 0) {
    return "0 Byte";
  }
  else {
    var sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    var i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
  }

}

function getOptions(strUrl: string, ignoreCertificateChecks: boolean, authType: string) {

  var options = url.parse(strUrl);

  // Set protocol and port in needed
  switch (options.protocol) {
    case "https:":
      if (!options.port) {
        options.port = 443;
      }
      if (ignoreCertificateChecks) {
        console.log("[INFO] Ignore certificate checks : 'True'");
        options.rejectUnhauthorized = false;
        // process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
      }
      else {
        console.log("[INFO] Ignore certificate checks : 'False'");
      }
      break;
    default:
      throw new Error("Protocol not supported. HTTP or HTTPS are supported.");
  }

  // Set authentification if needed
  switch (authType) {
    case "basic":
      var basicAuthUsername = tl.getInput('basicAuthUsername', true);
      var basicAuthPassword = tl.getInput('basicAuthPassword', true);
      console.log("[INFO] Authentication type : 'Basic Auth'");
      console.log("[INFO] Username : '" + basicAuthUsername + "'");
      console.log("[INFO] Password : '" + basicAuthPassword + "'");
      options.headers = {
        'Authorization': 'Basic ' + new Buffer(basicAuthUsername + ':' + basicAuthPassword).toString('base64')
      }
      break;
    case "bearer":
      var bearerToken = tl.getInput('bearerToken', true);
      console.log("[INFO] Authentication type : 'Bearer Token'");
      console.log("[INFO] Token : '" + bearerToken + "'");
      options.headers = {
        'Authorization': 'Bearer ' + bearerToken
      }
      break;
    case "noAuth":
    default:
      console.log("[INFO] Authentication type : 'No Auth'");
      break;
  }

  return options;
}

export function filePermission(output: string) {
  try {
    const fd = fs.openSync(output, "r");
    fs.fchmodSync(fd, 0o777);
    console.log("[INFO] File permissions change succcessful");
    console.log("[INFO] File permissions:", fs.statSync(output).mode);
  } catch (error) {
    console.log(error);
  }
}

export function getVersion(): string {
  var curlPath: string = tl.which('curl');
  if (!curlPath) {
    throw new Error(tl.loc('CurlNotFound'));
  }

  var curlRunner: tr.ToolRunner = tl.tool('curl');

  curlRunner.arg(['-L', '-s', 'https://download.sysdig.com/scanning/sysdig-cli-scanner/latest_version.txt']);

  if (fetch.verbose) {
    curlRunner.arg(['--verbose']);
  }
  var latestVersion: tr.IExecSyncResult = curlRunner.execSync();

  const version: string = latestVersion.stdout.replace(/(\r\n|\n|\r)/gm, "");
  if (!version) {
    throw new Error(tl.loc('VersionNotFound'));
  }
  console.log('[INFO] Latest Scanning Engine Version ' + version)
  return version;
}

export function downloadFile(strUrl: string, ignoreCertificateChecks: boolean, authType: string, output: string, catchResponse: boolean) {

  return new Promise((resolve, reject) => {

    var protocol;
    var options = getOptions(strUrl, ignoreCertificateChecks, authType);

    switch (options.protocol) {
      case "https:":
        protocol = https;
        break;
      default:
        reject("Protocol not supported. only HTTPS is supported.");
    }

    var req = protocol.request(options, async (res: any) => {

      var binaryData = new Stream();
      var statusCode = res.statusCode;

      if (parseInt(statusCode) == 302) {
        if (res.headers['location']) {
          var location = res.headers['location'];
          console.log("[INFO] Redirection found new url : '" + location + "'");
          await downloadFile(location, ignoreCertificateChecks, authType, output, catchResponse);
          resolve(true);
        }
        else {
          reject("Error redirection url not found");
        }
      }
      else {
        res.on('data', function (d: any) {
          binaryData.push(d);
        });

        res.on('end', function () {

          var content = binaryData.read();

          if (catchResponse) {
            if (parseInt(statusCode) < 200 || parseInt(statusCode) > 299) {
              throw new Error("Error when download file [" + statusCode + "] : " + content);
            }
          }

          fs.writeFileSync(output, content);

          const targetFileInfos = fs.statSync(output);
          const fileSizeInBytes = targetFileInfos.size;

          console.log("[INFO] Downloaded status : '" + statusCode + "'");
          console.log("[INFO] Downloaded file information : " + output + " (" + displayFileSize(fileSizeInBytes) + ")");
          console.log("[INFO] Downloaded file mode : " + fs.statSync(output).mode);
          resolve(true);
        });
      }

    }).on('error', function catchError(error: any) {
      throw new Error("Error when download file : " + error);
    });

    req.end();
  });
}
