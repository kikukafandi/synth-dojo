// src/lib/pvp.test.js

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { evaluateCode } from '../evaluator.js';
import { calculateMatchScore } from '../utils.js';
import { prisma } from '../prisma.js'; 



// --- Variabel untuk menyimpan data dari DB ---
let user1FromDb;
let user2FromDb;
let questionFromDb;
let parsedTestCases;

// --- Kode Solusi Palsu ---
const KODE_BENAR = `function sum(a, b) { return a + b; }`;
const KODE_SALAH = `function sum(a, b) { return a * b; }`; // Skor akan lebih rendah

describe('PvP Match Logic (with DB)', () => {

  // 2. Ambil data dari DB *sebelum* tes berjalan
  beforeAll(async () => {
    // Ambil user admin dan user sample dari seed
    user1FromDb = await prisma.user.findUnique({
      where: { email: "admin@synthdojo.com" }
    });
    user2FromDb = await prisma.user.findUnique({
      where: { email: "user@synthdojo.com" }
    });

    // Ambil soal "Sum Two Numbers" dari seed
    questionFromDb = await prisma.question.findFirst({
      where: { title: "Sum Two Numbers" }
    });

    if (!user1FromDb || !user2FromDb || !questionFromDb) {
      throw new Error("Gagal menemukan data tes. Jalankan `npm run db:seed` terlebih dahulu.");
    }

    // Ubah string JSON dari DB menjadi objek
    parsedTestCases = JSON.parse(questionFromDb.testCases);
  });

  // 3. Tutup koneksi DB *setelah* semua tes selesai
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should determine correct winner based on code evaluation', async () => {
    
    // 1. Evaluasi User 1 (correct) menggunakan data DB
    const result1 = await evaluateCode(KODE_BENAR, parsedTestCases);
    const score1 = calculateMatchScore(result1.correct, result1.runtimeMs, result1.styleScore, questionFromDb.points);
    
    // 2. Evaluasi User 2 (wrong) menggunakan data DB
    const result2 = await evaluateCode(KODE_SALAH, parsedTestCases);
    const score2 = calculateMatchScore(result2.correct, result2.runtimeMs, result2.styleScore, questionFromDb.points);
    
    // 3. Tentukan pemenang (logika yang sama seperti di socket-server.js)
    let winnerId = null;
    if (score1 > score2) {
      winnerId = user1FromDb.id;
    } else if (score2 > score1) {
      winnerId = user2FromDb.id;
    }
    
    // 4. Verifikasi hasil
    expect(result1.correct).toBe(true);  // <-- INI AKAN GAGAL
    expect(result2.correct).toBe(false);
    expect(score1).toBeGreaterThan(0);   // <-- INI AKAN GAGAL
    expect(score2).toBe(0);
    expect(winnerId).toBe(user1FromDb.id); // <-- INI AKAN GAGAL
  });
});