// src/interfaces.ts
import { Schema } from 'mongoose';
import { ModuleMetadata, FactoryProvider } from '@nestjs/common';

export interface RepositoryOptions {
  name: string;
  schema: Schema;
}

export interface AsyncRepositoryOptions extends Pick<ModuleMetadata, 'imports'> {
  name: string;
  useFactory: (...args: any[]) => Promise<Schema> | Schema;
  inject?: any[];
}