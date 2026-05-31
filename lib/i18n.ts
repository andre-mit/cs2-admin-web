import 'server-only';

const dictionaries = {
  en: () => import('../dictionaries/en').then((module) => module.default),
  pt: () => import('../dictionaries/pt').then((module) => module.default),
};

export const getDictionary = async (locale: string) => {
  if (!dictionaries[locale as keyof typeof dictionaries]) {
    return dictionaries.en();
  }
  return dictionaries[locale as keyof typeof dictionaries]();
};
