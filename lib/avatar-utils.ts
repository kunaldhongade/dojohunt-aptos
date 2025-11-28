/**
 * Generate a consistent random background color for a given string
 * This ensures the same string always gets the same color
 */
export function getAvatarColor(name: string): string {
  // Predefined color palette for avatars
  const colors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-amber-500",
    "bg-yellow-500",
    "bg-lime-500",
    "bg-green-500",
    "bg-emerald-500",
    "bg-teal-500",
    "bg-cyan-500",
    "bg-sky-500",
    "bg-blue-500",
    "bg-indigo-500",
    "bg-violet-500",
    "bg-purple-500",
    "bg-fuchsia-500",
    "bg-pink-500",
    "bg-rose-500",
  ];

  // Generate a simple hash from the name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Use the hash to select a color
  const colorIndex = Math.abs(hash) % colors.length;
  return colors[colorIndex];
}

/**
 * Get the first letter of a name for avatar display
 */
export function getAvatarInitial(name: string): string {
  if (!name || name.trim().length === 0) {
    return "?";
  }

  // Get the first character and convert to uppercase
  const firstChar = name.trim().charAt(0).toUpperCase();

  // If it's a letter, return it; otherwise return a default
  return /[A-Z]/.test(firstChar) ? firstChar : "?";
}

/**
 * Generate avatar props for consistent styling
 */
export function getAvatarProps(name: string) {
  return {
    initial: getAvatarInitial(name),
    colorClass: getAvatarColor(name),
  };
}
