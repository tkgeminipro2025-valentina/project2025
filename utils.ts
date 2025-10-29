// These utility functions convert object keys between camelCase and snake_case
// to seamlessly handle data between the JavaScript frontend and the PostgreSQL backend.

const toCamel = (s: string): string => {
  return s.replace(/([-_][a-z])/ig, ($1) => {
    return $1.toUpperCase()
      .replace('-', '')
      .replace('_', '');
  });
};

const toSnake = (s: string): string => {
    // Avoids adding a leading underscore for an already snake_cased string that starts with a lowercase letter.
    return s.replace(/[A-Z]/g, (letter, index) => {
        return index === 0 ? letter.toLowerCase() : `_${letter.toLowerCase()}`;
    });
};

const isObject = (o: any): boolean => o === Object(o) && !Array.isArray(o) && typeof o !== 'function';

export const keysToCamel = (o: any): any => {
  if (isObject(o)) {
    const n: { [key: string]: any } = {};
    Object.keys(o)
      .forEach((k) => {
        n[toCamel(k)] = keysToCamel(o[k]);
      });
    return n;
  } else if (Array.isArray(o)) {
    return o.map((i) => {
      return keysToCamel(i);
    });
  }
  return o;
};

export const keysToSnake = (o: any): any => {
    if (isObject(o)) {
        const n: { [key: string]: any } = {};
        Object.keys(o)
            .forEach((k) => {
                n[toSnake(k)] = keysToSnake(o[k]);
            });
        return n;
    } else if (Array.isArray(o)) {
        return o.map((i) => {
            return keysToSnake(i);
        });
    }
    return o;
};
