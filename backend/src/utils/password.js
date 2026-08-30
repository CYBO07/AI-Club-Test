import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export async function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

// Generates a strong temporary password, e.g. "Xk4#mQ9pRt2!"
const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const LOWER = "abcdefghijkmnpqrstuvwxyz";
const DIGITS = "23456789";
const SYMBOLS = "!@#$%&*";
const ALL = UPPER + LOWER + DIGITS + SYMBOLS;

function randChar(set) {
  return set[Math.floor(Math.random() * set.length)];
}

export function generateTempPassword(length = 12) {
  const required = [randChar(UPPER), randChar(LOWER), randChar(DIGITS), randChar(SYMBOLS)];
  const rest = Array.from({ length: length - required.length }, () => randChar(ALL));
  const chars = [...required, ...rest];
  // shuffle
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}
