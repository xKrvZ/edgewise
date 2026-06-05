import { Injectable } from '@nestjs/common';
import { KyselyDao } from '@/database/kysely/kysely.dao';
import { DB } from '@/database/types/db';
import { UserDto } from '../dtos/user.dto';

@Injectable()
export class UserDao extends KyselyDao<UserDao> {
  static readonly TABLE = 'user' as keyof DB;

  // ==================== Public Query Methods ====================

  async findByIds(ids: string[]): Promise<Map<string, UserDto>> {
    if (ids.length === 0) {
      return new Map();
    }

    const users = await this.kysely
      .selectFrom(UserDao.TABLE)
      .select(['id', 'name', 'role'])
      .where('id', 'in', ids)
      .execute();

    const userMap = new Map<string, UserDto>();
    for (const user of users) {
      if (!user.id) continue;
      const userId = String(user.id);
      userMap.set(userId, {
        id: userId,
        name: (user.name ?? '') as string,
        role: (user.role ?? '') as string,
      });
    }

    return userMap;
  }
}
