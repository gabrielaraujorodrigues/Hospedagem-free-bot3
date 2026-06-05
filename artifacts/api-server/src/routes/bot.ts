import { Router, type IRouter } from "express";
import { botManager } from "../lib/bot-manager";
import {
  GetBotStatusResponse,
  StartBotResponse,
  StopBotResponse,
  RestartBotResponse,
  RequestPairingCodeBody,
  RequestPairingCodeResponse,
  GetBotLogsQueryParams,
  GetBotLogsResponse,
  GetBotStatsResponse,
  ResetBotSessionResponse,
  GetAutoRestartResponse,
  SetAutoRestartBody,
  SetAutoRestartResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/bot/status", async (_req, res): Promise<void> => {
  const status = botManager.getStatus();
  res.json(GetBotStatusResponse.parse(status));
});

router.post("/bot/start", async (_req, res): Promise<void> => {
  const started = botManager.start("normal");
  res.json(
    StartBotResponse.parse({
      success: started,
      message: started ? "Bot started successfully" : "Bot is already running or failed to start",
    })
  );
});

router.post("/bot/stop", async (_req, res): Promise<void> => {
  const stopped = botManager.stop();
  res.json(
    StopBotResponse.parse({
      success: stopped,
      message: stopped ? "Bot stopped" : "Bot was not running",
    })
  );
});

router.post("/bot/restart", async (_req, res): Promise<void> => {
  const restarted = botManager.restart();
  res.json(
    RestartBotResponse.parse({
      success: restarted,
      message: restarted ? "Bot restarting..." : "Failed to restart bot",
    })
  );
});

router.post("/bot/pairing-code", async (req, res): Promise<void> => {
  const parsed = RequestPairingCodeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { phoneNumber } = parsed.data;
  req.log.info({ phoneNumber }, "Requesting pairing code");

  const code = await botManager.requestPairingCode(phoneNumber);
  res.json(
    RequestPairingCodeResponse.parse({
      success: code !== null,
      message: code
        ? `Pairing code generated for ${phoneNumber}`
        : "Timed out waiting for pairing code. Check bot logs.",
      code,
    })
  );
});

router.get("/bot/logs", async (req, res): Promise<void> => {
  const params = GetBotLogsQueryParams.safeParse(req.query);
  const limit = params.success ? (params.data.limit ?? 100) : 100;
  const logs = botManager.getLogs(limit);
  res.json(GetBotLogsResponse.parse({ logs }));
});

router.get("/bot/stats", async (_req, res): Promise<void> => {
  const stats = botManager.getStats();
  res.json(GetBotStatsResponse.parse(stats));
});

router.post("/bot/reset", async (_req, res): Promise<void> => {
  const ok = botManager.resetSession();
  res.json(
    ResetBotSessionResponse.parse({
      success: ok,
      message: ok ? "Session reset. Bot stopped and session files deleted." : "Failed to reset session",
    })
  );
});

router.get("/bot/auto-restart", async (_req, res): Promise<void> => {
  const config = botManager.getAutoRestartConfig();
  res.json(GetAutoRestartResponse.parse(config));
});

router.post("/bot/auto-restart", async (req, res): Promise<void> => {
  const parsed = SetAutoRestartBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { enabled, delaySeconds } = parsed.data;
  botManager.setAutoRestart(enabled, delaySeconds ?? 5);
  const config = botManager.getAutoRestartConfig();
  res.json(SetAutoRestartResponse.parse(config));
});

export default router;
