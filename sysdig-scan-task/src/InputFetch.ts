import tl = require('azure-pipelines-task-lib/task');

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

    get techpreview(): boolean {
        return tl.getBoolInput('techPreview');
    }

    get jsonOutput(): boolean {
        return tl.getBoolInput('jsonOutput');
    }

    get jsonOutputFile(): string {
        return this.fetchString('jsonOutputFile', false);
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