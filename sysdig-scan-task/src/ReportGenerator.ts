import * as fs from 'fs';

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
}

interface Package {
    type: string;
    path: string;
    vulns: Vulnerability[] | null;
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

export interface SysdigScan {
    result: ScanResult;
}

function getMaxCvssScore(pkg: Package): number {
    if (!pkg.vulns || pkg.vulns.length === 0) {
        return 0;
    }
    return pkg.vulns.reduce((max, vuln) => vuln.cvssScore.value.score > max ? vuln.cvssScore.value.score : max, 0);
}

export function generateHTMLTableFromSysdigJSON(jsonData: SysdigScan): string {
    // Styling for the tables
    let styles = `
        <style>
            table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
            }
            th, td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
            }
            th {
                background-color: #f2f2f2;
                color: black;
            }
            tr:nth-child(even) {
                background-color: #f9f9f9;
            }
            tr:hover {
                background-color: #f1f1f1;
            }
        </style>
    `;

    // Table for vulnTotalBySeverity
    let vulnTotalTable = `
        <table>
            <tr>
                <th>Critical</th>
                <th>High</th>
                <th>Medium</th>
                <th>Low</th>
                <th>Negligible</th>
            </tr>
            <tr>
                <td>${jsonData.result.vulnTotalBySeverity.critical}</td>
                <td>${jsonData.result.vulnTotalBySeverity.high}</td>
                <td>${jsonData.result.vulnTotalBySeverity.medium}</td>
                <td>${jsonData.result.vulnTotalBySeverity.low}</td>
                <td>${jsonData.result.vulnTotalBySeverity.negligible}</td>
            </tr>
        </table>
    `;

    // Table for package vulnerabilities
    let packagesTable = `
        <table>
            <tr>
                <th>CVE</th>
                <th>Type</th>
                <th>Path</th>
                <th>Score</th>
                <th>Exploitable</th>
                <th>Severity</th>
            </tr>`;

    jsonData.result.packages.forEach((pkg: Package) => {
        if (pkg.vulns) {
            pkg.vulns.forEach(vuln => {
                packagesTable += `<tr>
                    <td>${vuln.name}</td>
                    <td>${pkg.type}</td>
                    <td>${pkg.path}</td>
                    <td>${vuln.cvssScore.value.score}</td>
                    <td>${vuln.exploitable}</td>
                    <td>${vuln.severity.value}</td>
                </tr>`;
            });
        }
    });

    packagesTable += '</table>';

    return styles + vulnTotalTable + packagesTable;
}
