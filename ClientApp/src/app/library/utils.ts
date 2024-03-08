export function _camelCase(key: string): any {
    return key?.length > 0 ? key[0].toLowerCase() + key.slice(1) : key;
}