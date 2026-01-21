import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
  Optional,
} from '@nestjs/common';
import {
  isSupportedEntityType,
  SUPPORTED_ENTITY_TYPES,
} from '../constants/entity-types.constants';

/**
 * Pipe that normalizes and validates entity type path parameters
 * Normalizes: "player" -> "Player", "USER" -> "User", etc.
 */
@Injectable()
export class EntityTypePipe implements PipeTransform<string, string> {
  transform(value: string, metadata: ArgumentMetadata): string {
    if (!value || typeof value !== 'string') {
      throw new BadRequestException('Entity type is required');
    }

    // Normalize: capitalize first letter, rest lowercase
    const normalized = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();

    // Validate against supported types
    if (!isSupportedEntityType(normalized)) {
      throw new BadRequestException(
        `Unsupported entity type: ${value}. Supported types are: ${SUPPORTED_ENTITY_TYPES.join(', ')}`,
      );
    }

    return normalized;
  }
}

/**
 * Pipe that normalizes and validates optional entity type query parameters
 * Normalizes: "player" -> "Player", "USER" -> "User", etc.
 * Returns undefined if value is not provided
 */
@Injectable()
export class OptionalEntityTypePipe implements PipeTransform<string | undefined, string | undefined> {
  transform(value: string | undefined, metadata: ArgumentMetadata): string | undefined {
    // If value is not provided, return undefined
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    // Handle array case (query params can be arrays)
    const stringValue = Array.isArray(value) ? value[0] : value;

    if (typeof stringValue !== 'string' || stringValue.length === 0) {
      return undefined;
    }

    // Normalize: capitalize first letter, rest lowercase
    const normalized = stringValue.charAt(0).toUpperCase() + stringValue.slice(1).toLowerCase();

    // Validate against supported types
    if (!isSupportedEntityType(normalized)) {
      throw new BadRequestException(
        `Unsupported entity type: ${stringValue}. Supported types are: ${SUPPORTED_ENTITY_TYPES.join(', ')}`,
      );
    }

    return normalized;
  }
}
