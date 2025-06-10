# Mongoose Repository Module

A NestJS module that provides a repository pattern implementation for Mongoose. This module simplifies interaction with MongoDB by providing a clean, abstracted interface through repository services.

## Installation

```bash
npm install nestjs-mongoose-repository-module
```

Make sure you have the required peer dependencies:

```bash
npm install @nestjs/common @nestjs/mongoose mongoose
```

## Features

- Simplifies MongoDB operations with a repository pattern
- Fully integrates with NestJS dependency injection
- Supports both synchronous and asynchronous schema definitions
- Provides standardized CRUD operations and additional utility methods
- Type-safe repository implementations with TypeScript generics

## Quick Start

### Module Registration

Register the module in your NestJS application:

```typescript
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MongooseRepositoryModule } from 'mongoose-repo-module';
import { UserSchema } from './schemas/user.schema';

@Module({
  imports: [
    // Connect to MongoDB
    MongooseModule.forRoot(
      'mongodb://localhost:27017/test',
    ),
    
    // Register a repository with a schema directly
    MongooseRepositoryModule.forFeature({
      name: 'User',
      schema: UserSchema,
    }),
    
    // Or register with async schema configuration
    MongooseRepositoryModule.forFeatureAsync({
      name: 'Post',
      imports: [ConfigModule], // Optional: import other modules if needed for configuration
      useFactory: (configService: ConfigService) => {
        const schema = new Schema({
          title: String,
          content: String,
          isPublished: { 
            type: Boolean, 
            default: configService.get('DEFAULT_PUBLISH_STATE') 
          },
        });
        
        // Add hooks, methods, etc.
        schema.pre('save', function() {
          console.log('Saving post...');
        });
        
        return schema;
      },
      inject: [ConfigService], // Optional: inject dependencies for useFactory
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

### Repository Usage

Inject and use the repository in your services:

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { RepositoryService } from 'mongoose-repo-module';
import { User } from './interfaces/user.interface';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: RepositoryService<User & Document>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    return await this.userRepository.create(createUserDto);
  }

  async findAll(filter = {}): Promise<User[]> {
    return await this.userRepository.find(filter);
  }

  async findById(id: string): Promise<User | null> {
    return await this.userRepository.findOne({ _id: id });
  }

  async update(id: string, updateData: Partial<User>): Promise<User | null> {
    return await this.userRepository.findOneAndUpdate(
      { _id: id },
      updateData,
    );
  }

  async remove(id: string): Promise<User | null> {
    return await this.userRepository.findOneAndDelete({ _id: id });
  }
}
```

## API Reference

### Module Registration

#### MongooseRepositoryModule.forFeature(options: RepositoryOptions)

Registers a repository with a predefined schema.

Parameters:
- `options.name`: The name of the model/repository
- `options.schema`: The Mongoose schema

#### MongooseRepositoryModule.forFeatureAsync(options: AsyncRepositoryOptions)

Registers a repository with an asynchronously generated schema.

Parameters:
- `options.name`: The name of the model/repository
- `options.useFactory`: Factory function that returns a schema
- `options.inject`: Optional array of dependencies to inject into the factory
- `options.imports`: Optional array of modules to import

### RepositoryService Methods

The `RepositoryService<T>` class provides the following methods:

#### create(data: Partial<T>): Promise<T>

Creates a new document in the collection. Automatically handles duplicate key errors.

#### find(filterQuery, projection?, options?): Promise<T[]>

Returns an array of documents that match the filter criteria.

- `filterQuery`: Mongoose filter query
- `projection`: Optional fields to include/exclude
- `options`: Optional Mongoose query options

#### findOne(filterQuery, projection?, options?): Promise<T | null>

Returns the first document that matches the filter criteria or null if none is found.

#### findOneAndUpdate(filterQuery, update, options?): Promise<T | null>

Finds a document matching the filter and updates it. Returns the updated document.

#### upsert(filterQuery, document): Promise<T>

Updates a document if it exists or creates it if it doesn't. Returns the updated/created document.

#### findOneAndDelete(filterQuery): Promise<T | null>

Finds and deletes a document. Returns the deleted document.

#### deleteMany(filterQuery): Promise<DeleteResult>

Deletes all documents matching the filter query. Returns the MongoDB delete result.

#### aggregate(pipeline, options?): Promise<any[]>

Executes an aggregation pipeline. Returns the result of the aggregation.

#### count(filterQuery): Promise<number>

Counts the number of documents matching the filter query.

## Advanced Usage

### Custom Repository Classes

You can extend the `RepositoryService` to create custom repositories with specialized methods:

```typescript
import { Injectable } from '@nestjs/common';
import { RepositoryService } from 'mongoose-repo-module';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UserRepository extends RepositoryService<UserDocument> {
  constructor(
    @InjectModel(User.name) userModel: Model<UserDocument>,
  ) {
    super(userModel);
  }

  // Add custom methods
  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.findOne({ email });
  }

  async findActiveUsers(): Promise<UserDocument[]> {
    return this.find({ isActive: true });
  }
}
```

## License

MIT
