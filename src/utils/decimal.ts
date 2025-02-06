export function formatValueWithDecimalPlaces(value: bigint, decimalPlaces: number): string {
  const paddedValue = value.toString().padStart(decimalPlaces, '0');
  if (!decimalPlaces) {
    return paddedValue;
  }

  return `${paddedValue.slice(0, -decimalPlaces).padStart(1, '0')}.${paddedValue.slice(-decimalPlaces)}`;
}