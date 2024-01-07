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
            border-collapse: separate; /* Use 'separate' to allow spacing between cells */
            border-spacing: 0 10px; /* Adds spacing between rows */
            margin-bottom: 20px;
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
