const englishLanguageCodes = ['en', 'eng', 'en-us', 'en-gb', 'en-ca', 'en-au', 'en-in', 'english'];

const toArraySafe = (val: any) =>
  val == null ? [] : (Array.isArray(val) ? val : [val]);

export const isDubbed = (item: any): boolean => {
    const languages = toArraySafe(item?.AudioLanguages).map(lang => lang.toLowerCase());
    if (languages.length >= 1 && englishLanguageCodes.some(code => languages.includes(code))) {
        return true;
    }
    return false;
}

export const isSubbed = (item: any): boolean => {
    const languages = toArraySafe(item?.SubtitleLanguages).map(lang => lang.toLowerCase());
    if (languages.length >= 1 && englishLanguageCodes.some(code => languages.includes(code))) {
        return true;
    }
    return false;
}
