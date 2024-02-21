export interface SysdigScan {
    result: ScanResult;
}

interface ScanResult {
    vulnTotalBySeverity: {
        critical: number;
        high: number;
        medium: number;
        low: number;
        negligible: number;
    }
    packages: Package[];
    type: string;
    metadata: {
        imageId: string;
        pullString: string;
        digest: string;
        baseOs: number;
        layersCount: string;
    };
    exploitsCount: number;
}

interface Package {
    type: string;
    path: string;
    name: string;
    version: string;
    suggestedFix: string;
    vulns: Vulnerability[] | null;
}

interface Vulnerability {
    name: string; // CVE
    cvssScore: {
        value: {
            score: number;
        };
    };
    exploitable: boolean;
    severity: {
        value: string;
    };
    fixedInVersion: string;
}

// used to store enriched vuln info that contains package level information
interface EnrichedVulnInfo {
    package: string;
    path: string;
    exploitable: boolean;
    current_version: string;
    type: string;
    name: string;
    severity: string;
    cvssScore: number;
    fix_version: string;
}

export function generateHTMLTableFromSysdigJSON(jsonData: SysdigScan): string {
    // Styles for the HTML report
    let styles = generateStyles();

    // Page Heading
    let heading = generateHeading(jsonData.result.metadata.pullString);

    // Table for vulnTotalBySeverity
    let vulnTotalTable = generateVulnTotalTable(jsonData.result.vulnTotalBySeverity);

    // Table for packages
    let packagesTable = generatePackagesTable(jsonData.result.packages);

return styles + heading + vulnTotalTable + packagesTable;
}


function generateStyles(): string {
    return `
    <style>
        h1 {
            color: #1E1E22;
            font-family: Arial, sans-serif; /* A clean, modern font */
            text-align: center;
        }
        table {
            width: 100%;
            background-color: white;
            #border-collapse: separate; /* Use 'separate' to allow spacing between cells */
            border-spacing: 0 2px; /* Adds spacing between rows */
            margin-bottom: 20px;
            overflow: auto;
            font-size: 12px;
            font-family: Arial, sans-serif; /* A clean, modern font */
            color: #3E4042; # Text Colour
        }
        th, td {
            border: 1px solid #ccc; /* Lighter border color */
            padding: 5px 5px; /* Increased padding for space */
            text-align: left;
            #background-color: #3E4042;
            #box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); /* Subtle shadow for depth */
        }
        th {
            background-color: #BDF78B; /* More vibrant header color */
            color: #1E1E22; 
            font-weight: bold; 
        }
        tr:nth-child(even) {
            background-color: #f2f2f2; /* Alternating row color for better distinction */
        }
        tr:hover {
            background-color: #e8e8e8; /* Hover color for interactivity */
        }
    </style>
    `;
}

function generateHeading(imageName: string): string {
    return `
    <h1> Image: ${imageName} </h1>
        `
    }

function generateVulnTotalTable(vulnTotalBySeverity: ScanResult['vulnTotalBySeverity']): string {
    return `
            <table>
                <tr>
                    <th>Critical</th>
                    <th>High</th>
                    <th>Medium</th>
                    <th>Low</th>
                    <th>Negligible</th>
                </tr>
                <tr>
                    <td>${vulnTotalBySeverity.critical}</td>
                    <td>${vulnTotalBySeverity.high}</td>
                    <td>${vulnTotalBySeverity.medium}</td>
                    <td>${vulnTotalBySeverity.low}</td>
                    <td>${vulnTotalBySeverity.negligible}</td>
                </tr>
            </table>
        </div>
    `;
}

function generatePackagesTable(packages: Package[]): string {
    let packagesTable = `
        <table>
            <tr>
                <th>Vulnerability</th>
                <th>Severity</th>
                <th>CVSS</th>
                <th>Exploit</th>
                <th>Package</th>
                <th>Version</th>
                <th>Fix version</th>
                <th>Type</th>
                <th>Path</th>
            </tr>`;

    const vulnPackages: EnrichedVulnInfo[] = [];

    for (const vulnPackage of packages) {
        if (vulnPackage.vulns) {
            // for each vulns under vulnPackage, create a new vuln_info object and add to vulnsPackage list
            for (const vulnerability of vulnPackage.vulns) {
                const vuln_info: EnrichedVulnInfo = {
                    package: vulnPackage.name,
                    path: vulnPackage.path,
                    exploitable: vulnerability.exploitable,
                    current_version: vulnPackage.version,
                    type: vulnPackage.type,
                    name: vulnerability.name,
                    severity: vulnerability.severity.value,
                    cvssScore: vulnerability.cvssScore.value.score,
                    fix_version: vulnPackage.suggestedFix
                };
                vulnPackages.push(vuln_info);
            }
        }
    }

    const sortedVulnPackages = sortVulnPackages(vulnPackages);
    
    sortedVulnPackages.forEach((vuln: EnrichedVulnInfo) => {
        var suggestedFixFormat = vuln.fix_version == 'undefined' ? vuln.fix_version : "N/A";
            packagesTable += `<tr>
                    <td>${vuln.name}</td>
                    <td>${vuln.severity}</td>
                    <td>${vuln.cvssScore}</td>
                    <td>${vuln.exploitable}</td>
                    <td>${vuln.package}</td>
                    <td>${vuln.current_version}</td>
                    <td>${suggestedFixFormat}</td>
                    <td>${vuln.type}</td>
                    <td>${vuln.path}</td>
                </tr>`;
    });

    return packagesTable;
}

function sortVulnPackages(vulnPackages: EnrichedVulnInfo[]): EnrichedVulnInfo[] {
    const order = ['critical', 'high', 'medium', 'low', 'negligible'];
    return vulnPackages.sort((a, b) => {
        const severityIndexA = order.indexOf(a.severity.toLowerCase());
        const severityIndexB = order.indexOf(b.severity.toLowerCase());

        if (severityIndexA > severityIndexB) {
            return 1;
        } else if (severityIndexA < severityIndexB) {
            return -1;
        } else {
            // Sorting by CVSS score in descending order when severities are the same
            return b.cvssScore - a.cvssScore;
        }
    });
}
