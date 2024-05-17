import React from 'react';

export function replacePlaceholders(
  string: string,
  replacements: { holder: string; replacement: string | React.ReactNode }[]
): (string | React.ReactNode)[] {
  if (!string || !replacements || replacements.length === 0) {
    console.error(
      'Invalid input: string or replacements are missing or empty.'
    );
    return [];
  }

  let result: (string | React.ReactNode)[] = [string];

  replacements.forEach(({ holder, replacement }) => {
    const updatedResult: (string | React.ReactNode)[] = [];

    result.forEach((element) => {
      if (typeof element === 'string') {
        const parts: string[] = (element as string).split(holder);
        parts.forEach((part, i) => {
          if (i !== parts.length - 1) {
            updatedResult.push(part, replacement);
          } else {
            updatedResult.push(part);
          }
        });
      } else {
        updatedResult.push(element);
      }
    });

    result = updatedResult;
  });

  return result;
}
