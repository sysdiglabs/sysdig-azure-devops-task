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

    // Table for vulnTotalBySeverity
    let vulnTotalTable = generateVulnTotalTable(jsonData.result.vulnTotalBySeverity);

    // Table for packages
    let packagesTable = generatePackagesTable(jsonData.result.packages);

return styles + vulnTotalTable + packagesTable;
}

function generateStyles(): string {
    return `
    <style>
        table {
            width: 100%;
            border-collapse: separate; /* Use 'separate' to allow spacing between cells */
            border-spacing: 0 10px; /* Adds spacing between rows */
            margin-bottom: 20px;
            overflow: auto;
            font-size: 16px; /* Larger font size for readability */
            font-family: Arial, sans-serif; /* A clean, modern font */
        }
        th, td {
            border: 1px solid #ccc; /* Lighter border color */
            padding: 12px 15px; /* Increased padding for space */
            text-align: left;
            background-color: white; /* White background for cells */
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); /* Subtle shadow for depth */
        }
        th {
            background-color: #4CAF50; /* More vibrant header color */
            color: white; /* White text for contrast */
            font-weight: bold; /* Bold font for headers */
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
    `;
}

function generatePackagesTable(packages: Package[]): string {
    let packagesTable = `
        <table>
            <tr>
                <th>CVE</th>
                <th>Type</th>
                <th>Path</th>
                <th>Score</th>
                <th>Exploitable</th>
                <th>Severity</th>
                <th>Package</th>
                <th>Current version</th>
                <th>Suggested version</th>

            </tr>`;

    const vulnPackages: EnrichedVulnInfo[] = [];

    for (const vulnPackage of packages) {
        if (vulnPackage.vulns) {
            // for each vulns under vulnPackage, create a new vuln_info object and add to vulnsPackage list
            for (const vulnerability of vulnPackage.vulns) {
                console.log("Package: ",vulnPackage);
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

    const sortedVulnPackages = vulnPackages.sort((a, b) => Number(b.cvssScore) - Number(a.cvssScore));

    sortedVulnPackages.forEach((vuln: EnrichedVulnInfo) => {
        console.log("Enriched vuln: ", vuln);
        var suggestedFixFormat = vuln.fix_version == 'undefined' ? vuln.fix_version : "N/A";
            packagesTable += `<tr>
                    <td>${vuln.name}</td>
                    <td>${vuln.type}</td>
                    <td>${vuln.path}</td>
                    <td>${vuln.cvssScore}</td>
                    <td>${vuln.exploitable}</td>
                    <td>${vuln.severity}</td>
                    <td>${vuln.package}</td>
                    <td>${vuln.current_version}</td>
                    <td>${suggestedFixFormat}</td>
                </tr>`;
    });

    return packagesTable;
}