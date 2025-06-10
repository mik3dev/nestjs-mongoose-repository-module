import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Document, Types, FilterQuery, QueryOptions, UpdateQuery, DeleteResult, PipelineStage, AggregateOptions } from "mongoose";

@Injectable()
export class RepositoryService<T extends Document> {
  constructor(@InjectModel('__PLACEHOLDER___') private readonly model: Model<T>) { }

  async create(data: Partial<T>): Promise<T> {
    try {
      const _id = new Types.ObjectId();
      data['_id'] = _id;
      return await this.model.create(data);
    } catch (error: any) {
      if (error?.code === 11000) {
        const key = Object.keys(error.keyValue)[0];
        throw new Error(`Duplicate key ${key} error`);
      }
      throw error;
    }
  }

  async find(
    filterQuery: FilterQuery<T>,
    projection?: Record<string, unknown>,
    options?: QueryOptions,
  ): Promise<T[]> {
    return this.model.find(
      filterQuery,
      { ...projection },
      { lean: true, ...options },
    );
  }

  async findOne(
    filterQuery: FilterQuery<T>,
    projection?: Record<string, unknown>,
    options?: QueryOptions,
  ): Promise<T | null> {
    return await this.model.findOne(
      filterQuery,
      { ...projection },
      { lean: true, ...options },
    );
  }

  async findOneAndUpdate(
    filterQuery: FilterQuery<T>,
    update: UpdateQuery<T>,
    options?: QueryOptions,
  ): Promise<T | null> {
    return await this.model.findOneAndUpdate(filterQuery, update, {
      lean: true,
      new: true,
      ...options,
    });
  }

  async upsert(
    filterQuery: FilterQuery<T>,
    document: Partial<T>,
  ): Promise<T> {
    return await this.model.findOneAndUpdate(filterQuery, document, {
      upsert: true,
      new: true,
    });
  }

  async findOneAndDelete(filterQuery: FilterQuery<T>): Promise<T | null> {
    return await this.model.findOneAndDelete(filterQuery, {
      new: true,
    });
  }

  async deleteMany(filterQuery: FilterQuery<T>): Promise<DeleteResult> {
    return await this.model.deleteMany(filterQuery);
  }

  async aggregate(pipeline: PipelineStage[], options?: AggregateOptions) {
    return this.model.aggregate(pipeline, options);
  }

  async count(filterQuery: FilterQuery<T>): Promise<number> {
    return await this.model.countDocuments(filterQuery);
  }
}