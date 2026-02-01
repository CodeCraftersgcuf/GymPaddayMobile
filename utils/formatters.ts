export const formatNaira = (value?: number | string) => {
  if (value === null || value === undefined) return "";
  const numeric =
    typeof value === "string"
      ? Number(value.replace(/[^\d.]/g, ""))
      : value;
  if (Number.isNaN(numeric)) return String(value);
  return `N${numeric.toLocaleString("en-NG")}`;
};
