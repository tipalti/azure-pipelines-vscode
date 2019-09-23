import { PipelineTemplate, TargetResourceType, WizardInputs, WebAppKind } from '../model/models';
import * as fs from 'fs';
import * as Mustache from 'mustache';
import * as path from 'path';
import * as Q from 'q';

export enum Language {
    Java = 'java',
    Node = 'node',
    None = 'none',
    Python = 'python'
};

export async function analyzeRepoAndListAppropriatePipeline(repoPath: string, targetResourceType?: TargetResourceType, targetKind?: WebAppKind): Promise<PipelineTemplate[]> {
    let templateList = simpleWebAppTemplates;
    let analysisResult = await analyzeRepo(repoPath);
    templateList.concat(getTemplatesForAnalysisResult(analysisResult, targetResourceType, targetKind));

    return templateList;
}

export async function renderContent(templateFilePath: string, context: WizardInputs): Promise<string> {
    let deferred: Q.Deferred<string> = Q.defer();
    fs.readFile(templateFilePath, { encoding: "utf8" }, async (error, data) => {
        if (error) {
            throw new Error(error.message);
        }
        else {
            let fileContent = Mustache.render(data, context);
            deferred.resolve(fileContent);
        }
    });

    return deferred.promise;
}

async function analyzeRepo(repoPath: string): Promise<AnalysisResult> {
    let deferred: Q.Deferred<AnalysisResult> = Q.defer();
    fs.readdir(repoPath, (err, files: string[]) => {
        let result: AnalysisResult = { language: Language.None };
        if (isJavaRepo(files)) {
            result = { language: Language.Java };
        }
        else if (isPythonRepo(files)) {
            result = { language: Language.Python };
        }
        else if (isNodeRepo(files)) {
            result = { language: Language.Node };
        }

        deferred.resolve(result);
    });

    return deferred.promise;
}

function isNodeRepo(files: string[]): boolean {
    let nodeFilesRegex = '\\.ts$|\\.js$|package\\.json$|node_modules';
    return files.some((file) => {
        let result = new RegExp(nodeFilesRegex).test(file.toLowerCase());
        return result;
    });
}

function isJavaRepo(files: string[]): boolean {
    let javaFilesRegex = '\\pom.xml|\\.java$';
    return files.some((file) => {
        let result = new RegExp(javaFilesRegex).test(file.toLowerCase());
        return result;
    });
}

function isPythonRepo(files: string[]): boolean {
    let pythonFilesRegex = '\\.pyproj$|\\.requirements.txt';
    return files.some((file) => {
        let result = new RegExp(pythonFilesRegex).test(file.toLowerCase());
        return result;
    });
}

function getTemplatesForAnalysisResult(analysisResult: AnalysisResult, targetResourceType?: TargetResourceType, targetKind?: WebAppKind): Array<PipelineTemplate> {
    let templatesResult: Array<PipelineTemplate> = [];

    switch (analysisResult.language) {
        case Language.Java:
            templatesResult.concat(javaTemplates);
            break;
        case Language.Python:
            templatesResult.concat(pythonTemplates);
            break;
        case Language.Node:
            templatesResult.concat(nodeTemplates);
            break;
    }

    targetResourceType = targetResourceType ? targetResourceType : analysisResult.targetFilter.targetType;
    if (targetResourceType) {
        templatesResult = templatesResult.filter((template) => {
            return template.azureResourceFilters.targetType == targetResourceType;
        });

        targetKind = targetKind ? targetKind : analysisResult.targetFilter.targetKind;
        if (targetKind) {
            templatesResult = templatesResult.filter((template) => {
                return !template.azureResourceFilters.webappKind || template.azureResourceFilters.webappKind == targetKind;
            });
        }
    }

    return templatesResult;
}

const nodeTemplates: Array<PipelineTemplate> = [
    {
        label: 'Node.js with npm to Windows Web App',
        path: path.join(path.dirname(path.dirname(__dirname)), 'configure/templates/nodejs.yml'),
        language: Language.Node,
        azureResourceFilters: { targetType: TargetResourceType.WebApp, webappKind: WebAppKind.WindowsApp }
    },
    {
        label: 'Node.js with Gulp to Windows Web App',
        path: path.join(path.dirname(path.dirname(__dirname)), 'configure/templates/nodejsWithGulp.yml'),
        language: Language.Node,
        azureResourceFilters: { targetType: TargetResourceType.WebApp, webappKind: WebAppKind.WindowsApp }
    },
    {
        label: 'Node.js with Grunt to Windows Web App',
        path: path.join(path.dirname(path.dirname(__dirname)), 'configure/templates/nodejsWithGrunt.yml'),
        language: Language.Node,
        azureResourceFilters: { targetType: TargetResourceType.WebApp, webappKind: WebAppKind.WindowsApp }
    },
    {
        label: 'Node.js with Angular to Windows Web App',
        path: path.join(path.dirname(path.dirname(__dirname)), 'configure/templates/nodejsWithAngular.yml'),
        language: Language.Node,
        azureResourceFilters: { targetType: TargetResourceType.WebApp, webappKind: WebAppKind.WindowsApp }
    },
    {
        label: 'Node.js with Webpack to Windows Web App',
        path: path.join(path.dirname(path.dirname(__dirname)), 'configure/templates/nodejsWithWebpack.yml'),
        language: Language.Node,
        azureResourceFilters: { targetType: TargetResourceType.WebApp, webappKind: WebAppKind.WindowsApp }
    }
];

const simpleWebAppTemplates: Array<PipelineTemplate> = [
    {
        label: 'Simple application to Windows Web App',
        path: path.join(path.dirname(path.dirname(__dirname)), 'configure/templates/simpleWebApp.yml'),
        language: Language.None,
        azureResourceFilters: { targetType: TargetResourceType.WebApp, webappKind: WebAppKind.WindowsApp }
    }
];

const javaTemplates: Array<PipelineTemplate> = [
    {
        label: 'Maven with Java to Linux Web App',
        path: path.join(path.dirname(path.dirname(__dirname)), 'configure/templates/java-maven-LinuxWebApp.yml'),
        language: Language.Java,
        azureResourceFilters: { targetType: TargetResourceType.WebApp, webappKind: WebAppKind.LinuxApp }
    }
];

const pythonTemplates: Array<PipelineTemplate> = [
    {
        label: 'Python with Django to Windows Web App',
        path: path.join(path.dirname(path.dirname(__dirname)), 'configure/templates/python-django-WindowsWebApp.yml'),
        language: Language.Python,
        azureResourceFilters: { targetType: TargetResourceType.WebApp, webappKind: WebAppKind.WindowsApp }
    }
];

interface AnalysisResult {
    language: Language,
    targetFilter?: { targetType: TargetResourceType, targetKind?: WebAppKind }
};