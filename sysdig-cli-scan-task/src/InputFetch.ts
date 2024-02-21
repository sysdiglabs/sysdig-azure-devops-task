import tl = require('azure-pipelines-task-lib');

export class InputFetch {

    constructor() { }

    get apikey(): string {
        return this.fetchString('apikey', true);
    }

    get sysdigurl(): string {
        return this.fetchString('sysdigurl', false);
    }

    get skipTLS(): boolean {
        return tl.getBoolInput('skipTLS');
    }

    get verbose(): boolean {
        return tl.getBoolInput('verbose');
    }

    get fullVulnsTable(): boolean {
        return tl.getBoolInput('fullVulnsTable');
    }

    get privileged(): boolean {
        return tl.getBoolInput('privileged');
    }

    get image(): string {
        return this.fetchString('image', true);
    }

    get malware(): boolean {
        return tl.getBoolInput('malware');
    }

    get failbuild(): boolean {
        return tl.getBoolInput('failBuild');
    }

    get internalRegistry(): string {
        return this.fetchString('internalRegistry', false);
    }

    get jsonOutput(): boolean {
        return tl.getBoolInput('jsonOutput');
    }

    get jsonOutputFile(): string {
        return this.fetchString('jsonOutputFile', false);
    }

    get autoPublishArtifacts(): boolean {
        return tl.getBoolInput('autoPublishArtifacts', false);
    }

    get sysdigCliScannerVersion(): string {
        return this.fetchString('sysdigCliScannerVersion', false);
    }

    get policy(): string {
        return this.fetchString('policy', false);
    }

    private error(input: string, required: boolean): string {
        if (required) {
            tl.setResult(tl.TaskResult.Failed, input.toUpperCase().concat(' fetch failed.'));
        }
        return '';
    }

    private fetchString(input: string, required: boolean): string {

        const ti: string | undefined = tl.getInput(input, required);

        if (ti === undefined || ti.length == 0) {
            return this.error(input, required);
        }
        return ti;
    }
}