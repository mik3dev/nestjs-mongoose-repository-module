// src/interfaces.ts
import { Schema } from 'mongoose';
import { ModuleMetadata } from '@nestjs/common';

export interface RepositoryOptions {
  name: string;
  schema: Schema;
}

export interface AsyncRepositoryOptions extends Pick<ModuleMetadata, 'imports'> {
  name: string;
  useFactory: (...args: unknown[]) => Promise<Schema> | Schema;
  inject?: unknown[];
}