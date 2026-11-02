import { Container } from "@/components/ui/container";
import { imageUrl } from "@/lib/images";
import { getT } from "@/lib/market";
import type { VideoNode } from "@/lib/builder-components";
import type { NodeProps } from "./context";
import { DraftHint } from "./draft-hint";

/** `title` keys m.blocks, for the iframe's accessible name. */
type Source = { kind: "embed"; src: string; title: "youtubeVideo" | "vimeoVideo" } | { kind: "file"; src: string };

/** A YouTube or Vimeo link becomes an embed; anything else is played as a video file. */
const sourceFor = (url: string, autoplay: boolean): Source | null => {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (!/^https?:$/.test(parsed.protocol)) return null;
  const host = parsed.hostname.replace(/^www\.|^m\./, "");
  const youtube =
    host === "youtu.be" ? parsed.pathname.slice(1) : host === "youtube.com" || host === "youtube-nocookie.com" ? (parsed.searchParams.get("v") ?? parsed.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]+)/)?.[1]) : null;
  if (youtube && /^[\w-]{6,20}$/.test(youtube)) {
    const params = new URLSearchParams({ rel: "0", ...(autoplay ? { autoplay: "1", mute: "1", loop: "1", playlist: youtube } : {}) });
    return { kind: "embed", src: `https://www.youtube-nocookie.com/embed/${youtube}?${params}`, title: "youtubeVideo" };
  }
  const vimeo = host === "vimeo.com" || host === "player.vimeo.com" ? parsed.pathname.match(/(\d{6,})/)?.[1] : null;
  if (vimeo) {
    const params = new URLSearchParams({ dnt: "1", ...(autoplay ? { autoplay: "1", muted: "1", loop: "1" } : {}) });
    return { kind: "embed", src: `https://player.vimeo.com/video/${vimeo}?${params}`, title: "vimeoVideo" };
  }
  return { kind: "file", src: url };
};

export async function Video({ node, ctx }: NodeProps<VideoNode>) {
  const { url, poster, caption, autoplay } = node.fields;
  const source = url ? sourceFor(url, autoplay) : null;
  if (!source && !ctx.draft) return null;
  const { m } = await getT();
  const e = ctx.edit;
  return (
    <section className="py-12 sm:py-16" {...e.node(node)}>
      <Container width="wide">
        <figure>
          <div className="relative aspect-video overflow-hidden rounded-3xl bg-stone-900" {...e.field(node.id, "url")}>
            {!source ? (
              <div className="absolute inset-0 p-6">
                <DraftHint>Add an MP4 file or a YouTube or Vimeo link.</DraftHint>
              </div>
            ) : source.kind === "embed" ? (
              <iframe src={source.src} title={caption ?? m.blocks[source.title]} className="absolute inset-0 size-full" loading="lazy" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
            ) : (
              <video
                src={source.src}
                poster={poster ? imageUrl(poster.url) : undefined}
                className="absolute inset-0 size-full object-cover"
                controls={!autoplay}
                preload="metadata"
                playsInline
                {...(autoplay ? { autoPlay: true, muted: true, loop: true } : {})}
              />
            )}
          </div>
          {caption && (
            <figcaption className="mt-3 text-center text-sm text-stone-500" {...e.text(node.id, "caption")}>
              {caption}
            </figcaption>
          )}
        </figure>
      </Container>
    </section>
  );
}
