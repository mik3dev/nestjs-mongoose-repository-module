import { Module, DynamicModule } from '@nestjs/common';
import { MongooseRepoService } from '.';

@Module({
  providers: [MongooseRepoService],
  exports: [MongooseRepoService],
})
export class MyModule {
  static forRoot(options?: any): DynamicModule {
    return {
      module: MyModule,
      providers: [
        { provide: 'MY_OPTIONS', useValue: options },
        MongooseRepoService,
      ],
      exports: [MongooseRepoService],
    };
  }
}