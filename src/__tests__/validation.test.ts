import { validateAddresses, isValidAddress, parseAmount, formatAmount } from '../utils/validation';

describe('Validation Utils', () => {
  describe('isValidAddress', () => {
    test('should validate correct Ethereum addresses', () => {
      const validAddresses = [
        '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', // Real Ethereum address (vitalik.eth)
        '0x0000000000000000000000000000000000000000',
        '0xa0b86a33e6441d7d8e9e64b40a72f5b6c76ea5bd' // lowercase is also valid
      ];

      validAddresses.forEach(addr => {
        expect(isValidAddress(addr)).toBe(true);
      });
    });

    test('should reject invalid addresses', () => {
      const invalidAddresses = [
        '',
        '0x123',
        'not-an-address',
        '0xZZZd35Cc6aBfC0532435A8a8f4a9b7D8a6d8bb3c'
      ];

      invalidAddresses.forEach(addr => {
        expect(isValidAddress(addr)).toBe(false);
      });
    });
  });

  describe('validateAddresses', () => {
    test('should separate valid and invalid addresses', () => {
      const addresses = [
        '0xa0b86a33e6441d7d8e9e64b40a72f5b6c76ea5bd', // valid
        '0x123', // invalid
        '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', // valid
        'not-an-address' // invalid
      ];

      const result = validateAddresses(addresses);

      expect(result.valid).toHaveLength(2);
      expect(result.invalid).toHaveLength(2);
      expect(result.valid).toContain('0xa0b86a33e6441d7d8e9e64b40a72f5b6c76ea5bd');
      expect(result.valid).toContain('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
      expect(result.invalid).toContain('0x123');
      expect(result.invalid).toContain('not-an-address');
    });
  });

  describe('amount parsing and formatting', () => {
    test('should parse amounts correctly', () => {
      expect(parseAmount('1', 18)).toBe('1000000000000000000');
      expect(parseAmount('100', 6)).toBe('100000000');
      expect(parseAmount('0.5', 18)).toBe('500000000000000000');
    });

    test('should format amounts correctly', () => {
      expect(formatAmount('1000000000000000000', 18)).toBe('1.0');
      expect(formatAmount('100000000', 6)).toBe('100.0');
      expect(formatAmount('500000000000000000', 18)).toBe('0.5');
    });
  });
});