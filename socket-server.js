// socket-server.js

import { createServer } from "http";
import { Server } from "socket.io";
import { prisma } from "./src/lib/prisma.js"; // Import Prisma client Anda
import { evaluateCode } from "./src/lib/evaluator.js"; // Import evaluator
import { calculateMatchScore, updateHP } from "./src/lib/utils.js"; // Import utils
// (Pastikan path impor di atas sesuai dengan struktur proyek Anda)

const httpServer = createServer();
const io = new Server(httpServer, {
    cors: {
        origin: process.env.CORS_ORIGIN || "http://localhost:3000", // Izinkan koneksi dari frontend Next.js Anda
        methods: ["GET", "POST"],
    },
});

// Daftar pemain yang sedang menunggu match
const waitingPlayers = [];

// Fungsi untuk membuat match di database (diadaptasi dari api/battle/start)
async function createPvpMatch(player1, player2) {
    try {
        // 1. Ambil soal
        // (Anda bisa pakai logika yang sama dari /api/battle/start untuk memilih soal)
        const question = await prisma.question.findFirst({
            where: { isPublished: true, difficulty: { lte: player1.level + 1 } },
            orderBy: { updatedAt: "desc" }, // Logika pemilihan soal bisa Anda kembangkan
        });

        if (!question) throw new Error("No questions available");

        // 2. Buat Match di database
        const match = await prisma.match.create({
            data: {
                mode: "pvp", // Mode PvP!
                status: "in_progress",
                startedAt: new Date(),
                // Buat DUA partisipan manusia
                participants: {
                    create: [
                        { userId: player1.userId, isAI: false, isReady: true },
                        { userId: player2.userId, isAI: false, isReady: true },
                    ],
                },
                questions: {
                    create: { questionId: question.id, order: 1 },
                },
            },
        });

        return { match, question };
    } catch (error) {
        console.error("Failed to create PvP match:", error);
        return null;
    }
}

