import { Injectable } from "@nestjs/common";
import { InjectPostgres } from "../decorators/inject-postgres.decorator";
import { ConfigService } from "@nestjs/config";
import { Pool } from "pg";

@Injectable()
export class PostgresService {

    constructor(
		@InjectPostgres() protected readonly postgres: Pool,
		protected readonly configService: ConfigService,
	) {}

    async getPool(): Promise<Pool> {
        return this.postgres;
    }
}