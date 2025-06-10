import { Module, DynamicModule, Provider } from '@nestjs/common';
import { AsyncRepositoryOptions, RepositoryOptions, RepositoryService } from '.';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';

@Module({})
export class MongooseRepositoryModule {
  static forFeature<TDocument = any>(
    options: RepositoryOptions,
  ): DynamicModule {
    const mongooseFeature = MongooseModule.forFeature([
      { name: options.name, schema: options.schema },
    ]);

    const repoProvider: Provider = {
      provide: `${options.name}Repository`,
      useFactory: (model: any) => {
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

  static forFeatureAsync<TDocument = any>(
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
      useFactory: (model: any) => new RepositoryService(model),
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