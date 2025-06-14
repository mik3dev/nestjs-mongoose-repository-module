import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Document, Model, Schema, connect, Connection as MongooseConnection } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { RepositoryService } from './repository.service';
import { Types } from 'mongoose';

// Define a test interface that extends Document
interface TestDocument extends Document {
  name: string;
  email: string;
  age: number;
  active: boolean;
  createdAt: Date;
}

describe('RepositoryService', () => {
  let service: RepositoryService<TestDocument>;
  let mongod: MongoMemoryServer;
  let mongoConnection: MongooseConnection;
  let testModel: Model<TestDocument>;
  
  const testSchema = new Schema<TestDocument>({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    age: { type: Number, default: 0 },
    active: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  });
  
  beforeAll(async () => {
    // Start an in-memory MongoDB server for testing
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    const mongoose = await connect(uri);
    mongoConnection = mongoose.connection;
    
    // Create a test model
    testModel = mongoConnection.model<TestDocument>('Test', testSchema);
    
    // Set up the testing module with our test model
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: getModelToken('__PLACEHOLDER___'),
          useValue: testModel,
        },
        RepositoryService,
      ],
    }).compile();
    
    service = module.get<RepositoryService<TestDocument>>(RepositoryService);
  }, 60000); // Increase timeout for slow CI environments
  
  afterAll(async () => {
    await mongoConnection.close();
    await mongod.stop();
  });
  
  afterEach(async () => {
    // Clear the test collection after each test
    await testModel.deleteMany({});
  });
  
  describe('create', () => {
    it('should create a document with _id', async () => {
      // Arrange
      const testData = {
        name: 'Test User',
        email: 'test@example.com',
        age: 30,
        active: true
      };
      
      // Act
      const result = await service.create(testData);
      
      // Assert
      expect(result).toBeDefined();
      expect(result._id).toBeDefined();
      expect(result.name).toBe(testData.name);
      expect(result.email).toBe(testData.email);
      expect(result.age).toBe(testData.age);
      expect(result.active).toBe(testData.active);
      
      // Verify document was saved to database
      const savedDoc = await testModel.findById(result._id);
      expect(savedDoc).toBeDefined();
      expect(savedDoc?.name).toBe(testData.name);
    });
  });
  
  describe('find', () => {
    it('should find documents matching filter criteria', async () => {
      // Arrange
      await testModel.create([
        { name: 'User 1', email: 'user1@example.com', age: 25, active: true },
        { name: 'User 2', email: 'user2@example.com', age: 30, active: false },
        { name: 'User 3', email: 'user3@example.com', age: 35, active: true },
      ]);
      
      // Act
      const results = await service.find({ active: true });
      
      // Assert
      expect(results).toBeDefined();
      expect(results.length).toBe(2);
      expect(results[0].name).toBe('User 1');
      expect(results[1].name).toBe('User 3');
    });
    
    it('should return empty array when no documents match', async () => {
      // Act
      const results = await service.find({ name: 'Non-existent' });
      
      // Assert
      expect(results).toEqual([]);
    });
    
    it('should apply projection to limit returned fields', async () => {
      // Arrange
      await testModel.create({
        name: 'Test User',
        email: 'test@example.com',
        age: 30,
        active: true
      });
      
      // Act
      const results = await service.find({}, { name: 1, email: 1 });
      
      // Assert
      expect(results[0]).toHaveProperty('name');
      expect(results[0]).toHaveProperty('email');
      expect(results[0]).not.toHaveProperty('age');
      expect(results[0]).not.toHaveProperty('active');
    });
  });
  
  describe('findOne', () => {
    it('should find a single document matching criteria', async () => {
      // Arrange
      const testUser = await testModel.create({
        name: 'Find One Test',
        email: 'findone@example.com',
        age: 40,
        active: true
      });
      
      // Act
      const result = await service.findOne({ email: 'findone@example.com' });
      
      // Assert
      expect(result).toBeDefined();
      expect(result?._id?.toString()).toBe(testUser._id?.toString());
      expect(result?.name).toBe('Find One Test');
    });
    
    it('should return null when no document matches', async () => {
      // Act
      const result = await service.findOne({ email: 'nonexistent@example.com' });
      
      // Assert
      expect(result).toBeNull();
    });
  });
  
  describe('findOneAndUpdate', () => {
    it('should update a document and return the updated version', async () => {
      // Arrange
      const testUser = await testModel.create({
        name: 'Original Name',
        email: 'update@example.com',
        age: 25,
        active: false
      });
      
      // Act
      const result = await service.findOneAndUpdate(
        { _id: testUser._id },
        { $set: { name: 'Updated Name', active: true } }
      );
      
      // Assert
      expect(result).toBeDefined();
      expect(result?.name).toBe('Updated Name');
      expect(result?.active).toBe(true);
      
      // Verify updates were saved
      const updatedDoc = await testModel.findById(testUser._id);
      expect(updatedDoc?.name).toBe('Updated Name');
      expect(updatedDoc?.active).toBe(true);
    });
    
    it('should return null when no document matches', async () => {
      // Act
      const result = await service.findOneAndUpdate(
        { _id: new Types.ObjectId() },
        { $set: { name: 'Updated Name' } }
      );
      
      // Assert
      expect(result).toBeNull();
    });
  });
  
  describe('upsert', () => {
    it('should update existing document when found', async () => {
      // Arrange
      const testUser = await testModel.create({
        name: 'Upsert Test',
        email: 'upsert@example.com',
        age: 50,
        active: false
      });
      
      // Act
      const result = await service.upsert(
        { email: 'upsert@example.com' },
        { name: 'Upserted Name', active: true }
      );
      
      // Assert
      expect(result).toBeDefined();
      expect(result?._id?.toString()).toBe(testUser._id?.toString());
      expect(result?.name).toBe('Upserted Name');
      expect(result?.active).toBe(true);
    });
    
    it('should create new document when not found', async () => {
      // Act
      const result = await service.upsert(
        { email: 'new-upsert@example.com' },
        { name: 'New Upsert', email: 'new-upsert@example.com', age: 60 }
      );
      
      // Assert
      expect(result).toBeDefined();
      expect(result?.name).toBe('New Upsert');
      expect(result?.email).toBe('new-upsert@example.com');
      
      // Verify document was created
      const newDoc = await testModel.findOne({ email: 'new-upsert@example.com' });
      expect(newDoc).toBeDefined();
    });
  });
  
  describe('findOneAndDelete', () => {
    it('should delete document and return the deleted document', async () => {
      // Arrange
      const testUser = await testModel.create({
        name: 'Delete Test',
        email: 'delete@example.com',
        age: 45
      });
      
      // Act
      const result = await service.findOneAndDelete({ _id: testUser._id });
      
      // Assert
      expect(result).toBeDefined();
      expect(result?._id?.toString()).toBe(testUser._id?.toString());
      
      // Verify document was deleted
      const deletedDoc = await testModel.findById(testUser._id);
      expect(deletedDoc).toBeNull();
    });
    
    it('should return null when no document matches', async () => {
      // Act
      const result = await service.findOneAndDelete({ _id: new Types.ObjectId() });
      
      // Assert
      expect(result).toBeNull();
    });
  });
  
  describe('deleteMany', () => {
    it('should delete multiple documents matching criteria', async () => {
      // Arrange
      await testModel.create([
        { name: 'Delete 1', email: 'delete1@example.com', age: 30, active: true },
        { name: 'Delete 2', email: 'delete2@example.com', age: 30, active: true },
        { name: 'Keep', email: 'keep@example.com', age: 40, active: false },
      ]);
      
      // Act
      const result = await service.deleteMany({ age: 30 });
      
      // Assert
      expect(result).toBeDefined();
      expect(result.deletedCount).toBe(2);
      
      // Verify documents were deleted
      const remainingDocs = await testModel.find({});
      expect(remainingDocs.length).toBe(1);
      expect(remainingDocs[0].name).toBe('Keep');
    });
  });
  
  describe('count', () => {
    it('should count documents matching criteria', async () => {
      // Arrange
      await testModel.create([
        { name: 'Count 1', email: 'count1@example.com', age: 20, active: true },
        { name: 'Count 2', email: 'count2@example.com', age: 20, active: false },
        { name: 'Count 3', email: 'count3@example.com', age: 30, active: true },
      ]);
      
      // Act
      const count1 = await service.count({ age: 20 });
      const count2 = await service.count({ active: true });
      const count3 = await service.count({ age: 50 });
      
      // Assert
      expect(count1).toBe(2);
      expect(count2).toBe(2);
      expect(count3).toBe(0);
    });
  });
  
  describe('aggregate', () => {
    it('should perform aggregation pipeline operations', async () => {
      // Arrange
      await testModel.create([
        { name: 'Agg 1', email: 'agg1@example.com', age: 20, active: true },
        { name: 'Agg 2', email: 'agg2@example.com', age: 30, active: true },
        { name: 'Agg 3', email: 'agg3@example.com', age: 40, active: true },
      ]);
      
      // Act
      const results = await service.aggregate([
        { $match: { active: true } },
        { $group: { _id: null, avgAge: { $avg: '$age' }, count: { $sum: 1 } } },
      ]);
      
      // Assert
      expect(results).toBeDefined();
      expect(results.length).toBe(1);
      expect(results[0].avgAge).toBe(30);
      expect(results[0].count).toBe(3);
    });
  });
});
