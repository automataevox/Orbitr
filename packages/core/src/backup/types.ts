export interface BackupConfig {
  includeVolumes: boolean;
  includeDatabase: boolean;
  includeConfig: boolean;
  compression: "none" | "gzip" | "bzip2";
}

export interface BackupMetadata {
  id: string;
  timestamp: Date;
  size: number;
  containers: string[];
  volumes: string[];
  extensions: string[];
  config: BackupConfig;
}

export interface RestoreOptions {
  backupId: string;
  restoreVolumes: boolean;
  restoreDatabase: boolean;
  restoreConfig: boolean;
  containerMapping?: Record<string, string>;
}
