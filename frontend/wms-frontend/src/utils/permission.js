export const getRole = () => localStorage.getItem("user_role") || "operator";

export const hasPermission = (allowedRoles) => {
  const role = getRole();
  return allowedRoles.includes(role);
};
