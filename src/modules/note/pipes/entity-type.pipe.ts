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
 * Performs case-insensitive matching and returns the exact supported type
 */
@Injectable()
export class EntityTypePipe implements PipeTransform<string, string> {
  transform(value: string, metadata: ArgumentMetadata): string {
    if (!value || typeof value !== 'string') {
      throw new BadRequestException('Entity type is required');
    }

    // Find matching supported type (case-insensitive)
    const matchedType = SUPPORTED_ENTITY_TYPES.find(
      (type) => type.toLowerCase() === value.toLowerCase(),
    );

    if (!matchedType) {
      throw new BadRequestException(
        `Unsupported entity type: ${value}. Supported types are: ${SUPPORTED_ENTITY_TYPES.join(', ')}`,
      );
    }

    // Return the exact supported type (preserves camelCase like "AbuseReport")
    return matchedType;
  }
}

/**
 * Pipe that normalizes and validates optional entity type query parameters
 * Performs case-insensitive matching and returns the exact supported type
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

    // Find matching supported type (case-insensitive)
    const matchedType = SUPPORTED_ENTITY_TYPES.find(
      (type) => type.toLowerCase() === stringValue.toLowerCase(),
    );

    if (!matchedType) {
      throw new BadRequestException(
        `Unsupported entity type: ${stringValue}. Supported types are: ${SUPPORTED_ENTITY_TYPES.join(', ')}`,
      );
    }

    // Return the exact supported type (preserves camelCase like "AbuseReport")
    return matchedType;
  }
}
