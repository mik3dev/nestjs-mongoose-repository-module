import { DynamicModule, Module, Provider } from '@nestjs/common';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { Model, Document } from 'mongoose';
import { RepositoryOptions, AsyncRepositoryOptions } from './interfaces';
import { RepositoryService } from './repository.service';

@Module({})
export class MongooseRepositoryModule {
  static forFeature<TDocument extends Document = Document>(
    options: RepositoryOptions,
  ): DynamicModule {
    const mongooseFeature = MongooseModule.forFeature([
      { name: options.name, schema: options.schema },
    ]);

    const repoProvider: Provider = {
      provide: `${options.name}Repository`,
      useFactory: (model: Model<TDocument>) => {
        return new RepositoryService(model);
      },
      inject: [getModelToken(options.name)],
    };

    return {
      module: MongooseRepositoryModule,
      imports: [mongooseFeature],
      providers: [repoProvider],
      exports: [repoProvider],
    };
  }

  static forFeatureAsync<TDocument extends Document = Document>(
    options: AsyncRepositoryOptions,
  ): DynamicModule {
    const asyncFeature = MongooseModule.forFeatureAsync([
      {
        name: options.name,
        useFactory: options.useFactory,
        inject: options.inject || [],
      },
    ]);

    const repoProvider = {
      provide: `${options.name}Repository`,
      useFactory: (model: Model<TDocument>) => new RepositoryService(model),
      inject: [getModelToken(options.name)],
    };

    return {
      module: MongooseRepositoryModule,
      imports: [
        ...(options.imports || []),
        asyncFeature,
      ],
      providers: [repoProvider],
      exports: [repoProvider],
    };
  }
}