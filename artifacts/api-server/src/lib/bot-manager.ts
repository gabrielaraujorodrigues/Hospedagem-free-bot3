import { spawn, type ChildProcess } from "child_process";
import path from "path";
import fs from "fs";
import { logger } from "./logger";

export type BotState =
  | "stopped"
  | "starting"
  | "running"
  | "connected"
  | "disconnected"
  | "error";

export interface LogEntry {
  timestamp: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
}

export interface BotStatus {
  state: BotState;
  pid: number | null;
  uptime: number | null;
  autoRestart: boolean;
  botName: string;
  nodeVersion: string;
  phoneNumber: string | null;
  qrCode: string | null;
  restartCount: number;
}

export interface BotStats {
  totalRestarts: number;
  uptime: number | null;
  state: BotState;
  autoRestart: boolean;
  startedAt: string | null;
  lastRestartAt: string | null;
}

const workspaceRoot = process.cwd().endsWith(path.join("artifacts", "api-server"))
  ? path.resolve(process.cwd(), "../..")
  : process.cwd();

const BOT_DIR = path.resolve(workspaceRoot, "bots/jordan-bot");
const MAX_LOGS = 500;
const BOT_NAME = "Jordan Bot - Versão 3";

class BotManager {
  private process: ChildProcess | null = null;
  private state: BotState = "stopped";
  private logs: LogEntry[] = [];
  private autoRestart = true;
  private autoRestartDelay = 5;
  private startedAt: Date | null = null;
  private lastRestartAt: Date | null = null;
  private restartCount = 0;
  private phoneNumber: string | null = null;
  private qrCode: string | null = null;
  private restartTimer: NodeJS.Timeout | null = null;
  private pendingPairingCode: string | null = null;
  private pairingCodeResolve: ((code: string | null) => void) | null = null;

