import { server_host } from "../constants/apis";
import { httpClient } from "../lib/httpClient";
import type { WorkspaceExport, WorkspaceImportResult } from "../models/workspace";

export const exportWorkspace = () =>
  httpClient.get<WorkspaceExport>(`${server_host}/workspace/export`);

export const importWorkspace = (data: WorkspaceExport) =>
  httpClient.post<WorkspaceImportResult>(`${server_host}/workspace/import`, data);
