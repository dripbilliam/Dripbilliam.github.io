/*
Resource Icon Ripper (console script)

How to use:
1) Open the page that lists the icon files in your browser.
2) Open DevTools Console.
3) Paste this entire script and press Enter.
4) By default, this runs in dry-run mode and only prints matches.
5) Set DRY_RUN = false and run again to download files.
*/

(() => {
  const DRY_RUN = true;
  const DOWNLOAD_DELAY_MS = 180;

  // Collect all PNGs except entries containing "map".
  const EXTENSIONS = [".png"];
  const EXCLUDE_IF_CONTAINS = ["map"];

  const normalize = (value) => String(value || "").toLowerCase();
  const hasAllowedExtension = (url) => EXTENSIONS.some((ext) => normalize(url).includes(ext));
  const isExcluded = (url) => {
    const fileName = (() => {
      try {
        return new URL(url, window.location.href).pathname.split("/").pop() || "";
      } catch {
        const raw = String(url || "");
        const strippedQuery = raw.split("?")[0];
        const parts = strippedQuery.split("/");
        return parts[parts.length - 1] || "";
      }
    })();

    const low = normalize(fileName);
    return EXCLUDE_IF_CONTAINS.some((word) => low.includes(word));
  };

  const toAbsoluteUrl = (rawUrl) => {
    try {
      return new URL(rawUrl, window.location.href).href;
    } catch {
      return "";
    }
  };

  const cleanRawUrl = (value) => String(value || "")
    .replace(/\\\//g, "/")
    .replace(/&amp;/gi, "&")
    .replace(/^['"]+|['"]+$/g, "")
    .replace(/[),;]+$/g, "")
    .trim();

  const hrefs = Array.from(document.querySelectorAll("a[href]"), (a) => a.getAttribute("href") || "");
  const srcs = Array.from(document.querySelectorAll("img[src]"), (img) => img.getAttribute("src") || "");

  // Some map pages store resource icon URLs in inline scripts/config JSON, not in visible href/src attrs.
  const htmlText = document.documentElement.outerHTML;
  const htmlHttpPngMatches = htmlText.match(/https?:[^"'\s)<>]+\.png(?:\?[^"'\s)<>]*)?/gi) || [];
  const htmlProtoRelativePngMatches = htmlText.match(/\/\/[^"'\s)<>]+\.png(?:\?[^"'\s)<>]*)?/gi) || [];

  const candidates = [...hrefs, ...srcs, ...htmlHttpPngMatches, ...htmlProtoRelativePngMatches]
    .map(cleanRawUrl)
    .map(toAbsoluteUrl)
    .filter(Boolean)
    .filter((url) => hasAllowedExtension(url))
    .filter((url) => !isExcluded(url));

  const uniqueUrls = Array.from(new Set(candidates)).sort((a, b) => a.localeCompare(b));

  console.log(`[ResourceRipper] Matches: ${uniqueUrls.length}`);
  uniqueUrls.forEach((url, index) => {
    console.log(`${String(index + 1).padStart(2, "0")}. ${url}`);
  });

  if (DRY_RUN || uniqueUrls.length === 0) {
    console.log("[ResourceRipper] Dry run complete. Set DRY_RUN=false to download.");
    return;
  }

  const downloadOne = (url, index) => {
    const pathname = new URL(url).pathname;
    const fileName = pathname.split("/").pop() || `icon-${index + 1}.png`;

    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  uniqueUrls.forEach((url, index) => {
    setTimeout(() => downloadOne(url, index), index * DOWNLOAD_DELAY_MS);
  });

  const totalTimeMs = uniqueUrls.length * DOWNLOAD_DELAY_MS;
  console.log(`[ResourceRipper] Download started for ${uniqueUrls.length} files (~${Math.ceil(totalTimeMs / 1000)}s).`);
})();