  private addLog(level: LogEntry["level"], message: string) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message: message.trim(),
    };
    this.logs.push(entry);
    if (this.logs.length > MAX_LOGS) {
      this.logs = this.logs.slice(-MAX_LOGS);
    }
  }

  private detectLevel(line: string): LogEntry["level"] {
    const lower = line.toLowerCase();
    if (lower.includes("error") || lower.includes("erro") || lower.includes("fatal")) return "error";
    if (lower.includes("warn") || lower.includes("aviso")) return "warn";
    if (lower.includes("debug")) return "debug";
    return "info";
  }

  private parseLine(line: string) {
    if (!line.trim()) return;

    const level = this.detectLevel(line);
    this.addLog(level, line);

    // Detect pairing code (format: XXXX-XXXX)
    const pairingMatch = line.match(/\b([A-Z0-9]{4}-[A-Z0-9]{4})\b/);
    if (pairingMatch && this.pairingCodeResolve) {
      this.pendingPairingCode = pairingMatch[1];
      this.pairingCodeResolve(pairingMatch[1]);
      this.pairingCodeResolve = null;
    }

    // Detect connection events
    const lower = line.toLowerCase();
    if (
      lower.includes("connected") ||
      lower.includes("conectado") ||
      lower.includes("open") ||
      lower.includes("bem-vindo") ||
      lower.includes("session opened")
    ) {
      this.state = "connected";
      this.qrCode = null;
    } else if (
      lower.includes("disconnected") ||
      lower.includes("desconectado") ||
      lower.includes("logout") ||
      lower.includes("session closed")
    ) {
      this.state = "disconnected";
    } else if (lower.includes("connecting") || lower.includes("conectando")) {
      if (this.state === "starting") this.state = "running";
    }

    // Detect QR code from our injected marker
    if (line.startsWith("__QR_BASE64__:")) {
      this.qrCode = line.slice("__QR_BASE64__:".length).trim();
      if (this.state === "running" || this.state === "starting") {
        this.state = "running"; // keep running state while waiting for scan
      }
      return; // don't log this line (it's huge base64)
    }

    // Fallback: detect inline data URI (legacy)
    if (line.includes("data:image") && line.includes("base64")) {
      const match = line.match(/(data:image\/[^;]+;base64,[A-Za-z0-9+/=]+)/);
      if (match) this.qrCode = match[1];
    }
  }

  start(mode: "qr" | "code" | "normal" = "qr"): boolean {
    if (this.process && this.state !== "stopped" && this.state !== "error") {
      this.addLog("warn", "Bot already running");
      return false;
    }

    if (!fs.existsSync(BOT_DIR)) {
      this.addLog("error", `Bot directory not found: ${BOT_DIR}`);
      this.state = "error";
      return false;
    }

    if (!fs.existsSync(path.join(BOT_DIR, "node_modules"))) {
      this.addLog("warn", "node_modules not found, bot may fail to start. Install dependencies first.");
    }

    this.state = "starting";
    this.qrCode = null;
    this.startedAt = new Date();
    this.addLog("info", `Starting Jordan Bot - Versão 3 with npm start (mode: ${mode})...`);

    const args = mode === "code" ? ["start", "--", "code"] :
                 mode === "qr"   ? ["start", "--", "qr"] :
                                   ["start"];

    this.process = spawn("npm", args, {
      cwd: BOT_DIR,
      env: { ...process.env, FORCE_COLOR: "0" },
      stdio: ["pipe", "pipe", "pipe"],
      shell: true,
    });

    this.process.stdout?.on("data", (chunk: Buffer) => {
      const lines = chunk.toString().split("\n");
      for (const line of lines) {
        if (line.trim()) this.parseLine(line);
      }
    });

    this.process.stderr?.on("data", (chunk: Buffer) => {
      const lines = chunk.toString().split("\n");
      for (const line of lines) {
        if (line.trim()) {
          const level = this.detectLevel(line);
          this.addLog(level, line.trim());
        }
      }
    });

    this.process.on("spawn", () => {
      this.addLog("info", `Bot process started (PID: ${this.process?.pid})`);
      if (this.state === "starting") this.state = "running";
    });

    this.process.on("error", (err) => {
      this.addLog("error", `Process error: ${err.message}`);
      this.state = "error";
      this.process = null;
    });

    this.process.on("exit", (code, signal) => {
      const msg = `Bot process exited (code: ${code}, signal: ${signal})`;
      this.addLog(code === 0 ? "info" : "warn", msg);
      logger.info({ code, signal }, "Bot process exited");
      this.process = null;
      this.state = "stopped";

      if (this.autoRestart && code !== null && code !== 0) {
        this.addLog("info", `Auto-restart in ${this.autoRestartDelay}s...`);
        this.lastRestartAt = new Date();
        this.restartCount++;
        this.restartTimer = setTimeout(() => {
          this.addLog("info", `Auto-restarting bot (restart #${this.restartCount})...`);
          this.start("qr");
        }, this.autoRestartDelay * 1000);
      }
    });

    return true;
  }

  stop(): boolean {
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }

    if (!this.process) {
      this.addLog("warn", "Bot is not running");
      return false;
    }

    this.addLog("info", "Stopping bot...");
    this.process.kill("SIGTERM");

    setTimeout(() => {
      if (this.process) {
        this.addLog("warn", "Force killing bot process...");
        this.process.kill("SIGKILL");
        this.process = null;
        this.state = "stopped";
      }
    }, 5000);

    return true;
  }

  restart(): boolean {
    this.addLog("info", "Restarting bot...");
    this.stop();
    this.lastRestartAt = new Date();
    this.restartCount++;
    setTimeout(() => this.start("qr"), 2000);
    return true;
  }

  async requestPairingCode(phoneNumber: string): Promise<string | null> {
    this.stop();
    await new Promise((r) => setTimeout(r, 2000));
    this.phoneNumber = phoneNumber;
    this.addLog("info", `Requesting pairing code for ${phoneNumber}...`);

    const codePromise = new Promise<string | null>((resolve) => {
      this.pairingCodeResolve = resolve;
      setTimeout(() => {
        if (this.pairingCodeResolve) {
          this.pairingCodeResolve = null;
          resolve(null);
        }
      }, 30000);
    });

    this.start("code");
    return codePromise;
  }

  resetSession(): boolean {
    this.stop();
    const sessionDirs = [
      path.join(BOT_DIR, "session"),
      path.join(BOT_DIR, "sessions"),
      path.join(BOT_DIR, "auth_info_baileys"),
      path.join(BOT_DIR, "GataBotMD_auth_info"),
      path.join(BOT_DIR, "credentials"),
    ];

    let deleted = 0;
    for (const dir of sessionDirs) {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
        deleted++;
        this.addLog("info", `Deleted session directory: ${path.basename(dir)}`);
      }
    }

    this.qrCode = null;
    this.phoneNumber = null;
    this.addLog("info", `Session reset complete. Deleted ${deleted} session director${deleted === 1 ? "y" : "ies"}.`);
    return true;
  }

  getStatus(): BotStatus {
    return {
      state: this.state,
      pid: this.process?.pid ?? null,
      uptime: this.startedAt
        ? Math.floor((Date.now() - this.startedAt.getTime()) / 1000)
        : null,
      autoRestart: this.autoRestart,
      botName: BOT_NAME,
      nodeVersion: process.version,
      phoneNumber: this.phoneNumber,
      qrCode: this.qrCode,
      restartCount: this.restartCount,
    };
  }

  getStats(): BotStats {
    return {
      totalRestarts: this.restartCount,
      uptime: this.startedAt
        ? Math.floor((Date.now() - this.startedAt.getTime()) / 1000)
        : null,
      state: this.state,
      autoRestart: this.autoRestart,
      startedAt: this.startedAt?.toISOString() ?? null,
      lastRestartAt: this.lastRestartAt?.toISOString() ?? null,
    };
  }

  getLogs(limit = 100): LogEntry[] {
    return this.logs.slice(-limit);
  }

  setAutoRestart(enabled: boolean, delaySeconds = 5) {
    this.autoRestart = enabled;
    this.autoRestartDelay = delaySeconds;
    this.addLog("info", `Auto-restart ${enabled ? "enabled" : "disabled"} (delay: ${delaySeconds}s)`);
  }

  getAutoRestartConfig() {
    return {
      enabled: this.autoRestart,
      delaySeconds: this.autoRestartDelay,
    };
  }
}

export const botManager = new BotManager();
