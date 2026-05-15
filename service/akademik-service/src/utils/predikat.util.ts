export function hitungPredikat(ipk: number): string {
  if (ipk >= 3.51) return "Dengan Pujian";
  if (ipk >= 3.01) return "Sangat Memuaskan";
  if (ipk >= 2.76) return "Memuaskan";

  return "Cukup";
}