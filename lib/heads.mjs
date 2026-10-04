// A timeline's head (kind 30829), unsigned: both readers build it here and sign and send it their own way. Pure; no DOM, no relay.
// d comes from the title once and never changes; a replacement keeps d, t and every other tag, and is a second newer than the one it replaces.
export const HEAD_KIND = 30829, MARKER = "wikitimechain";
export const slug = t => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const now = () => Math.floor(Date.now() / 1000), named = ({ title, summary }) => [["title", title], ...(summary ? [["summary", summary]] : [])];
const after = (cur, tags) => ({ kind:HEAD_KIND, created_at:Math.max(now(), cur.created_at + 1), content:cur.content, tags });
export const newHead = (v, d = slug(v.title), src) => ({ kind:HEAD_KIND, created_at:now(), content:"", tags:[["d", d], ...named(v), ["t", MARKER], ...(src ? [["a", src]] : [])] });   // d and src given: your copy of a name, pointing at the one you came from
export const retitled = (cur, v) => after(cur, [...cur.tags.filter(t => t[0] !== "title" && t[0] !== "summary"), ...named(v)]);   // title and summary replaced
export const withSources = (cur, coords) => after(cur, [...cur.tags.filter(t => !(t[0] === "a" && t[1].startsWith(HEAD_KIND + ":"))), ...coords.map(c => ["a", c])]);   // the timelines it points at, replaced whole; any other tag kept
