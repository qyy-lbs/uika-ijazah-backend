export function getDummyGrade(index: number) {
  const position = index + 1;

  if (position <= 8) {
    return {
      nilai_huruf: "A",
      nilai_angka: 4.0,
    };
  }

  if (position <= 13) {
    return {
      nilai_huruf: "AB",
      nilai_angka: 3.5,
    };
  }

  if (position <= 17) {
    return {
      nilai_huruf: "B",
      nilai_angka: 3.0,
    };
  }

  if (position <= 19) {
    return {
      nilai_huruf: "BC",
      nilai_angka: 2.5,
    };
  }

  return {
    nilai_huruf: "A",
    nilai_angka: 4.0,
  };
}