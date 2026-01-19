import { UserDto } from '../dtos/user.dto';

/**
 * Maps user data from joined query results to UserDto
 * 
 * @param row - The raw query result row
 * @param prefix - The prefix used for the user fields in the query (e.g., 'issuedBy', 'liftedBy', 'reviewedBy')
 * @returns A UserDto or null if no user data exists
 * 
 * @example
 * ```typescript
 * // In a DAO query with joined user data:
 * .select([
 *   'user.id as issuedBy_id',
 *   'user.name as issuedBy_name',
 *   'user.role as issuedBy_role',
 * ])
 * 
 * // Then in mapToDto:
 * issuedBy: UserMapper.map(row, 'issuedBy')
 * ```
 */
export class UserMapper {
  /**
   * Maps user data from joined query results
   */
  static map(row: any, prefix: string): UserDto | null {
    const id = row[`${prefix}_id`];
    const name = row[`${prefix}_name`];
    const role = row[`${prefix}_role`];

    if (!id) {
      return null;
    }

    return {
      id,
      name: name!,
      role: role || '',
    };
  }
}