// Logika utama server WebSocket
io.on("connection", (socket) => {
    console.log(`[${new Date().toISOString()}] User connected: ${socket.id}`);

    // 1. Matchmaking: Saat user mencari lawan
    socket.on("find_match", async (userData) => {
        console.log(`[${new Date().toISOString()}] User ${userData.userId} (Level ${userData.level}) is looking for a match.`);

        // Simpan data user di socket untuk digunakan nanti
        socket.userData = userData;

        // Cari lawan yang selevel di antrian
        const opponentIndex = waitingPlayers.findIndex(
            (player) =>
                Math.abs(player.userData.level - userData.level) <= 2 && // Toleransi level
                player.userData.userId !== userData.userId // Bukan user yang sama
        );

        if (opponentIndex !== -1) {
            // --- LAWAN DITEMUKAN ---
            const opponentSocket = waitingPlayers.splice(opponentIndex, 1)[0];
            console.log(`Match found: ${userData.userId} vs ${opponentSocket.userData.userId}`);

            // Buat match di database
            const { match, question } = await createPvpMatch(
                userData,
                opponentSocket.userData
            );

            if (match) {
                const matchRoom = match.id;

                // Masukkan kedua pemain ke "room" yang sama
                socket.join(matchRoom);
                opponentSocket.join(matchRoom);

                // Kirim event 'match_found' ke KEDUA pemain
                io.to(matchRoom).emit("match_found", {
                    matchId: match.id,
                    question,
                    players: [userData, opponentSocket.userData],
                });
            } else {
                // Gagal buat match, kembalikan kedua pemain ke antrian (atau kirim error)
                socket.emit("match_error", "Failed to create match room.");
                opponentSocket.emit("match_error", "Failed to create match room.");
            }
        } else {
            // --- LAWAN TIDAK DITEMUKAN ---
            console.log(`User ${userData.userId} added to waiting queue.`);
            waitingPlayers.push(socket);
            socket.emit("waiting_for_opponent");
        }
    });

    // 2. Real-time Progress: Saat user mengetik
    socket.on("typing_progress", ({ matchId, progress }) => {
        // Kirim progress ke lawan di room yang sama
        // 'socket.to' mengirim ke semua orang di room KECUALI si pengirim
        socket.to(matchId).emit("opponent_progress", { progress });
    });

    // 3. Submit Kode: Saat user menekan "Submit"
    socket.on("submit_code", async ({ matchId, questionId, code }) => {
        if (!socket.userData) return socket.emit("match_error", "Authentication error.");

        const userId = socket.userData.userId;
        console.log(`User ${userId} submitted code for match ${matchId}`);

        try {
            // Evaluasi kode (menggunakan evaluator Anda)
            const question = await prisma.question.findUnique({ where: { id: questionId } });
            const userResult = await evaluateCode(code, question.testCases);
            const userScore = calculateMatchScore(
                userResult.correct,
                userResult.runtimeMs,
                userResult.styleScore,
                question.points
            );

            // Simpan hasil submission
            await prisma.matchSubmission.create({
                data: {
                    matchId,
                    userId,
                    questionId,
                    code,
                    isCorrect: userResult.correct,
                    score: userScore,
                    runtimeMs: userResult.runtimeMs,
                    styleScore: userResult.styleScore,
                    output: JSON.stringify(userResult.testResults),
                    error: userResult.error,
                },
            });

            socket.emit("submission_received"); // Beri tahu user "Submission diterima, menunggu lawan"

            // Cek apakah lawan sudah submit
            const opponentSubmission = await prisma.matchSubmission.findFirst({
                where: {
                    matchId,
                    NOT: { userId },
                },
            });

            if (opponentSubmission) {
                // --- KEDUA PEMAIN SUDAH SUBMIT ---
                console.log(`Match ${matchId} finished. Calculating results...`);

                const opponentScore = opponentSubmission.score;
                let winnerId = null;
                
                // Debug log untuk debugging
                console.log(`User ${userId} score: ${userScore}, Opponent ${opponentSubmission.userId} score: ${opponentScore}`);
                
                if (userScore > opponentScore) {
                    winnerId = userId;
                    console.log(`Winner: ${userId} (user)`);
                } else if (opponentScore > userScore) {
                    winnerId = opponentSubmission.userId;
                    console.log(`Winner: ${opponentSubmission.userId} (opponent)`);
                } else {
                    // Seri - tidak ada pemenang
                    winnerId = null;
                    console.log(`Match is a tie`);
                }

                // Update Match
                await prisma.match.update({
                    where: { id: matchId },
                    data: {
                        status: "completed",
                        completedAt: new Date(),
                        winnerId: winnerId,
                    },
                });

                // Update stats kedua pemain
                const user = await prisma.user.findUnique({ where: { id: userId } });
                const opponent = await prisma.user.findUnique({ where: { id: opponentSubmission.userId } });

                // Update Pemenang
                if (winnerId) {
                    const winner = winnerId === userId ? user : opponent;
                    const winnerScore = winnerId === userId ? userScore : opponentScore;
                    await prisma.user.update({
                        where: { id: winner.id },
                        data: {
                            points: { increment: winnerScore },
                            hp: updateHP(winner.hp, true),
                        },
                    });
                    await prisma.leaderboardEntry.update({
                        where: { userId: winner.id },
                        data: {
                            points: { increment: winnerScore },
                            wins: { increment: 1 },
                        },
                    });
                }

                // Update Kalah (atau seri)
                const loser = winnerId === userId ? opponent : (winnerId === opponent.id ? user : null);
                if (loser) {
                    const loserScore = loser.id === userId ? userScore : opponentScore;
                    await prisma.user.update({
                        where: { id: loser.id },
                        data: {
                            points: { increment: Math.floor(loserScore * 0.3) }, // Poin partisipasi
                            hp: updateHP(loser.hp, false),
                        },
                    });
                    await prisma.leaderboardEntry.update({
                        where: { userId: loser.id },
                        data: {
                            points: { increment: Math.floor(loserScore * 0.3) },
                            losses: { increment: 1 },
                        },
                    });
                }

                // Kirim hasil akhir ke KEDUA pemain
                io.to(matchId).emit("match_finished", {
                    winnerId: winnerId,
                    results: [
                        { userId: userId, score: userScore, result: userResult },
                        { userId: opponentSubmission.userId, score: opponentScore },
                    ],
                });

                // Kosongkan room
                io.sockets.socketsLeave(matchId);
            }
        } catch (error) {
            console.error(`Error during submission for user ${userId}:`, error);
            socket.emit("match_error", "Failed to process your submission.");
        }
    });

    // 3.5. Cancel Match: User cancels matchmaking
    socket.on("cancel_match", () => {
        if (socket.userData) {
            const index = waitingPlayers.findIndex(
                (player) => player.userData.userId === socket.userData.userId
            );
            if (index !== -1) {
                waitingPlayers.splice(index, 1);
                console.log(`User ${socket.userData.userId} cancelled matchmaking.`);
            }
        }
    });

    // 4. Disconnect: Hapus user dari antrian jika dia disconnect
    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
        if (socket.userData) {
            const index = waitingPlayers.findIndex(
                (player) => player.userData.userId === socket.userData.userId
            );
            if (index !== -1) {
                waitingPlayers.splice(index, 1);
                console.log(`User ${socket.userData.userId} removed from queue.`);
            }
        }
    });
});

const PORT = process.env.SOCKET_PORT || 3001;

// Test database connection
async function testDatabaseConnection() {
    try {
        const userCount = await prisma.user.count();
        console.log(`Database connected. Found ${userCount} users.`);
    } catch (error) {
        console.error("Database connection failed:", error);
        process.exit(1);
    }
}

testDatabaseConnection().then(() => {
    httpServer.listen(PORT, '0.0.0.0', () => {
        console.log(`Synth-Dojo WebSocket server listening on 0.0.0.0:${PORT}`);
    });
    
    httpServer.on('error', (error) => {
        console.error('Server error:', error);
    });
});