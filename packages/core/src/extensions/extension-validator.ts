import { ExtensionManifestSchema, type ExtensionManifest } from "@orbitr/types";
import { logger } from "../logger";

/**
 * ExtensionValidator - Validates extension manifests and configurations
 */
export class ExtensionValidator {
  /**
   * Validate extension manifest against schema
   */
  static validateManifest(manifest: unknown): {
    valid: boolean;
    data?: ExtensionManifest;
    errors?: string[];
  } {
    try {
      const result = ExtensionManifestSchema.safeParse(manifest);

      if (result.success) {
        return {
          valid: true,
          data: result.data,
        };
      } else {
        const errors = result.error.errors.map(
          (err) => `${err.path.join(".")}: ${err.message}`
        );
        logger.warn({ errors }, "Extension manifest validation failed");
        return {
          valid: false,
          errors,
        };
      }
    } catch (error) {
      logger.error({ error }, "Failed to validate extension manifest");
      return {
        valid: false,
        errors: ["Failed to parse manifest"],
      };
    }
  }

  /**
   * Validate extension ID format
   */
  static validateId(id: string): boolean {
    return /^[a-z0-9-]+$/.test(id);
  }

  /**
   * Validate extension version format (semver)
   */
  static validateVersion(version: string): boolean {
    return /^\d+\.\d+\.\d+$/.test(version);
  }

  /**
   * Validate environment variable configuration
   */
  static validateEnvironment(
    manifest: ExtensionManifest,
    config: Record<string, string>
  ): { valid: boolean; missing: string[]; invalid: string[] } {
    const missing: string[] = [];
    const invalid: string[] = [];

    for (const envVar of manifest.environment) {
      const value = config[envVar.name];

      // Check required fields
      if (envVar.required && !value) {
        missing.push(envVar.name);
        continue;
      }

      // Skip if not provided and not required
      if (!value) continue;

      // Type validation
      if (envVar.type === "number" && isNaN(Number(value))) {
        invalid.push(`${envVar.name}: must be a number`);
      }

      if (envVar.type === "boolean" && !["true", "false", "1", "0"].includes(value.toLowerCase())) {
        invalid.push(`${envVar.name}: must be a boolean`);
      }

      // Pattern validation
      if (envVar.validation?.pattern) {
        const regex = new RegExp(envVar.validation.pattern);
        if (!regex.test(value)) {
          invalid.push(`${envVar.name}: does not match required pattern`);
        }
      }

      // Range validation for numbers
      if (envVar.type === "number") {
        const numValue = Number(value);
        if (envVar.validation?.min !== undefined && numValue < envVar.validation.min) {
          invalid.push(`${envVar.name}: must be at least ${envVar.validation.min}`);
        }
        if (envVar.validation?.max !== undefined && numValue > envVar.validation.max) {
          invalid.push(`${envVar.name}: must be at most ${envVar.validation.max}`);
        }
      }

      // Select options validation
      if (envVar.type === "select" && envVar.options) {
        const validValues = envVar.options.map((opt) => opt.value);
        if (!validValues.includes(value)) {
          invalid.push(`${envVar.name}: must be one of ${validValues.join(", ")}`);
        }
      }
    }

    return {
      valid: missing.length === 0 && invalid.length === 0,
      missing,
      invalid,
    };
  }

  /**
   * Check if extension requirements are met
   */
  static validateRequirements(
    manifest: ExtensionManifest,
    orbitrVersion: string,
    installedExtensions: string[]
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check Orbitr version
    if (manifest.requirements?.minOrbitrVersion) {
      if (!this.compareVersions(orbitrVersion, manifest.requirements.minOrbitrVersion)) {
        errors.push(
          `Requires Orbitr version ${manifest.requirements.minOrbitrVersion} or higher (current: ${orbitrVersion})`
        );
      }
    }

    // Check required extensions
    if (manifest.requirements?.extensions) {
      for (const requiredExt of manifest.requirements.extensions) {
        if (!installedExtensions.includes(requiredExt)) {
          errors.push(`Requires extension: ${requiredExt}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Compare semantic versions
   */
  static compareVersions(current: string, required: string): boolean {
    const currentParts = current.split(".").map(Number);
    const requiredParts = required.split(".").map(Number);

    for (let i = 0; i < 3; i++) {
      if (currentParts[i] > requiredParts[i]) return true;
      if (currentParts[i] < requiredParts[i]) return false;
    }

    return true; // Equal versions
  }
}

export default ExtensionValidator;
