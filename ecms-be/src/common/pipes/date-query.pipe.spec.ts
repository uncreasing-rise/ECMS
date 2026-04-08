import { describe, expect, it } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import { OptionalDatePipe, RequiredDatePipe } from './date-query.pipe.js';

describe('date-query pipes', () => {
  describe('OptionalDatePipe', () => {
    it('returns undefined for empty input', () => {
      const pipe = new OptionalDatePipe('from_date');

      expect(pipe.transform(undefined)).toBeUndefined();
      expect(pipe.transform('')).toBeUndefined();
    });

    it('parses a valid date string', () => {
      const pipe = new OptionalDatePipe('from_date');

      const result = pipe.transform('2026-04-08T00:00:00.000Z');

      expect(result).toBeInstanceOf(Date);
      expect(result?.toISOString()).toBe('2026-04-08T00:00:00.000Z');
    });

    it('throws for invalid input', () => {
      const pipe = new OptionalDatePipe('from_date');

      expect(() => pipe.transform('not-a-date')).toThrow(
        BadRequestException,
      );
    });
  });

  describe('RequiredDatePipe', () => {
    it('parses a valid date string', () => {
      const pipe = new RequiredDatePipe('to_date');

      const result = pipe.transform('2026-04-08T00:00:00.000Z');

      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString()).toBe('2026-04-08T00:00:00.000Z');
    });

    it('throws when value is missing', () => {
      const pipe = new RequiredDatePipe('to_date');

      expect(() => pipe.transform(undefined)).toThrow(BadRequestException);
      expect(() => pipe.transform('')).toThrow(BadRequestException);
    });

    it('throws when value is invalid', () => {
      const pipe = new RequiredDatePipe('to_date');

      expect(() => pipe.transform('invalid')).toThrow(BadRequestException);
    });
  });
});