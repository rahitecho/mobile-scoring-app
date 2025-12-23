import { BaseQueryFn } from '@reduxjs/toolkit/query';
import { supabase } from '@/utils/supabase';

export const supabaseBaseQuery: BaseQueryFn<
  {
    endpoint: string;
    method: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
    body?: any;
    params?: Record<string, any>;
    options?: any;
  },
  unknown,
  unknown
> = async ({ endpoint, method, body, params = {}, options = {} }) => {
  try {
    let result;

    switch (method) {
      case 'SELECT': {
        const selectOptions: any = {};
        if (options.count) selectOptions.count = options.count;
        if (options.head) selectOptions.head = options.head;

        let query = supabase
          .from(endpoint)
          .select(options.select || '*', selectOptions);

        // Add filters if params exist
        Object.keys(params).forEach((key) => {
          const value = params[key];
          if (value !== undefined && value !== null) {
            if (options.operators && options.operators[key]) {
              // Use specified operator
              const operator = options.operators[key];
              query = query[operator](key, value);
            } else {
              // Default to eq operator
              query = query.eq(key, value);
            }
          }
        });

        // Add OR filter if specified
        if (options.or) {
          query = query.or(options.or);
        }

        // Add limit if specified
        if (options.limit) {
          query = query.limit(options.limit);
        }

        // Add order if specified
        if (options.order) {
          const { column, ascending = true } = options.order;
          query = query.order(column, { ascending });
        }

        // Add pagination if specified
        if (options.range) {
          const { from, to } = options.range;
          query = query.range(from, to);
        }

        // Handle single item requests
        if (options && options.single) {
          result = await query.single();
        } else {
          result = await query;
        }
        break;
      }

      case 'INSERT': {
        let query = supabase.from(endpoint).insert(body);

        // Add select if specified in params
        const selectQuery = params.select || options.select || '*';
        query = query.select(selectQuery);

        result = await query;
        break;
      }

      case 'UPDATE': {
        let query = supabase.from(endpoint).update(body);

        // Add filters if params exist
        Object.keys(params).forEach((key) => {
          const value = params[key];
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });

        if (options && options.returning) {
          result = await query.select();
        } else {
          result = await query;
        }
        break;
      }

      case 'DELETE': {
        let query = supabase.from(endpoint).delete();

        // Add filters if params exist
        Object.keys(params).forEach((key) => {
          const value = params[key];
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });

        if (options && options.returning) {
          result = await query.select();
        } else {
          result = await query;
        }
        break;
      }

      default:
        return {
          error: {
            status: 400,
            data: `Unsupported method ${method}`,
          },
        };
    }

    if (result.error) {
      return {
        error: {
          status: result.status || 500,
          data: result.error,
        },
      };
    }

    return { data: result.data, count: result.count };
  } catch (error) {
    return {
      error: {
        status: 500,
        data: error,
      },
    };
  }
};