import Image from "next/image";

export type AvatarState = "repos" | "ecoute" | "reflexion" | "parole" | "soutien" | "alerte";

const STATES: AvatarState[] = ["repos", "ecoute", "reflexion", "parole", "soutien", "alerte"];

const animation: Record<AvatarState, string> = {
  repos: "anim-float",
  ecoute: "anim-glow",
  reflexion: "anim-float",
  parole: "anim-talk",
  soutien: "anim-glow",
  alerte: "anim-alert",
};

/**
 * Avatar officiel IPsy. Les 6 expressions sont empilées et fondues entre elles
 * pour des transitions douces sans rechargement d'image.
 */
export default function Avatar({
  state = "repos",
  size = 160,
  label,
  priority = false,
}: {
  state?: AvatarState;
  size?: number;
  label?: string;
  priority?: boolean;
}) {
  const ring = state === "alerte" ? "ring-orange-400/70" : "ring-turq-400/60";
  return (
    <div
      role="img"
      aria-label={label ?? `IPsy — ${state}`}
      className={`relative shrink-0 overflow-hidden rounded-[28%] bg-nuit-950 ring-2 ${ring} ${animation[state]} transition-[box-shadow] duration-500`}
      style={{ width: size, height: size }}
    >
      {STATES.map((s) => (
        <Image
          key={s}
          src={`/avatar/${s}.png`}
          alt=""
          fill
          sizes={`${size}px`}
          priority={priority && s === "repos"}
          className={`object-cover object-top transition-opacity duration-500 ${s === state ? "opacity-100" : "opacity-0"}`}
        />
      ))}
    </div>
  );
}
