export function ReplaceHolders(s: string, obj: any) {
  const c = s.split(' ');
  Object.keys(obj).forEach((key) => {
    const i = c.findIndex((v) => v === key);
    if (i !== -1) {
      c[i] = obj[key];
      if (i + 1 < c.length) c[i + 1] = ` ${c[i + 1]}`;
    }
  });
  const final = c.map((x: any) => {
    if (typeof x === 'string') {
      const y = `${x} `;
      return y;
    }
    return x;
  });
  return final;
}
