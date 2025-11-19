// lib/imageProcessor.js
import sharp from "sharp";
import os from "os";

// Keep sharp lean & responsive
// A small concurrency avoids CPU thrash under parallel requests.
try {
  const cores = Math.max(1, (os.cpus()?.length || 4) - 1);
  sharp.concurrency(Math.min(4, cores));
} catch {}
sharp.cache(false);

function parseIntOrNull(v) {
  if (v === undefined || v === null || v === "") return null;
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}
function normalizeFormat(fmt) {
  if (!fmt) return "jpeg";
  fmt = String(fmt).toLowerCase();
  if (fmt === "jpg") return "jpeg";
  return fmt;
}
function mapEffortFor(format, effort /* 1..10 */) {
  const e = Math.max(1, Math.min(10, parseInt(effort || 6, 10)));
  switch (format) {
    case "webp":
      return Math.round((e - 1) * (6 / 9)); // 0..6
    case "avif":
      return Math.round((e - 1) * (9 / 9)); // 0..9
    case "png":
      return Math.round((e - 1) * (9 / 9)); // 0..9
    case "jpeg":
      return e; // we mimic "effort" by toggling flags
    default:
      return e;
  }
}
function pickContentType(fmt) {
  switch (fmt) {
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "avif":
      return "image/avif";
    default:
      return "application/octet-stream";
  }
}

export async function processImageBuffer(inputBuffer, settings = {}) {
  let requestedFormat = normalizeFormat(settings.format || "jpeg");
  const quality = Math.max(
    1,
    Math.min(100, parseInt(settings.quality || 80, 10))
  );
  const uiEffort = Math.max(
    1,
    Math.min(10, parseInt(settings.effort || 6, 10))
  );

  const widthReq = parseIntOrNull(settings.width);
  const heightReq = parseIntOrNull(settings.height);
  const maintainAspect = settings.maintainAspect !== false;

  let src = sharp(inputBuffer, { failOnError: false });
  const meta = await src.metadata();

  // Resize first
  if (widthReq || heightReq) {
    src = src.resize({
      width: widthReq || undefined,
      height: heightReq || undefined,
      fit: maintainAspect ? "inside" : "fill",
      withoutEnlargement: false,
      fastShrinkOnLoad: true,
    });
  }

  const pngLevel = mapEffortFor("png", uiEffort); // 0..9
  const webpEff = mapEffortFor("webp", uiEffort); // 0..6
  const avifEff = mapEffortFor("avif", uiEffort); // 0..9
  const jpegEff = mapEffortFor("jpeg", uiEffort); // 1..10

  async function encode(format) {
    const pipe = src.clone();
    let out;

    switch (format) {
      case "jpeg": {
        // Make "effort" affect encoder features; higher -> slower/smaller
        const hi = jpegEff >= 8;
        const mid = jpegEff >= 6;
        out = await pipe
          .jpeg({
            quality,
            mozjpeg: true,
            progressive: mid, // progressive only at medium+
            trellisQuantisation: hi, // heavy knobs only at high effort
            overshootDeringing: hi,
            optimiseScans: hi,
            chromaSubsampling: "4:2:0", // fastest/common
          })
          .toBuffer({ resolveWithObject: true });
        break;
      }
      case "png": {
        out = await pipe
          .png({
            compressionLevel: pngLevel, // 0..9
            palette: false, // no palette conversion
            quality: 100, // ignored by libvips for png; harmless
          })
          .toBuffer({ resolveWithObject: true });
        break;
      }
      case "webp": {
        out = await pipe
          .webp({
            quality,
            effort: webpEff, // 0..6
            nearLossless: false, // fully lossy; faster than lossless
          })
          .toBuffer({ resolveWithObject: true });
        break;
      }
      case "avif": {
        out = await pipe
          .avif({
            quality,
            effort: avifEff, // 0..9
            chromaSubsampling: "4:2:0", // speed wins; good size
          })
          .toBuffer({ resolveWithObject: true });
        break;
      }
      default: {
        // fallback to jpeg
        out = await pipe
          .jpeg({ quality, mozjpeg: true })
          .toBuffer({ resolveWithObject: true });
        format = "jpeg";
      }
    }
    return { ...out, format };
  }

  let encoded;
  try {
    encoded = await encode(requestedFormat);
  } catch {
    encoded = await encode("jpeg");
    requestedFormat = "jpeg";
  }

  const { data: outBuf, info } = encoded;
  const contentType = pickContentType(encoded.format);
  const headers = {
    "Content-Type": contentType,
    "X-Image-Width": String(info.width || meta.width || ""),
    "X-Image-Height": String(info.height || meta.height || ""),
    "X-Image-Format": encoded.format,
  };

  return { buffer: outBuf, headers };
}

// Question. We have built this All an it is working Great. but Now Turning it into a service is what we want. How can we make it so we
// can create a webhook api route and provide to the user. and they can call it with their image Quality Resize(if not there = original)
// effort and all the other things. when completed  it automatically opens a website route of ours and it downloads the completed images.
// in a zip or if its a single file ofc we'll also show how the webhook api route of our works and what do u need to pass to it.
// single file example and batch example determining by type: in the api parameters ig. also figure out how we can send large iamges
// like 5-10mb(theres only like 2 images like those that we'll send so its fine.) we can try Using multipart/form-data + disabling Next.js body parser.
// when calling webhook or whatever idk also how can we generate a webhook api route for each website that contacts us and gets saved?.
// figure that out and all of this new code will be just  a new thing btw Not touching the old code Except adding the exampels of how to call it and such
// like generating webhook for each website if not possible we can just make it so we have 1-50(only add 1 right now i said 50 because we'll also add a webhook to check which servers
// are free and before we call the optimizing webhook we check the server thats free!) and all websites around the wrld do that?.. i guess could work for example for batch we can example it by from a folder using
// FS and filepath in nextjs or smth we can get the images and send thru. or the user himself creates a file tag and drops images there and sends thru their own ui. also these files
// need to be in multiple files not just 1 because this is gonna be now highlvl stuff in webhook response we could say how much mb we saved in batch or how much its lowered by in kb with single. 
// and All the stuff like that. we wont intrigate zip naming in the webhook. because its too complicated. and Yeah this webhook route we could make it at like
// /webhook/optimize/check-servers-availible/route.js(could make more of thse in like a [1-10]) and /webhook/optimize/image/[id]/route.js yk.
