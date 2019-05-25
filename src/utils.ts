export const serialize = (obj: any) => {
  const str = [];
  for (const p in obj) {
    if (obj.hasOwnProperty(p)) {
      str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
    }
  }
  return str.join("&");
};
export const propertyExists = (key: string, search: any) => {
  if (
    !search ||
    (search.constructor !== Array && search.constructor !== Object)
  ) {
    return false;
  }

  return search[key] !== undefined;
};
