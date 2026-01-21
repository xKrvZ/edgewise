import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';
import { SUPPORTED_ENTITY_TYPES } from '../constants/entity-types.constants';

/**
 * Custom validator that normalizes entity type (capitalizes first letter, rest lowercase)
 * and validates it against SUPPORTED_ENTITY_TYPES
 */
export function IsSupportedEntityType(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isSupportedEntityType',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') {
            return false;
          }
          // Normalize: capitalize first letter, rest lowercase
          const normalized = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
          // Update the value in the object
          (args.object as any)[propertyName] = normalized;
          return SUPPORTED_ENTITY_TYPES.includes(normalized as any);
        },
        defaultMessage(args: ValidationArguments) {
          return `entityType must be one of: ${SUPPORTED_ENTITY_TYPES.join(', ')}`;
        },
      },
    });
  };
}
