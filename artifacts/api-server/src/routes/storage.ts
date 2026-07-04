import { Router, type IRouter, type Request, type Response } from "express";
import { Readable } from "stream";
import { z } from "zod";
import { ObjectStorageService, ObjectNotFoundError } from "../lib/objectStorage";

const router: IRouter = Router();
const objectStorageService = new ObjectStorageService();

const RequestUploadUrlBody = z.object({
  name: z.string(),
  size: z.number(),
  contentType: z.string(),
});

const RequestUploadUrlResponse = z.object({
  uploadURL: z.string(),
  objectPath: z.string(),
  metadata: z.object({ name: z.string(), size: z.number(), contentType: z.string() }),
});

/**
 * POST /storage/uploads/request-url
 * Request a presigned URL for file upload.
 * The client sends JSON metadata (name, size, contentType) — NOT the file.
 * Then uploads the file directly to the returned presigned URL.
 */
router.post("/storage/uploads/request-url", async (req: Request, res: Response) => {
  const parsed = RequestUploadUrlBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Missing or invalid required fields" });
    return;
  }

  try {
    const { name, size, contentType } = parsed.data;
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);

    res.json(
      RequestUploadUrlResponse.parse({
        uploadURL,
        objectPath,
        metadata: { name, size, contentType },
      }),
    );
  } catch (error) {
    req.log.error({ err: error }, "Error generating upload URL");
    res.status(500).json({ error: "Failed to generate upload URL" });
  }
});

/**
 * GET /storage/public-objects/*
 * Serve public assets — unconditionally public, no auth.
 */
router.get("/storage/public-objects/*filePath", async (req: Request, res: Response) => {
  try {
    const raw = req.params.filePath;
    const filePath = Array.isArray(raw) ? raw.join("/") : raw;
    const file = await objectStorageService.searchPublicObject(filePath);
    if (!file) {
      res.status(404).json({ error: "File not found" });
      return;
    }
    const response = await objectStorageService.downloadObject(file);
    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));
    if (response.body) {
      const nodeStream = Readable.fromWeb(response.body as ReadableStream<Uint8Array>);
      nodeStream.pipe(res);
    } else {
      res.end();
    }
  } catch (error) {
    req.log.error({ err: error }, "Error serving public object");
    res.status(500).json({ error: "Failed to serve public object" });
  }
});

/**
 * GET /storage/objects/*
 * Serve object entities uploaded via presigned URLs.
 *
 * Supports HTTP Range requests (RFC 7233) so iOS AVPlayer / expo-audio can
 * seek into audio and video files. Without a proper 206 response, iOS media
 * players send Range requests, receive a plain 200, and abort the connection.
 */
router.get("/storage/objects/*path", async (req: Request, res: Response) => {
  try {
    const raw = req.params.path;
    const wildcardPath = Array.isArray(raw) ? raw.join("/") : raw;
    const objectPath = `/objects/${wildcardPath}`;
    const objectFile = await objectStorageService.getObjectEntityFile(objectPath);

    // Fetch metadata once — we need size + content-type for range handling
    const [metadata] = await objectFile.getMetadata();
    const contentType = (metadata.contentType as string) || "application/octet-stream";
    const totalSize = Number(metadata.size) || 0;

    const rangeHeader = req.headers["range"];

    if (rangeHeader && totalSize > 0) {
      // ── Partial content (206) ─────────────────────────────────────────────
      // RFC 7233 §2.1: bytes=first-byte-pos "-" [ last-byte-pos ]
      const rangeMatch = rangeHeader.match(/^bytes=(\d+)-(\d*)$/);
      if (!rangeMatch) {
        res.status(416).setHeader("Content-Range", `bytes */${totalSize}`).end();
        return;
      }

      const start = parseInt(rangeMatch[1], 10);
      const end   = rangeMatch[2] ? Math.min(parseInt(rangeMatch[2], 10), totalSize - 1) : totalSize - 1;

      if (start > end || start >= totalSize) {
        res.status(416).setHeader("Content-Range", `bytes */${totalSize}`).end();
        return;
      }

      const chunkSize = end - start + 1;
      const stream = objectFile.createReadStream({ start, end });

      res.status(206);
      res.setHeader("Content-Range",  `bytes ${start}-${end}/${totalSize}`);
      res.setHeader("Accept-Ranges",  "bytes");
      res.setHeader("Content-Length", String(chunkSize));
      res.setHeader("Content-Type",   contentType);
      res.setHeader("Cache-Control",  "private, max-age=3600");
      stream.pipe(res);
    } else {
      // ── Full file (200) ───────────────────────────────────────────────────
      const stream = objectFile.createReadStream();

      res.status(200);
      res.setHeader("Accept-Ranges",  "bytes");          // tells iOS player it can range-request
      res.setHeader("Content-Type",   contentType);
      res.setHeader("Cache-Control",  "private, max-age=3600");
      if (totalSize > 0) res.setHeader("Content-Length", String(totalSize));
      stream.pipe(res);
    }
  } catch (error) {
    if (error instanceof ObjectNotFoundError) {
      req.log.warn({ err: error }, "Object not found");
      res.status(404).json({ error: "Object not found" });
      return;
    }
    req.log.error({ err: error }, "Error serving object");
    res.status(500).json({ error: "Failed to serve object" });
  }
});

export default router;
