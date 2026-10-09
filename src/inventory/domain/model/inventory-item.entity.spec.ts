import { InventoryItem } from './inventory-item.entity';

describe('InventoryItem', () => {
  const item = (quantities: number[], lowStockThreshold = 10) =>
    new InventoryItem({
      lowStockThreshold,
      stocks: quantities.map((quantity, index) => ({
        locationId: index + 1,
        quantity,
      })),
    });

  it('adds the quantity kept at every storage location', () => {
    expect(item([12, 3.5]).totalQuantity).toBe(15.5);
    expect(item([12, 3.5]).quantityAt(2)).toBe(3.5);
    expect(item([12]).quantityAt(9)).toBe(0);
  });

  it('classifies the stock against the low-stock threshold', () => {
    expect(item([0]).stockCondition).toBe('out-of-stock');
    expect(item([6, 4]).stockCondition).toBe('low-stock');
    expect(item([8, 4]).stockCondition).toBe('in-stock');
  });
});
