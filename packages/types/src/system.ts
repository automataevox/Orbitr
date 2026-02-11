export interface SystemSetting {
  id: string;
  key: string;
  value: string;
  encrypted: boolean;
  updatedAt: Date;
}

export interface SystemInfo {
  version: string;
  dockerVersion: string;
  containersRunning: number;
  containersTotal: number;
  extensionsInstalled: number;
  uptime: number;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
}
