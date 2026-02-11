import type { ExtensionManifest } from "@orbitr/types";
import { logger } from "../logger";
import * as fs from "fs/promises";
import * as path from "path";

export interface ExtensionRegistryEntry {
  id: string;
  name: string;
  version: string;
  description: string;
  author: {
    name: string;
    email?: string;
    url?: string;
  };
  type: string;
  repository: string;
  homepage?: string;
  tags: string[];
  downloads: number;
  stars: number;
  lastUpdated: string;
}

/**
 * ExtensionRegistry - Manages extension registry and discovery
 */
export class ExtensionRegistry {
  private registryPath: string;
  private extensions: Map<string, ExtensionRegistryEntry> = new Map();

  constructor(registryPath?: string) {
    this.registryPath = registryPath || path.join(process.cwd(), "extensions", "registry.json");
  }

  /**
   * Load registry from file
   */
  async load(): Promise<void> {
    try {
      const data = await fs.readFile(this.registryPath, "utf-8");
      const registry = JSON.parse(data);

      this.extensions.clear();
      for (const ext of registry.extensions || []) {
        this.extensions.set(ext.id, ext);
      }

      logger.info({ count: this.extensions.size }, "Extension registry loaded");
    } catch (error) {
      logger.error({ error, path: this.registryPath }, "Failed to load extension registry");
      throw error;
    }
  }

  /**
   * Get all extensions from registry
   */
  getAll(): ExtensionRegistryEntry[] {
    return Array.from(this.extensions.values());
  }

  /**
   * Get extension by ID
   */
  get(id: string): ExtensionRegistryEntry | undefined {
    return this.extensions.get(id);
  }

  /**
   * Search extensions
   */
  search(query: string): ExtensionRegistryEntry[] {
    const lowerQuery = query.toLowerCase();
    return this.getAll().filter(
      (ext) =>
        ext.name.toLowerCase().includes(lowerQuery) ||
        ext.description.toLowerCase().includes(lowerQuery) ||
        ext.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Filter extensions by type
   */
  filterByType(type: string): ExtensionRegistryEntry[] {
    return this.getAll().filter((ext) => ext.type === type);
  }

  /**
   * Filter extensions by tag
   */
  filterByTag(tag: string): ExtensionRegistryEntry[] {
    return this.getAll().filter((ext) => ext.tags.includes(tag));
  }

  /**
   * Get popular extensions (by downloads)
   */
  getPopular(limit = 10): ExtensionRegistryEntry[] {
    return this.getAll()
      .sort((a, b) => b.downloads - a.downloads)
      .slice(0, limit);
  }

  /**
   * Get recent extensions (by last updated)
   */
  getRecent(limit = 10): ExtensionRegistryEntry[] {
    return this.getAll()
      .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
      .slice(0, limit);
  }

  /**
   * Download extension manifest from repository
   */
  async downloadManifest(extensionId: string): Promise<ExtensionManifest> {
    const entry = this.get(extensionId);
    if (!entry) {
      throw new Error(`Extension ${extensionId} not found in registry`);
    }

    try {
      logger.info({ extensionId, repository: entry.repository }, "Downloading extension manifest");

      // For now, assume GitHub repository
      // In production, support multiple sources
      const manifestUrl = this.getManifestUrl(entry.repository);
      
      const response = await fetch(manifestUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch manifest: ${response.statusText}`);
      }

      const manifest = await response.json();
      logger.info({ extensionId }, "Extension manifest downloaded");

      return manifest;
    } catch (error) {
      logger.error({ error, extensionId }, "Failed to download extension manifest");
      throw error;
    }
  }

  /**
   * Get manifest URL from repository
   */
  private getManifestUrl(repository: string): string {
    // Convert GitHub repo URL to raw manifest URL
    if (repository.includes("github.com")) {
      const repoPath = repository.replace("https://github.com/", "");
      return `https://raw.githubusercontent.com/${repoPath}/main/manifest.json`;
    }

    // For other sources, assume direct URL
    return `${repository}/manifest.json`;
  }

  /**
   * Refresh registry from remote source
   */
  async refresh(): Promise<void> {
    try {
      logger.info("Refreshing extension registry");

      // In production, fetch from GitHub or CDN
      const registryUrl =
        process.env.ORBITR_REGISTRY_URL ||
        "https://raw.githubusercontent.com/orbitr/registry/main/registry.json";

      const response = await fetch(registryUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch registry: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Save to local cache
      await fs.mkdir(path.dirname(this.registryPath), { recursive: true });
      await fs.writeFile(this.registryPath, JSON.stringify(data, null, 2));

      // Reload
      await this.load();

      logger.info("Extension registry refreshed");
    } catch (error) {
      logger.error({ error }, "Failed to refresh extension registry");
      throw error;
    }
  }
}

// Singleton instance
let extensionRegistry: ExtensionRegistry | null = null;

export function getExtensionRegistry(registryPath?: string): ExtensionRegistry {
  if (!extensionRegistry) {
    extensionRegistry = new ExtensionRegistry(registryPath);
  }
  return extensionRegistry;
}

export default ExtensionRegistry;
