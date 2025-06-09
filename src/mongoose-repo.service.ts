import { Inject, Injectable, Optional } from '@nestjs/common';

@Injectable()
export class MongooseRepoService {
  constructor(@Optional() @Inject('MY_OPTIONS') private opts: any) { }

  getHello(): string {
    return `Hello from MyModule! ${JSON.stringify(this.opts)}`;
  }
}