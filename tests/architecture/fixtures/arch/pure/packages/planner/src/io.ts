// Breaks rule A6: I/O imports, randomness, network and process.
import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

export const io = async () => [
  readFileSync,
  PrismaClient,
  Math.random(),
  performance.now(),
  await fetch("https://example.com"),
  process.env,
  Bun.file("x"),
];
