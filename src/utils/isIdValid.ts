export const isIdValid = (id: number) => {
  if (isNaN(id)) {
    return false;
  }

  const stringId = id.toString();
  return !(stringId.length < 5 || stringId.length > 12);
}