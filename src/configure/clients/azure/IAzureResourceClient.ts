import {ResourceListResult, GenericResource} from "azure-arm-resource/lib/resource/models";

export interface IAzureResourceClient {
    getResource(resourceId: string, apiVersion?: string): Promise<GenericResource>;
    getResources(resourceType: string, followNextLink?: boolean): Promise<ResourceListResult>;
}