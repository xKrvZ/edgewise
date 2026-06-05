import { Module } from '@nestjs/common';
import { UserDao } from './daos/user.dao';

/**
 * User module for type definitions and DTOs.
 * User management (authentication, authorization) is handled by better-auth.
 * This module provides DTOs and DAO for type mapping across other modules.
 */
@Module({
  providers: [UserDao],
  exports: [UserDao],
})
export class UserModule {}
