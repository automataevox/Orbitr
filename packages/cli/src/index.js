#!/usr/bin/env node

/**
 * Orbitr CLI
 * Command-line interface for managing Orbitr
 */

const { program } = require("commander");
const { getDockerManager, getExtensionLoader, getBackupManager } = require("@orbitr/core");
const packageJson = require("../package.json");

program
  .name("orbitr")
  .description("CLI for managing Orbitr orchestration platform")
  .version(packageJson.version);

// Docker commands
const docker = program.command("docker").description("Manage Docker resources");

docker
  .command("info")
  .description("Show Docker system information")
  .action(async () => {
    try {
      const dockerManager = getDockerManager();
      const info = await dockerManager.getInfo();
      console.log(JSON.stringify(info, null, 2));
    } catch (error) {
      console.error("Error:", error.message);
      process.exit(1);
    }
  });

docker
  .command("ps")
  .description("List containers")
  .option("-a, --all", "Show all containers")
  .action(async (options) => {
    try {
      const dockerManager = getDockerManager();
      const containers = await dockerManager.listContainers({ all: options.all });
      
      console.log("\nCONTAINER ID\tIMAGE\t\t\tSTATUS\t\tNAMES");
      containers.forEach((container) => {
        const id = container.Id.substring(0, 12);
        const image = container.Image.substring(0, 20).padEnd(20);
        const status = container.Status;
        const names = container.Names.join(", ");
        console.log(`${id}\t${image}\t${status}\t${names}`);
      });
    } catch (error) {
      console.error("Error:", error.message);
      process.exit(1);
    }
  });

// Extension commands
const extension = program.command("extension").description("Manage extensions");

extension
  .command("list")
  .description("List installed extensions")
  .action(async () => {
    try {
      const { prisma } = require("@orbitr/database");
      const extensions = await prisma.extension.findMany();
      
      console.log("\nID\t\t\tNAME\t\t\tSTATUS\t\tVERSION");
      extensions.forEach((ext) => {
        console.log(`${ext.id}\t\t${ext.name}\t\t${ext.status}\t${ext.version}`);
      });
    } catch (error) {
      console.error("Error:", error.message);
      process.exit(1);
    }
  });

extension
  .command("install <id>")
  .description("Install an extension")
  .action(async (id) => {
    try {
      console.log(`Installing extension: ${id}...`);
      const extensionLoader = getExtensionLoader();
      
      await extensionLoader.installExtension(id, {}, (progress) => {
        console.log(`Progress: ${progress.phase} (${progress.percent}%)`);
      });
      
      console.log("✅ Extension installed successfully");
    } catch (error) {
      console.error("Error:", error.message);
      process.exit(1);
    }
  });

extension
  .command("uninstall <id>")
  .description("Uninstall an extension")
  .action(async (id) => {
    try {
      console.log(`Uninstalling extension: ${id}...`);
      const extensionLoader = getExtensionLoader();
      await extensionLoader.uninstallExtension(id);
      console.log("✅ Extension uninstalled successfully");
    } catch (error) {
      console.error("Error:", error.message);
      process.exit(1);
    }
  });

// Backup commands
const backup = program.command("backup").description("Manage backups");

backup
  .command("create")
  .description("Create a new backup")
  .option("--no-volumes", "Exclude volumes")
  .option("--no-database", "Exclude database")
  .option("--no-config", "Exclude configuration")
  .action(async (options) => {
    try {
      console.log("Creating backup...");
      const backupManager = getBackupManager();
      
      const metadata = await backupManager.createBackup({
        includeVolumes: options.volumes !== false,
        includeDatabase: options.database !== false,
        includeConfig: options.config !== false,
        compression: "none",
      });
      
      console.log("✅ Backup created successfully");
      console.log(`Backup ID: ${metadata.id}`);
      console.log(`Size: ${(metadata.size / 1024 / 1024).toFixed(2)} MB`);
    } catch (error) {
      console.error("Error:", error.message);
      process.exit(1);
    }
  });

backup
  .command("list")
  .description("List all backups")
  .action(async () => {
    try {
      const backupManager = getBackupManager();
      const backups = await backupManager.listBackups();
      
      console.log("\nBACKUP ID\t\t\t\tDATE\t\t\t\tSIZE");
      backups.forEach((backup) => {
        const size = `${(backup.size / 1024 / 1024).toFixed(2)} MB`;
        console.log(`${backup.id}\t${backup.timestamp}\t${size}`);
      });
    } catch (error) {
      console.error("Error:", error.message);
      process.exit(1);
    }
  });

backup
  .command("restore <id>")
  .description("Restore from a backup")
  .action(async (id) => {
    try {
      console.log(`Restoring backup: ${id}...`);
      const backupManager = getBackupManager();
      
      await backupManager.restoreBackup({
        backupId: id,
        restoreVolumes: true,
        restoreDatabase: true,
        restoreConfig: true,
      });
      
      console.log("✅ Backup restored successfully");
    } catch (error) {
      console.error("Error:", error.message);
      process.exit(1);
    }
  });

// Health commands
program
  .command("health")
  .description("Check system health")
  .action(async () => {
    try {
      const dockerManager = getDockerManager();
      const { getHealthMonitor } = require("@orbitr/core");
      
      // Check Docker
      await dockerManager.ping();
      console.log("✅ Docker: OK");
      
      // Check Health Monitor
      const healthMonitor = getHealthMonitor();
      const statuses = await healthMonitor.getAllHealthStatus();
      const healthy = statuses.filter((s) => s.status === "healthy").length;
      const unhealthy = statuses.filter((s) => s.status === "unhealthy").length;
      
      console.log(`✅ Health Monitor: ${healthy} healthy, ${unhealthy} unhealthy`);
      
      console.log("\n🎉 System is healthy!");
    } catch (error) {
      console.error("❌ System health check failed:", error.message);
      process.exit(1);
    }
  });

// Parse arguments
program.parse();
